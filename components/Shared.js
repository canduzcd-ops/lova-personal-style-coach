import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
export const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', icon: Icon, disabled, fullWidth = true, isLoading = false, ...rest }) => {
    // Editorial Button: Rounded-xl but slightly boxier than full pill, tracking widest for high-fashion feel.
    const baseStyle = 'py-4 px-6 font-bold text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';
    const widthClass = fullWidth ? 'w-full' : 'w-auto';
    const variants = {
        // Primary: Terracotta Accent with Nude Text
        primary: 'bg-accent text-page dark:bg-accent-dark dark:text-page-dark rounded-xl hover:shadow-lg hover:-translate-y-0.5 shadow-soft',
        // Secondary: Bordered
        secondary: 'bg-transparent border border-border dark:border-border-dark text-primary dark:text-primary-dark hover:bg-surface dark:hover:bg-surface-dark rounded-xl',
        ghost: 'bg-transparent text-secondary dark:text-secondary-dark hover:text-primary dark:hover:text-primary-dark',
        outline: 'border border-primary text-primary dark:border-primary-dark dark:text-primary-dark rounded-xl',
        danger: 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/20 rounded-xl',
        // Gold -> Terracotta Gradient
        gold: 'bg-gradient-to-r from-accent to-accent-dark text-page rounded-xl shadow-md hover:shadow-glow',
    };
    return (_jsxs("button", { type: type, onClick: onClick, disabled: disabled || isLoading, className: `${baseStyle} ${widthClass} ${variants[variant]} ${className}`, ...rest, children: [Icon && (_jsx(Icon, { size: 16, strokeWidth: 2, className: isLoading || Icon === Loader2 ? 'animate-spin' : '' })), children] }));
};
export const Input = ({ label, value, onChange, placeholder, type = 'text', autoComplete, name, className = '', ...rest }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === 'password';
    const inputType = isPasswordType ? (showPassword ? 'text' : 'password') : type;
    return (_jsxs("div", { className: "mb-6 group", children: [_jsx("label", { className: "block text-[10px] font-bold text-secondary dark:text-secondary-dark uppercase tracking-[0.2em] mb-2 ml-1 transition-colors group-focus-within:text-primary dark:group-focus-within:text-primary-dark", children: label }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: inputType, name: name, autoComplete: autoComplete, value: value, onChange: e => onChange(e.target.value), placeholder: placeholder, className: `w-full px-5 py-4 bg-surface dark:bg-surface-dark/50 border border-transparent focus:border-accent dark:focus:border-accent focus:bg-page-soft dark:focus:bg-page-dark rounded-xl outline-none transition-all duration-300 text-primary dark:text-primary-dark placeholder:text-secondary/40 dark:placeholder:text-secondary-dark/40 text-sm font-medium tracking-wide shadow-sm focus:shadow-md ${className}`, ...rest }), isPasswordType && (_jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-4 top-1/2 -translate-y-1/2 text-secondary/60 hover:text-primary transition-colors p-1", children: showPassword ? (_jsx(EyeOff, { size: 18, strokeWidth: 1.5 })) : (_jsx(Eye, { size: 18, strokeWidth: 1.5 })) }))] })] }));
};
