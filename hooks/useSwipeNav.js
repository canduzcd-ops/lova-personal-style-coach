import { useEffect, useRef } from 'react';
/**
 * Hook for horizontal swipe navigation between screens
 * Only triggers on clear horizontal gestures (not vertical scrolls)
 */
export const useSwipeNav = (options) => {
    const { onSwipeLeft, onSwipeRight, enabled = true, blocked = false, threshold = 70, } = options;
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const touchCurrentX = useRef(0);
    const touchCurrentY = useRef(0);
    useEffect(() => {
        if (!enabled || blocked)
            return;
        const handleTouchStart = (e) => {
            // Don't start swipe on interactive elements or modals
            const target = e.target;
            if (target?.closest('button,a,input,textarea,select,[role="button"],[role="slider"],[data-modal],[data-swipe-blocker],[role="dialog"]')) {
                return;
            }
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
            touchCurrentX.current = e.touches[0].clientX;
            touchCurrentY.current = e.touches[0].clientY;
        };
        const handleTouchMove = (e) => {
            touchCurrentX.current = e.touches[0].clientX;
            touchCurrentY.current = e.touches[0].clientY;
        };
        const handleTouchEnd = () => {
            const deltaX = touchCurrentX.current - touchStartX.current;
            const deltaY = touchCurrentY.current - touchStartY.current;
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);
            // Only trigger if horizontal movement is dominant and exceeds threshold
            if (absDeltaX > threshold && absDeltaX > absDeltaY * 1.2) {
                if (deltaX > 0) {
                    // Swipe right
                    onSwipeRight?.();
                }
                else {
                    // Swipe left
                    onSwipeLeft?.();
                }
            }
            // Reset
            touchStartX.current = 0;
            touchStartY.current = 0;
            touchCurrentX.current = 0;
            touchCurrentY.current = 0;
        };
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [enabled, blocked, threshold, onSwipeLeft, onSwipeRight]);
};
