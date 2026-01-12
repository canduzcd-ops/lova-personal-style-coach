import { useState, useRef, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { optimizeImageDataUrl } from '../services/imageOptimizer';
// Compress image helper (now delegated to shared optimizer)
const compressImage = async (base64, maxSize = 800) => {
    // Keep same behavior contract: always return a dataUrl string (or original on failure)
    return await optimizeImageDataUrl(base64, {
        maxDimension: maxSize,
        quality: 0.8,
        mimeType: 'image/jpeg',
    });
};
// Check and request camera permissions
const checkAndRequestPermissions = async (source) => {
    console.log('[ImagePicker] Checking permissions for:', source);
    try {
        const permissionType = source === 'camera' ? 'camera' : 'photos';
        console.log('[ImagePicker] Calling Camera.checkPermissions()...');
        const status = await Camera.checkPermissions();
        console.log('[ImagePicker] Current permission status:', JSON.stringify(status));
        const permissionStatus = permissionType === 'camera' ? status.camera : status.photos;
        if (permissionStatus === 'granted') {
            console.log('[ImagePicker] Permission already granted');
            return true;
        }
        if (permissionStatus === 'denied') {
            console.warn(`[ImagePicker] ${permissionType} permission denied. Will request...`);
        }
        // Request permissions
        console.log('[ImagePicker] Requesting permissions...');
        const requestResult = await Camera.requestPermissions({ permissions: [permissionType] });
        console.log('[ImagePicker] Permission request result:', JSON.stringify(requestResult));
        const newStatus = permissionType === 'camera' ? requestResult.camera : requestResult.photos;
        if (newStatus === 'granted' || newStatus === 'limited') {
            console.log('[ImagePicker] Permission granted after request');
            return true;
        }
        console.error(`[ImagePicker] ${permissionType} permission not granted:`, newStatus);
        return false;
    }
    catch (err) {
        console.error('[ImagePicker] Permission check error:', err);
        // On web or if permission check fails, try to proceed anyway
        console.log('[ImagePicker] Proceeding anyway after permission error');
        return true;
    }
};
export const useImagePicker = (options = {}) => {
    const { quality = 80, maxWidth = 800, maxHeight = 800, onImageSelected, onError } = options;
    const [isPickerVisible, setPickerVisible] = useState(false);
    const fileInputRef = useRef(null);
    const isNative = Capacitor.isNativePlatform();
    const pickImage = useCallback(async (source) => {
        console.log('[ImagePicker] pickImage called with source:', source, 'isNative:', isNative);
        try {
            if (isNative) {
                // Check permissions first on native platforms
                console.log('[ImagePicker] Native platform detected, checking permissions...');
                const hasPermission = await checkAndRequestPermissions(source);
                if (!hasPermission) {
                    console.error('[ImagePicker] Permission denied, aborting');
                    const permError = new Error(source === 'camera'
                        ? 'Kamera izni verilmedi. Lütfen ayarlardan izin verin.'
                        : 'Galeri izni verilmedi. Lütfen ayarlardan izin verin.');
                    onError?.(permError);
                    setPickerVisible(false);
                    return null;
                }
                // Native (Android/iOS) - use Capacitor Camera with Uri for better memory handling
                const cameraSource = source === 'camera' ? CameraSource.Camera : CameraSource.Photos;
                console.log('[ImagePicker] Calling Camera.getPhoto with source:', cameraSource);
                const photo = await Camera.getPhoto({
                    quality,
                    allowEditing: false,
                    resultType: CameraResultType.Uri, // Use Uri instead of Base64 for stability
                    source: cameraSource,
                    width: maxWidth,
                    height: maxHeight,
                    correctOrientation: true,
                    promptLabelHeader: source === 'camera' ? 'Fotoğraf Çek' : 'Fotoğraf Seç',
                    promptLabelPhoto: 'Galeriden Seç',
                    promptLabelPicture: 'Kamera ile Çek',
                });
                console.log('[ImagePicker] Photo received:', {
                    webPath: photo.webPath,
                    path: photo.path,
                    format: photo.format
                });
                // Convert Uri to Blob to DataURL
                const photoPath = photo.webPath || photo.path;
                if (photoPath) {
                    console.log('[ImagePicker] Fetching photo from path:', photoPath);
                    const response = await fetch(photoPath);
                    const blob = await response.blob();
                    console.log('[ImagePicker] Blob size:', blob.size, 'type:', blob.type);
                    // Convert blob to dataURL
                    const dataUrl = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            console.log('[ImagePicker] FileReader completed');
                            resolve(reader.result);
                        };
                        reader.onerror = () => reject(new Error('Dosya okunamadı'));
                        reader.readAsDataURL(blob);
                    });
                    console.log('[ImagePicker] DataURL length:', dataUrl.length);
                    const compressed = await compressImage(dataUrl, maxWidth);
                    console.log('[ImagePicker] Compressed image length:', compressed.length);
                    onImageSelected?.(compressed);
                    setPickerVisible(false);
                    return compressed;
                }
                else {
                    console.error('[ImagePicker] No photo path returned');
                    throw new Error('Fotoğraf yolu alınamadı');
                }
            }
            else {
                // Web fallback - use file input
                console.log('[ImagePicker] Web platform, using file input');
                if (fileInputRef.current) {
                    // For camera on web, use capture attribute to prompt camera on iOS Safari
                    if (source === 'camera') {
                        fileInputRef.current.setAttribute('capture', 'environment');
                    }
                    else {
                        fileInputRef.current.removeAttribute('capture');
                    }
                    fileInputRef.current.click();
                }
                setPickerVisible(false);
            }
            return null;
        }
        catch (error) {
            console.error('[ImagePicker] Error:', error);
            console.error('[ImagePicker] Error message:', error?.message);
            console.error('[ImagePicker] Error code:', error?.code);
            // If camera fails, try gallery as fallback
            if (source === 'camera' && isNative) {
                console.log('[ImagePicker] Camera failed, falling back to gallery');
                try {
                    const photo = await Camera.getPhoto({
                        quality,
                        allowEditing: false,
                        resultType: CameraResultType.Base64,
                        source: CameraSource.Photos,
                        width: maxWidth,
                        height: maxHeight,
                        correctOrientation: true,
                    });
                    if (photo.base64String) {
                        const base64 = `data:image/${photo.format};base64,${photo.base64String}`;
                        const compressed = await compressImage(base64, maxWidth);
                        onImageSelected?.(compressed);
                        setPickerVisible(false);
                        return compressed;
                    }
                }
                catch (fallbackError) {
                    onError?.(fallbackError);
                }
            }
            else {
                onError?.(error);
            }
            setPickerVisible(false);
            return null;
        }
    }, [isNative, quality, maxWidth, maxHeight, onImageSelected, onError]);
    const handleFileInput = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const base64 = ev.target?.result;
            const compressed = await compressImage(base64, maxWidth);
            onImageSelected?.(compressed);
        };
        reader.readAsDataURL(file);
        // Reset input for next use
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [maxWidth, onImageSelected]);
    const showPicker = useCallback(() => {
        setPickerVisible(true);
    }, []);
    return {
        pickImage,
        showPicker,
        isPickerVisible,
        setPickerVisible,
        fileInputRef,
        handleFileInput,
        isNative,
    };
};
export default useImagePicker;
