import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Check, X, Crown } from 'lucide-react';
import { Button } from '../components/Shared';
import { SUBSCRIPTION_PLANS } from '../types';
import { authService } from '../services/authService';
export const PremiumScreen = ({ user, onClose, onSuccess }) => {
    const [selectedPlan, setSelectedPlan] = useState('yearly');
    const [loading, setLoading] = useState(false);
    const handlePurchase = async () => {
        setLoading(true);
        try {
            const updatedUser = await authService.upgradeToPremium(user.id, selectedPlan);
            onSuccess(updatedUser);
        }
        catch (error) {
            alert("Satın alma işlemi başarısız oldu.");
        }
        finally {
            setLoading(false);
        }
    };
    const features = [
        "Sınırsız Gardırop Alanı",
        "Sınırsız AI Kıyafet Analizi",
        "Hava Durumuna Göre Kombinler",
        "Gelişmiş Stil İpuçları",
        "Reklamsız Deneyim"
    ];
    return (_jsxs("div", { className: "fixed inset-0 z-50 bg-page flex flex-col animate-slide-up-modal", children: [_jsxs("div", { className: "h-64 relative bg-surface flex-shrink-0", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-transparent to-page z-10" }), _jsx("img", { src: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80", className: "w-full h-full object-cover opacity-80 animate-scale-in sepia-[0.2]", alt: "Premium Fashion" }), _jsx("button", { onClick: onClose, className: "absolute top-6 right-6 z-20 bg-white/40 backdrop-blur-md p-2 rounded-full text-primary hover:bg-white transition-colors active:scale-90 duration-200", children: _jsx(X, { size: 20 }) }), _jsxs("div", { className: "absolute bottom-6 left-6 z-20 animate-fade-in-up", children: [_jsxs("div", { className: "inline-flex items-center gap-2 bg-accent text-white px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3 shadow-glow", children: [_jsx(Crown, { size: 12, fill: "currentColor" }), " Lova Premium"] }), _jsxs("h2", { className: "text-4xl font-serif text-primary leading-none", children: ["Tarz\u0131n\u0131", _jsx("br", {}), "Limitlere Tak\u0131lmadan Yans\u0131t."] })] })] }), _jsxs("div", { className: "flex-1 flex flex-col p-6 overflow-y-auto bg-page", children: [_jsx("div", { className: "space-y-4 mb-8 animate-fade-in-up", style: { animationDelay: '0.1s' }, children: features.map((feature, i) => (_jsxs("div", { className: "flex items-center gap-3 text-secondary", children: [_jsx("div", { className: "w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-accent", children: _jsx(Check, { size: 14, strokeWidth: 2.5 }) }), _jsx("span", { className: "text-sm font-medium text-primary", children: feature })] }, i))) }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-8 animate-fade-in-up", style: { animationDelay: '0.2s' }, children: [_jsxs("button", { onClick: () => setSelectedPlan('monthly'), className: `p-4 rounded-[20px] border-2 transition-all duration-300 ease-luxury relative flex flex-col h-32 justify-between active:scale-95 ${selectedPlan === 'monthly'
                                    ? 'border-accent bg-surface shadow-soft scale-105'
                                    : 'border-border/30 bg-white/50 hover:border-border'}`, children: [_jsxs("div", { className: "text-left", children: [_jsx("span", { className: "text-secondary text-[10px] font-bold uppercase tracking-widest block mb-1", children: SUBSCRIPTION_PLANS.monthly.period }), _jsxs("span", { className: "text-primary font-serif text-2xl", children: ["\u20BA", SUBSCRIPTION_PLANS.monthly.price] })] }), _jsx("div", { className: "text-left text-[10px] text-secondary font-medium", children: SUBSCRIPTION_PLANS.monthly.label }), selectedPlan === 'monthly' && (_jsx("div", { className: "absolute top-3 right-3 text-accent animate-pop", children: _jsx(Check, { size: 18 }) }))] }), _jsxs("button", { onClick: () => setSelectedPlan('yearly'), className: `p-4 rounded-[20px] border-2 transition-all duration-300 ease-luxury relative flex flex-col h-32 justify-between active:scale-95 ${selectedPlan === 'yearly'
                                    ? 'border-accent bg-surface shadow-soft scale-105'
                                    : 'border-border/30 bg-white/50 hover:border-border'}`, children: [_jsx("div", { className: "absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg whitespace-nowrap animate-pulse-slow", children: SUBSCRIPTION_PLANS.yearly.discount }), _jsxs("div", { className: "text-left mt-2", children: [_jsx("span", { className: "text-secondary text-[10px] font-bold uppercase tracking-widest block mb-1", children: SUBSCRIPTION_PLANS.yearly.period }), _jsxs("span", { className: "text-primary font-serif text-2xl", children: ["\u20BA", SUBSCRIPTION_PLANS.yearly.price] })] }), _jsx("div", { className: "text-left text-[10px] text-accent font-bold", children: SUBSCRIPTION_PLANS.yearly.label }), selectedPlan === 'yearly' && (_jsx("div", { className: "absolute top-3 right-3 text-accent animate-pop", children: _jsx(Check, { size: 18 }) }))] })] }), _jsxs("div", { className: "mt-auto space-y-4 animate-fade-in-up", style: { animationDelay: '0.3s' }, children: [_jsx(Button, { onClick: handlePurchase, disabled: loading, variant: "primary", className: "shadow-lg hover:shadow-glow", children: loading ? 'İşleniyor...' : (selectedPlan === 'yearly' ? 'Yıllık Planla Başla' : 'Aylık Planla Başla') }), _jsx("button", { onClick: onClose, className: "w-full text-center text-xs text-secondary/60 hover:text-primary transition-colors font-bold", children: "\u00DCcretsiz versiyon ile devam et" }), _jsx("p", { className: "text-center text-[9px] text-secondary/40 mt-2 leading-relaxed px-4", children: "\u00D6deme, onay\u0131n\u0131z\u0131n ard\u0131ndan hesab\u0131n\u0131zdan tahsil edilecektir. Abonelik otomatik olarak yenilenir." })] })] })] }));
};
