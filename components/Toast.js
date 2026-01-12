import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
export const Toast = ({ type, title, desc, duration = 3200, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose?.();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);
    const icon = type === 'success' ? (_jsx(CheckCircle2, { className: "text-emerald-500", size: 18 })) : type === 'error' ? (_jsx(AlertCircle, { className: "text-red-500", size: 18 })) : (_jsx(Info, { className: "text-primary dark:text-primary-dark", size: 18 }));
    const toneClasses = type === 'error'
        ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-100'
        : type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-100'
            : 'bg-surface dark:bg-surface-dark border-border dark:border-border-dark text-primary dark:text-primary-dark';
    return (_jsx("div", { className: `fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 w-full max-w-md`, children: _jsxs("div", { className: `rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md flex items-start gap-3 ${toneClasses}`, children: [_jsx("div", { className: "mt-0.5", children: icon }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-semibold leading-tight", children: title }), desc && _jsx("p", { className: "text-xs mt-1 opacity-80 leading-snug", children: desc })] }), onClose && (_jsx("button", { onClick: onClose, className: "text-xs opacity-60 hover:opacity-100", children: "Kapat" }))] }) }));
};
