import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Check, X, Crown, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '../components/Shared';
import { SUBSCRIPTION_PLANS } from '../types';
import { iapService } from '../services/iapService';
import { Capacitor } from '@capacitor/core';
import { usePremium } from '../contexts/PremiumContext';
export const PremiumScreen = ({ user, onClose, onSuccess }) => {
    const [selectedPlan, setSelectedPlan] = useState('yearly');
    const [loading, setLoading] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [prices, setPrices] = useState({});
    const [iapReady, setIapReady] = useState(false);
    const [iapError, setIapError] = useState(null);
    const premium = usePremium();
    const isNative = useMemo(() => Capacitor.isNativePlatform(), []);
    useEffect(() => {
        (async () => {
            try {
                setIapError(null);
                await iapService.init();
                const plans = await iapService.getPlans();
                const monthly = plans.find((p) => p.id === 'monthly');
                const yearly = plans.find((p) => p.id === 'yearly');
                setPrices({
                    monthly: monthly?.price?.price || undefined,
                    yearly: yearly?.price?.price || undefined,
                });
                setIapReady(true);
            }
            catch (e) {
                setIapReady(false);
                setIapError(e?.message || 'IAP init hatası');
            }
        })();
    }, []);
    const handlePurchase = async () => {
        setLoading(true);
        try {
            if (!isNative) {
                alert('Satın alma sadece Store üzerinden yüklenen sürümde çalışır.');
                return;
            }
            // 1) IAP satın alma
            const ent = await iapService.purchase(selectedPlan);
            if (!ent.isPremium) {
                alert('Satın alma tamamlandı ama premium doğrulanamadı.');
                return;
            }
            premium.setPlan(selectedPlan);
            alert('Satın alma başarılı! Premium aktif.');
            onSuccess(user);
        }
        catch (error) {
            console.error(error);
            alert(error?.message || 'Satın alma işlemi başarısız oldu.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleRestore = async () => {
        setRestoring(true);
        try {
            if (!isNative) {
                alert('Satın alma sadece Store üzerinden yüklenen sürümde çalışır.');
                return;
            }
            const refreshed = await premium.refresh();
            if (refreshed.isPremium) {
                alert('Satın alımlar geri yüklendi.');
            }
            else {
                premium.clear();
                alert('Bu hesapta aktif abonelik bulunamadı.');
            }
            onSuccess(user);
        }
        catch (error) {
            console.error(error);
            alert(error?.message || 'Restore işlemi başarısız oldu.');
        }
        finally {
            setRestoring(false);
        }
    };
    const openPrivacy = () => {
        // TODO: kendi URL’lerinle değiştir
        window.open('https://racalabs.com/privacy', '_blank', 'noopener,noreferrer');
    };
    const openTerms = () => {
        // TODO: kendi URL’lerinle değiştir
        window.open('https://racalabs.com/terms', '_blank', 'noopener,noreferrer');
    };
    const features = [
        "Sınırsız Gardırop Alanı",
        "Sınırsız AI Kıyafet Analizi",
        "Hava Durumuna Göre Kombinler",
        "Gelişmiş Stil İpuçları",
        "Reklamsız Deneyim"
    ];
    const monthlyPriceText = prices.monthly || `₺${SUBSCRIPTION_PLANS.monthly.price}`;
    const yearlyPriceText = prices.yearly || `₺${SUBSCRIPTION_PLANS.yearly.price}`;
    return (_jsxs("div", { className: "fixed inset-0 z-50 bg-page flex flex-col animate-slide-up-modal", children: [_jsxs("div", { className: "h-64 relative bg-surface flex-shrink-0", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-transparent to-page z-10" }), _jsx("img", { src: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80", className: "w-full h-full object-cover opacity-80 animate-scale-in sepia-[0.2]", alt: "Premium Fashion" }), _jsx("button", { onClick: onClose, className: "absolute top-6 right-6 z-20 bg-white/40 backdrop-blur-md p-2 rounded-full text-primary hover:bg-white transition-colors active:scale-90 duration-200", children: _jsx(X, { size: 20 }) }), _jsxs("div", { className: "absolute bottom-6 left-6 z-20 animate-fade-in-up", children: [_jsxs("div", { className: "inline-flex items-center gap-2 bg-accent text-white px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3 shadow-glow", children: [_jsx(Crown, { size: 12, fill: "currentColor" }), " Lova Premium"] }), _jsxs("h2", { className: "text-4xl font-serif text-primary leading-none", children: ["Tarz\u0131n\u0131", _jsx("br", {}), "Limitlere Tak\u0131lmadan Yans\u0131t."] })] })] }), _jsxs("div", { className: "flex-1 flex flex-col p-6 overflow-y-auto bg-page", children: [!isNative && (_jsx("div", { className: "mb-4 p-3 rounded-xl border border-border/40 bg-white/40 text-xs text-secondary", children: "Bu ekran mobilde \u201Csat\u0131n alma\u201D yapar. \u015Eu an web\u2019de g\u00F6r\u00FCnt\u00FCl\u00FCyorsun." })), isNative && !iapReady && (_jsxs("div", { className: "mb-4 p-3 rounded-xl border border-border/40 bg-white/40 text-xs text-secondary", children: ["Sat\u0131n alma sistemi haz\u0131rlan\u0131yor\u2026", iapError ? _jsx("div", { className: "mt-1 text-red-500", children: iapError }) : null] })), _jsx("div", { className: "space-y-4 mb-8 animate-fade-in-up", style: { animationDelay: '0.1s' }, children: features.map((feature, i) => (_jsxs("div", { className: "flex items-center gap-3 text-secondary", children: [_jsx("div", { className: "w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-accent", children: _jsx(Check, { size: 14, strokeWidth: 2.5 }) }), _jsx("span", { className: "text-sm font-medium text-primary", children: feature })] }, i))) }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6 animate-fade-in-up", style: { animationDelay: '0.2s' }, children: [_jsxs("button", { onClick: () => setSelectedPlan('monthly'), className: `p-4 rounded-[20px] border-2 transition-all duration-300 ease-luxury relative flex flex-col h-32 justify-between active:scale-95 ${selectedPlan === 'monthly'
                                    ? 'border-accent bg-surface shadow-soft scale-105'
                                    : 'border-border/30 bg-white/50 hover:border-border'}`, children: [_jsxs("div", { className: "text-left", children: [_jsx("span", { className: "text-secondary text-[10px] font-bold uppercase tracking-widest block mb-1", children: SUBSCRIPTION_PLANS.monthly.period }), _jsx("span", { className: "text-primary font-serif text-2xl", children: monthlyPriceText })] }), _jsx("div", { className: "text-left text-[10px] text-secondary font-medium", children: SUBSCRIPTION_PLANS.monthly.label }), selectedPlan === 'monthly' && (_jsx("div", { className: "absolute top-3 right-3 text-accent animate-pop", children: _jsx(Check, { size: 18 }) }))] }), _jsxs("button", { onClick: () => setSelectedPlan('yearly'), className: `p-4 rounded-[20px] border-2 transition-all duration-300 ease-luxury relative flex flex-col h-32 justify-between active:scale-95 ${selectedPlan === 'yearly'
                                    ? 'border-accent bg-surface shadow-soft scale-105'
                                    : 'border-border/30 bg-white/50 hover:border-border'}`, children: [_jsx("div", { className: "absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg whitespace-nowrap animate-pulse-slow", children: SUBSCRIPTION_PLANS.yearly.discount }), _jsxs("div", { className: "text-left mt-2", children: [_jsx("span", { className: "text-secondary text-[10px] font-bold uppercase tracking-widest block mb-1", children: SUBSCRIPTION_PLANS.yearly.period }), _jsx("span", { className: "text-primary font-serif text-2xl", children: yearlyPriceText })] }), _jsx("div", { className: "text-left text-[10px] text-accent font-bold", children: SUBSCRIPTION_PLANS.yearly.label }), selectedPlan === 'yearly' && (_jsx("div", { className: "absolute top-3 right-3 text-accent animate-pop", children: _jsx(Check, { size: 18 }) }))] })] }), _jsxs("div", { className: "mt-auto space-y-3 animate-fade-in-up", style: { animationDelay: '0.3s' }, children: [_jsx(Button, { onClick: handlePurchase, disabled: loading || (isNative && !iapReady), variant: "primary", className: "shadow-lg hover:shadow-glow", children: loading ? 'İşleniyor...' : (selectedPlan === 'yearly' ? 'Yıllık Planla Başla' : 'Aylık Planla Başla') }), _jsxs("button", { onClick: handleRestore, disabled: restoring || (isNative && !iapReady), className: "w-full inline-flex items-center justify-center gap-2 py-3 rounded-[16px] border border-border/40 bg-white/40 text-primary font-bold text-xs hover:bg-white/60 transition-colors disabled:opacity-50", children: [_jsx(RefreshCw, { size: 14 }), restoring ? 'Geri yükleniyor…' : 'Satın Alımları Geri Yükle'] }), _jsxs("button", { onClick: () => iapService.openManageSubscriptions(), className: "w-full inline-flex items-center justify-center gap-2 py-3 rounded-[16px] border border-border/40 bg-transparent text-secondary font-bold text-xs hover:text-primary transition-colors", children: ["Aboneli\u011Fi Y\u00F6net ", _jsx(ExternalLink, { size: 14 })] }), _jsxs("div", { className: "flex items-center justify-center gap-4 pt-1", children: [_jsx("button", { onClick: openTerms, className: "text-[10px] text-secondary/70 hover:text-primary font-bold", children: "\u015Eartlar" }), _jsx("span", { className: "text-secondary/30 text-[10px]", children: "\u2022" }), _jsx("button", { onClick: openPrivacy, className: "text-[10px] text-secondary/70 hover:text-primary font-bold", children: "Gizlilik" })] }), _jsx("button", { onClick: onClose, className: "w-full text-center text-xs text-secondary/60 hover:text-primary transition-colors font-bold pt-1", children: "\u00DCcretsiz versiyon ile devam et" }), _jsx("p", { className: "text-center text-[9px] text-secondary/40 mt-1 leading-relaxed px-4", children: "\u00D6deme, onay\u0131n\u0131z\u0131n ard\u0131ndan hesab\u0131n\u0131zdan tahsil edilir. Abonelik otomatik yenilenir. \u0130ptal edilmedi\u011Fi s\u00FCrece d\u00F6nem sonunda devam eder." })] })] })] }));
};
