import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera, ImageIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';

interface ImagePickerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  title?: string;
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  isVisible,
  onClose,
  onSelectCamera,
  onSelectGallery,
  title,
}) => {
  const { t } = useTranslation();
  const isNative = Capacitor.isNativePlatform();

  // Log visibility changes
  useEffect(() => {
    console.log('[ImagePickerModal] isVisible changed to:', isVisible);
  }, [isVisible]);

  if (!isVisible) {
    console.log('[ImagePickerModal] Not visible, returning null');
    return null;
  }

  console.log('[ImagePickerModal] Rendering modal...');

  const handleCameraClick = async () => {
    console.log('[ImagePickerModal] Camera button clicked, isNative:', isNative);
    try {
      await onSelectCamera();
    } catch (err) {
      console.error('[ImagePickerModal] Camera selection error:', err);
    }
  };

  const handleGalleryClick = async () => {
    console.log('[ImagePickerModal] Gallery button clicked, isNative:', isNative);
    try {
      await onSelectGallery();
    } catch (err) {
      console.error('[ImagePickerModal] Gallery selection error:', err);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-end justify-center sm:items-center"
      style={{ 
        zIndex: 99999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        touchAction: 'none',
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ zIndex: 99999 }}
        onClick={() => {
          console.log('[ImagePickerModal] Backdrop clicked, closing...');
          onClose();
        }}
      />
      
      {/* Modal Content */}
      <div 
        className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
        style={{ zIndex: 100000 }}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {title || t('imagePicker.title', 'Fotoğraf Seç')}
          </h3>
          <button 
            onClick={() => {
              console.log('[ImagePickerModal] Close button clicked');
              onClose();
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        {/* Options */}
        <div className="p-4 space-y-3">
          {/* Camera Option */}
          <button
            onClick={handleCameraClick}
            className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-[0.98]"
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Camera size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 dark:text-white">
                {t('imagePicker.camera', 'Kamera')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('imagePicker.cameraDesc', 'Yeni fotoğraf çek')}
              </p>
            </div>
          </button>

          {/* Gallery Option */}
          <button
            onClick={handleGalleryClick}
            className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-[0.98]"
          >
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <ImageIcon size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 dark:text-white">
                {t('imagePicker.gallery', 'Galeri')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('imagePicker.galleryDesc', 'Galeriden seç')}
              </p>
            </div>
          </button>
        </div>

        {/* Cancel Button */}
        <div className="p-4 pt-0">
          <button
            onClick={() => {
              console.log('[ImagePickerModal] Cancel button clicked');
              onClose();
            }}
            className="w-full py-3 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {t('imagePicker.cancel', 'Vazgeç')}
          </button>
        </div>
      </div>
    </div>
  );

  // Use React Portal to render modal at document body level
  // This ensures it's not affected by parent z-index stacking contexts
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default ImagePickerModal;
