import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useModalStack } from '../contexts/ModalStackContext';

export const ModalPortal: React.FC = () => {
  const { stack, closeTop } = useModalStack();

  useEffect(() => {
    // Lock body scroll when modal is open
    if (stack.length > 0) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [stack.length]);

  if (stack.length === 0) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeTop();
    }
  };

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex: 10000 }}>
      {/* Single backdrop for entire stack */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleBackdropClick}
        data-swipe-blocker="1"
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Modal contents stacked */}
      <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
        <div 
          className="pointer-events-auto w-full h-full"
          data-modal="1"
          role="dialog"
          aria-modal="true"
        >
          {stack.map((item, index) => (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 10000 + index * 10,
                pointerEvents: index === stack.length - 1 ? 'auto' : 'none',
              }}
              data-modal-id={item.id}
            >
              {/* Modal content will be injected here by parent components */}
              <div id={`modal-content-${item.id}`} className="w-full h-full" />
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};
