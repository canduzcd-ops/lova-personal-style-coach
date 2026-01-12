import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useModalStack } from '../contexts/ModalStackContext';
export const ModalPortal = () => {
    const { stack, closeTop } = useModalStack();
    useEffect(() => {
        // Lock body scroll when modal is open
        if (stack.length > 0) {
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [stack.length]);
    if (stack.length === 0)
        return null;
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            closeTop();
        }
    };
    return createPortal(_jsxs("div", { className: "fixed inset-0", style: { zIndex: 10000 }, children: [_jsx("div", { className: "absolute inset-0 bg-black/40 backdrop-blur-sm", onClick: handleBackdropClick, "data-swipe-blocker": "1", style: { pointerEvents: 'auto' } }), _jsx("div", { className: "relative w-full h-full flex items-center justify-center pointer-events-none", children: _jsx("div", { className: "pointer-events-auto w-full h-full", "data-modal": "1", role: "dialog", "aria-modal": "true", children: stack.map((item, index) => (_jsx("div", { style: {
                            position: 'absolute',
                            inset: 0,
                            zIndex: 10000 + index * 10,
                            pointerEvents: index === stack.length - 1 ? 'auto' : 'none',
                        }, "data-modal-id": item.id, children: _jsx("div", { id: `modal-content-${item.id}`, className: "w-full h-full" }) }, item.id))) }) })] }), document.body);
};
