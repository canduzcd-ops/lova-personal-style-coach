import { useState, useRef, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export type ImageSource = 'camera' | 'gallery';

interface UseImagePickerOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  onImageSelected?: (base64: string) => void;
  onError?: (error: Error) => void;
}

interface UseImagePickerReturn {
  pickImage: (source: ImageSource) => Promise<string | null>;
  showPicker: () => void;
  isPickerVisible: boolean;
  setPickerVisible: (visible: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isNative: boolean;
}

// Compress image helper
const compressImage = (base64: string, maxSize: number = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxSize) { height *= maxSize / width; width = maxSize; }
      } else {
        if (height > maxSize) { width *= maxSize / height; height = maxSize; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else resolve(base64);
    };
    img.onerror = () => resolve(base64);
  });
};

export const useImagePicker = (options: UseImagePickerOptions = {}): UseImagePickerReturn => {
  const { quality = 80, maxWidth = 800, maxHeight = 800, onImageSelected, onError } = options;
  const [isPickerVisible, setPickerVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNative = Capacitor.isNativePlatform();

  const pickImage = useCallback(async (source: ImageSource): Promise<string | null> => {
    try {
      if (isNative) {
        // Native (Android/iOS) - use Capacitor Camera
        const cameraSource = source === 'camera' ? CameraSource.Camera : CameraSource.Photos;
        
        const photo: Photo = await Camera.getPhoto({
          quality,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: cameraSource,
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
      } else {
        // Web fallback - use file input
        if (fileInputRef.current) {
          // For camera on web, we can use capture attribute
          if (source === 'camera') {
            fileInputRef.current.setAttribute('capture', 'environment');
          } else {
            fileInputRef.current.removeAttribute('capture');
          }
          fileInputRef.current.click();
        }
        setPickerVisible(false);
      }
      return null;
    } catch (error) {
      console.error('Image picker error:', error);
      
      // If camera fails, try gallery as fallback
      if (source === 'camera' && isNative) {
        console.log('Camera failed, falling back to gallery');
        try {
          const photo: Photo = await Camera.getPhoto({
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
        } catch (fallbackError) {
          onError?.(fallbackError as Error);
        }
      } else {
        onError?.(error as Error);
      }
      
      setPickerVisible(false);
      return null;
    }
  }, [isNative, quality, maxWidth, maxHeight, onImageSelected, onError]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
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
