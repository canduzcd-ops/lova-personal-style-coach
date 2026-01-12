import React, { createContext, useContext, useState, useCallback } from 'react';

interface ModalItem {
  id: string;
  type: string;
  closeOnBackdrop?: boolean;
  payload?: any;
}

interface ModalStackContextValue {
  stack: ModalItem[];
  open: (type: string, options?: { closeOnBackdrop?: boolean; payload?: any }) => string;
  close: (id: string) => void;
  closeTop: () => void;
  closeAll: () => void;
  isAnyOpen: boolean;
  getPayload: (id: string) => any;
}

const ModalStackContext = createContext<ModalStackContextValue | null>(null);

export const ModalStackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stack, setStack] = useState<ModalItem[]>([]);

  const open = useCallback((type: string, options?: { closeOnBackdrop?: boolean; payload?: any }) => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setStack(prev => [...prev, {
      id,
      type,
      closeOnBackdrop: options?.closeOnBackdrop ?? true,
      payload: options?.payload,
    }]);
    return id;
  }, []);

  const close = useCallback((id: string) => {
    setStack(prev => prev.filter(item => item.id !== id));
  }, []);

  const closeTop = useCallback(() => {
    setStack(prev => {
      if (prev.length === 0) return prev;
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

  const getPayload = useCallback((id: string) => {
    return stack.find(item => item.id === id)?.payload;
  }, [stack]);

  const isAnyOpen = stack.length > 0;

  return (
    <ModalStackContext.Provider value={{ stack, open, close, closeTop, closeAll, isAnyOpen, getPayload }}>
      {children}
    </ModalStackContext.Provider>
  );
};

export const useModalStack = () => {
  const context = useContext(ModalStackContext);
  if (!context) {
    throw new Error('useModalStack must be used within ModalStackProvider');
  }
  return context;
};
