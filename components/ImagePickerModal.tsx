import React from 'react';
import { Camera, ImageIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-sm mx-4 mb-4 sm:mb-0 bg-page dark:bg-page-dark rounded-2xl shadow-2xl animate-slide-up overflow-hidden border border-border dark:border-border-dark">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border dark:border-border-dark">
          <h3 className="text-lg font-serif font-bold text-primary dark:text-primary-dark">
            {title || t('imagePicker.title', 'Fotoğraf Seç')}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface dark:hover:bg-surface-dark rounded-full transition-colors"
          >
            <X size={20} className="text-secondary" />
          </button>
        </div>
        
        {/* Options */}
        <div className="p-4 space-y-3">
          {/* Camera Option */}
          <button
            onClick={() => {
              onSelectCamera();
            }}
            className="w-full flex items-center gap-4 p-4 bg-surface dark:bg-surface-dark rounded-xl hover:bg-border/50 dark:hover:bg-border-dark/50 transition-all active:scale-[0.98] group"
          >
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center group-hover:bg-accent/20 transition-colors">
              <Camera size={24} className="text-accent" />
            </div>
            <div className="text-left">
              <p className="font-bold text-primary dark:text-primary-dark">
                {t('imagePicker.camera', 'Kamera')}
              </p>
              <p className="text-xs text-secondary dark:text-secondary-dark">
                {t('imagePicker.cameraDesc', 'Yeni fotoğraf çek')}
              </p>
            </div>
          </button>

          {/* Gallery Option */}
          <button
            onClick={() => {
              onSelectGallery();
            }}
            className="w-full flex items-center gap-4 p-4 bg-surface dark:bg-surface-dark rounded-xl hover:bg-border/50 dark:hover:bg-border-dark/50 transition-all active:scale-[0.98] group"
          >
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center group-hover:bg-accent/20 transition-colors">
              <ImageIcon size={24} className="text-accent" />
            </div>
            <div className="text-left">
              <p className="font-bold text-primary dark:text-primary-dark">
                {t('imagePicker.gallery', 'Galeri')}
              </p>
              <p className="text-xs text-secondary dark:text-secondary-dark">
                {t('imagePicker.galleryDesc', 'Galeriden seç')}
              </p>
            </div>
          </button>
        </div>

        {/* Cancel Button */}
        <div className="p-4 pt-0">
          <button
            onClick={onClose}
            className="w-full py-3 text-sm font-bold text-secondary hover:text-primary dark:hover:text-primary-dark transition-colors"
          >
            {t('imagePicker.cancel', 'Vazgeç')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImagePickerModal;
