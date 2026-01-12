import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Loader2 } from 'lucide-react';
export const InlineLoader = ({ label = 'Yükleniyor...', tone = 'default' }) => {
    const textClass = tone === 'muted'
        ? 'text-secondary dark:text-secondary-dark'
        : 'text-primary dark:text-primary-dark';
    return (_jsxs("div", { className: "flex items-center gap-3 justify-center py-6", children: [_jsx(Loader2, { className: "animate-spin text-accent", size: 22 }), _jsx("span", { className: `text-sm font-medium ${textClass}`, children: label })] }));
};
