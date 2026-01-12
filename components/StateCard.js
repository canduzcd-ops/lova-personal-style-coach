import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { Button } from './Shared';
export const StateCard = ({ type, title, desc, actionLabel, onAction }) => {
    const isLoading = type === 'loading';
    const icon = isLoading ? (_jsx(Loader2, { size: 28, className: "animate-spin text-accent" })) : type === 'empty' ? (_jsx(Inbox, { size: 28, className: "text-secondary dark:text-secondary-dark" })) : (_jsx(AlertCircle, { size: 28, className: "text-red-500" }));
    const toneClasses = type === 'error'
        ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20'
        : 'bg-surface dark:bg-surface-dark border-border/60 dark:border-border-dark/60';
    return (_jsxs("div", { className: `w-full text-center rounded-2xl border p-5 flex flex-col items-center gap-3 ${toneClasses}`, children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-page dark:bg-page-dark flex items-center justify-center shadow-inner", children: icon }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-serif font-bold text-primary dark:text-primary-dark", children: title }), desc && _jsx("p", { className: "text-sm text-secondary dark:text-secondary-dark mt-1 max-w-sm", children: desc })] }), actionLabel && onAction && (_jsx(Button, { onClick: onAction, fullWidth: false, className: "!py-2 !px-5 !text-[11px]", children: actionLabel }))] }));
};
