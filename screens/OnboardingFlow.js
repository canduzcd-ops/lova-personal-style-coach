import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button, Input } from '../components/Shared';
import { STYLE_OPTIONS } from '../constants';
export const OnboardingFlow = ({ onComplete, initialName }) => {
    const [step, setStep] = useState('intro');
    const [name, setName] = useState(initialName || '');
    const [selectedStyles, setSelectedStyles] = useState([]);
    const toggleStyle = (id) => {
        setSelectedStyles(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };
    if (step === 'intro') {
        return (_jsxs("div", { className: "fixed inset-0 bg-page text-primary flex flex-col items-center justify-end pb-12 px-8", children: [_jsxs("div", { className: "absolute inset-0 z-0", children: [_jsx("img", { src: "https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=1287&auto=format&fit=crop", className: "w-full h-full object-cover opacity-90" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-page via-page/60 to-transparent" })] }), _jsxs("div", { className: "relative z-10 w-full mb-8", children: [_jsxs("h1", { className: "text-5xl font-serif mb-4 leading-[1.1] text-primary", children: ["Stilini", _jsx("br", {}), _jsx("span", { className: "italic text-accent", children: "Y\u00F6net." })] }), _jsx("p", { className: "text-secondary text-sm font-medium leading-relaxed max-w-xs mb-8", children: "Yapay zeka asistan\u0131n ile gard\u0131robunu sadele\u015Ftir, her g\u00FCn en iyi halinle g\u00F6r\u00FCn." }), _jsx(Button, { onClick: () => setStep('details'), icon: ArrowRight, className: "shadow-soft", children: "Ba\u015Flayal\u0131m" })] })] }));
    }
    return (_jsxs("div", { className: "fixed inset-0 bg-page dark:bg-page-dark flex flex-col p-8 animate-in slide-in-from-bottom duration-500", children: [_jsxs("div", { className: "flex-1 overflow-y-auto no-scrollbar pb-20", children: [_jsx("div", { className: "w-12 h-1 bg-border mb-6 rounded-full" }), _jsx("h2", { className: "text-3xl font-serif text-primary dark:text-primary-dark mb-2", children: "Tan\u0131\u015Fal\u0131m" }), _jsx("p", { className: "text-secondary dark:text-secondary-dark text-sm mb-8", children: "Sana \u00F6zel \u00F6neriler sunabilmemiz i\u00E7in." }), _jsx("div", { className: "mb-10", children: _jsx(Input, { label: "Ad\u0131n Nedir?", value: name, onChange: setName, placeholder: "\u0130sim giriniz..." }) }), _jsx("h3", { className: "text-[10px] font-bold text-secondary dark:text-secondary-dark uppercase tracking-[0.2em] mb-4", children: "Hangi stilleri seversin?" }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: STYLE_OPTIONS.map(style => (_jsx("button", { onClick: () => toggleStyle(style.id), className: `p-4 rounded-xl border text-left transition-all duration-300 ${selectedStyles.includes(style.id)
                                ? 'bg-primary text-page border-primary dark:bg-primary-dark dark:text-page dark:border-primary-dark shadow-lg'
                                : 'bg-surface border-transparent text-secondary dark:text-secondary-dark hover:border-border'}`, children: _jsx("span", { className: "font-serif block text-lg", children: style.label }) }, style.id))) })] }), _jsx("div", { className: "pt-6 bg-page dark:bg-page-dark", children: _jsx(Button, { onClick: () => onComplete({ name, styles: selectedStyles }), disabled: !name || selectedStyles.length === 0, className: "!py-4 shadow-xl", children: "Uygulamaya Gir" }) })] }));
};
