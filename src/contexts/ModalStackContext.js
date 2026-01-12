import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback } from 'react';
const ModalStackContext = createContext(null);
export const ModalStackProvider = ({ children }) => {
    const [stack, setStack] = useState([]);
    const open = useCallback((type, options) => {
        const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setStack(prev => [...prev, {
                id,
                type,
                closeOnBackdrop: options?.closeOnBackdrop ?? true,
                payload: options?.payload,
            }]);
        return id;
    }, []);
    const close = useCallback((id) => {
        setStack(prev => prev.filter(item => item.id !== id));
    }, []);
    const closeTop = useCallback(() => {
        setStack(prev => {
            if (prev.length === 0)
                return prev;
            const top = prev[prev.length - 1];
            if (top.closeOnBackdrop) {
                return prev.slice(0, -1);
            }
            return prev;
        });
    }, []);
    const closeAll = useCallback(() => {
        setStack([]);
    }, []);
    const getPayload = useCallback((id) => {
        return stack.find(item => item.id === id)?.payload;
    }, [stack]);
    const isAnyOpen = stack.length > 0;
    return (_jsx(ModalStackContext.Provider, { value: { stack, open, close, closeTop, closeAll, isAnyOpen, getPayload }, children: children }));
};
export const useModalStack = () => {
    const context = useContext(ModalStackContext);
    if (!context) {
        throw new Error('useModalStack must be used within ModalStackProvider');
    }
    return context;
};
