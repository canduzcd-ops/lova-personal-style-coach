import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Check, X, Crown, RefreshCw, ExternalLink, Shield } from 'lucide-react';
import { Button } from '../components/Shared';
import { SUBSCRIPTION_PLANS } from '../types';
import { iapService } from '../services/iapService';
import { Capacitor } from '@capacitor/core';
import { usePremium } from '../contexts/PremiumContext';
import { track } from '../services/telemetry';
export const PremiumScreen = ({ user, onClose, onSuccess, reason, source }) => {
    const [selectedPlan, setSelectedPlan] = useState('yearly');
    const [loading, setLoading] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [prices, setPrices] = useState({});
    const [iapReady, setIapReady] = useState(false);
    const [iapError, setIapError] = useState(null);
    const premium = usePremium();
    const isPremiumActive = premium.isPremium;
    const isNative = useMemo(() => Capacitor.isNativePlatform(), []);
    const termsUrl = import.meta.env.VITE_TERMS_URL;
    const privacyUrl = import.meta.env.VITE_PRIVACY_URL;
    const reasonCopy = useMemo(() => {
        if (reason)
            return reason;
        if (source === 'limit')
            return 'Ücretsiz deneme hakkın doldu. Sınırsız devam et.';
        if (source === 'wardrobe')
            return 'Dolabını sınırsız açmak için Premium’a geç.';
        if (source === 'profile')
            return 'Profilinden Premium’a geçerek tüm özellikleri aç.';
        return 'Premium ile tüm özellikler açılır.';
    }, [reason, source]);
    useEffect(() => {
        track('premium_opened', { source: source || 'unknown', reason: reason || 'default' });
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
        if (isPremiumActive) {
            onClose();
            return;
        }
        track('premium_purchase_start', { plan: selectedPlan });
        setLoading(true);
        try {
            if (!isNative) {
                alert('Satın alma sadece Store üzerinden yüklenen sürümde çalışır.');
                track('premium_purchase_failed', { plan: selectedPlan, reason: 'web_only' });
                return;
            }
            // 1) IAP satın alma
            const ent = await iapService.purchase(selectedPlan);
            if (!ent.isPremium) {
                alert('Satın alma tamamlandı ama premium doğrulanamadı.');
                track('premium_purchase_failed', { plan: selectedPlan, reason: 'verification_failed' });
                return;
            }
            premium.setPlan(selectedPlan);
            alert('Satın alma başarılı! Premium aktif.');
            track('premium_purchase_success', { plan: selectedPlan });
            onSuccess(user);
        }
        catch (error) {
            console.error(error);
            alert(error?.message || 'Satın alma işlemi başarısız oldu.');
            track('premium_purchase_failed', { plan: selectedPlan, reason: error?.code || 'unknown' });
        }
        finally {
            setLoading(false);
        }
    };
    const handleRestore = async () => {
        if (isPremiumActive) {
            onClose();
            return;
        }
        track('premium_restore_start', {});
        setRestoring(true);
        try {
            if (!isNative) {
                alert('Satın alma sadece Store üzerinden yüklenen sürümde çalışır.');
                track('premium_restore_failed', { reason: 'web_only' });
                return;
            }
            const refreshed = await premium.refresh();
            if (refreshed.isPremium) {
                alert('Satın alımlar geri yüklendi.');
                track('premium_restore_success', {});
            }
            else {
                premium.clear();
                alert('Bu hesapta aktif abonelik bulunamadı.');
                track('premium_restore_failed', { reason: 'no_subscription' });
            }
            onSuccess(user);
        }
        catch (error) {
            console.error(error);
            alert(error?.message || 'Restore işlemi başarısız oldu.');
            track('premium_restore_failed', { reason: error?.code || 'unknown' });
        }
        finally {
            setRestoring(false);
        }
    };
    const openPrivacy = () => {
        if (!privacyUrl)
            return;
        window.open(privacyUrl, '_blank', 'noopener,noreferrer');
    };
    const openTerms = () => {
        if (!termsUrl)
            return;
        window.open(termsUrl, '_blank', 'noopener,noreferrer');
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
    return (_jsxs("div", { className: "fixed inset-0 z-50 bg-page flex flex-col animate-slide-up-modal", children: [_jsxs("div", { className: "h-64 relative bg-surface flex-shrink-0", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-transparent to-page z-10" }), _jsx("img", { src: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?fm=jpg&fit=crop&q=80", className: "w-full h-full object-cover opacity-80 animate-scale-in sepia-[0.2]", alt: "Premium Fashion" }), _jsx("button", { onClick: onClose, className: "absolute top-6 right-6 z-20 bg-white/40 backdrop-blur-md p-2 rounded-full text-primary hover:bg-white transition-colors active:scale-90 duration-200", children: _jsx(X, { size: 20 }) }), _jsxs("div", { className: "absolute bottom-6 left-6 z-20 animate-fade-in-up", children: [_jsxs("div", { className: "inline-flex items-center gap-2 bg-accent text-white px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3 shadow-glow", children: [_jsx(Crown, { size: 12, fill: "currentColor" }), " Lova Premium"] }), _jsxs("h2", { className: "text-4xl font-serif text-primary leading-none", children: ["Stilini Ke\u015Ffet", _jsx("br", {}), "Limitlere Tak\u0131lmadan."] }), _jsxs("div", { className: "mt-2 inline-flex items-center gap-2 bg-white/80 text-primary px-3 py-1.5 rounded-full text-[11px] font-semibold shadow-sm", children: [_jsx(Shield, { size: 14 }), " ", reasonCopy] })] })] }), _jsxs("div", { className: "flex-1 flex flex-col p-6 overflow-y-auto bg-page", children: [!isNative && (_jsx("div", { className: "mb-4 p-3 rounded-xl border border-accent/20 bg-accent/10 text-xs text-secondary", children: "\uD83D\uDCA1 Sat\u0131n alma sadece iOS/Android uygulamas\u0131nda aktif. Web versiyonda \u00F6zellikleri ke\u015Ffet." })), isNative && !iapReady && (_jsxs("div", { className: "mb-4 p-3 rounded-xl border border-accent/20 bg-accent/10 text-xs text-secondary", children: ["\u23F3 Sat\u0131n alma sistemi haz\u0131rlan\u0131yor\u2026", iapError ? _jsxs("div", { className: "mt-1 text-red-500", children: ["\u274C ", iapError] }) : null] })), _jsx("div", { className: "space-y-4 mb-8 animate-fade-in-up", style: { animationDelay: '0.1s' }, children: features.map((feature, i) => (_jsxs("div", { className: "flex items-center gap-3 text-secondary", children: [_jsx("div", { className: "w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-accent", children: _jsx(Check, { size: 14, strokeWidth: 2.5 }) }), _jsx("span", { className: "text-sm font-medium text-primary", children: feature })] }, i))) }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6 animate-fade-in-up", style: { animationDelay: '0.2s' }, children: [_jsxs("button", { onClick: () => setSelectedPlan('monthly'), className: `p-4 rounded-[20px] border-2 transition-all duration-300 ease-luxury relative flex flex-col h-32 justify-between active:scale-95 ${selectedPlan === 'monthly'
                                    ? 'border-accent bg-surface shadow-soft scale-105'
                                    : 'border-border/30 bg-white/50 hover:border-border'}`, children: [_jsxs("div", { className: "text-left", children: [_jsx("span", { className: "text-secondary text-[10px] font-bold uppercase tracking-widest block mb-1", children: SUBSCRIPTION_PLANS.monthly.period }), _jsx("span", { className: "text-primary font-serif text-2xl", children: monthlyPriceText })] }), _jsx("div", { className: "text-left text-[10px] text-secondary font-medium", children: SUBSCRIPTION_PLANS.monthly.label }), selectedPlan === 'monthly' && (_jsx("div", { className: "absolute top-3 right-3 text-accent animate-pop", children: _jsx(Check, { size: 18 }) }))] }), _jsxs("button", { onClick: () => setSelectedPlan('yearly'), className: `p-4 rounded-[20px] border-2 transition-all duration-300 ease-luxury relative flex flex-col h-32 justify-between active:scale-95 ${selectedPlan === 'yearly'
                                    ? 'border-accent bg-surface shadow-soft scale-105'
                                    : 'border-border/30 bg-white/50 hover:border-border'}`, children: [_jsx("div", { className: "absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg whitespace-nowrap animate-pulse-slow", children: SUBSCRIPTION_PLANS.yearly.discount }), _jsxs("div", { className: "text-left mt-2", children: [_jsx("span", { className: "text-secondary text-[10px] font-bold uppercase tracking-widest block mb-1", children: SUBSCRIPTION_PLANS.yearly.period }), _jsx("span", { className: "text-primary font-serif text-2xl", children: yearlyPriceText })] }), _jsx("div", { className: "text-left text-[10px] text-accent font-bold", children: SUBSCRIPTION_PLANS.yearly.label }), selectedPlan === 'yearly' && (_jsx("div", { className: "absolute top-3 right-3 text-accent animate-pop", children: _jsx(Check, { size: 18 }) }))] })] }), _jsx("div", { className: "mt-auto space-y-3 animate-fade-in-up", style: { animationDelay: '0.3s' }, children: isPremiumActive ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "p-4 rounded-2xl border border-accent/40 bg-accent/10 text-primary flex items-center gap-3", children: [_jsx(Crown, { size: 18, className: "text-accent" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-bold text-primary", children: "Premium Aktif" }), _jsx("div", { className: "text-[11px] text-secondary", children: "T\u00FCm \u00F6zellikler a\u00E7\u0131k. Keyfini \u00E7\u0131kar." })] })] }), _jsxs("button", { onClick: () => iapService.openManageSubscriptions(), className: "w-full inline-flex items-center justify-center gap-2 py-3 rounded-[16px] border border-border/40 bg-transparent text-secondary font-bold text-xs hover:text-primary transition-colors", children: ["Aboneli\u011Fi Y\u00F6net ", _jsx(ExternalLink, { size: 14 })] }), _jsx(Button, { onClick: onClose, variant: "secondary", className: "shadow-sm", children: "Kapat" })] })) : (_jsxs(_Fragment, { children: [_jsx(Button, { onClick: handlePurchase, disabled: loading || (isNative && !iapReady), variant: "primary", className: "shadow-lg hover:shadow-glow", children: loading ? 'İşleniyor...' : (selectedPlan === 'yearly' ? 'Yıllık Planla Başla' : 'Aylık Planla Başla') }), _jsxs("button", { onClick: handleRestore, disabled: restoring || (isNative && !iapReady), className: "w-full inline-flex items-center justify-center gap-2 py-3 rounded-[16px] border border-border/40 bg-white/40 text-primary font-bold text-xs hover:bg-white/60 transition-colors disabled:opacity-50", children: [_jsx(RefreshCw, { size: 14 }), restoring ? 'Geri yükleniyor…' : 'Satın Alımları Geri Yükle'] }), _jsxs("div", { className: "bg-surface dark:bg-surface-dark border border-border/60 dark:border-border-dark/60 rounded-2xl p-4 text-left space-y-2", children: [_jsxs("div", { className: "flex items-start gap-3 text-sm text-primary dark:text-primary-dark", children: [_jsx(Shield, { size: 16, className: "text-accent mt-0.5" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: "G\u00FCvenli \u00D6deme" }), _jsx("div", { className: "text-[11px] text-secondary dark:text-secondary-dark", children: "Apple Pay ve Google Play taraf\u0131ndan korunan \u00F6deme altyap\u0131s\u0131." })] })] }), _jsxs("div", { className: "flex items-start gap-3 text-sm text-primary dark:text-primary-dark", children: [_jsx(Check, { size: 16, className: "text-accent mt-0.5" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: "Kolay \u0130ptal" }), _jsx("div", { className: "text-[11px] text-secondary dark:text-secondary-dark", children: "\u0130stedi\u011Fin zaman iptal et. Yenileme tarihinden \u00F6ncesi yeterli." })] })] }), _jsxs("div", { className: "flex items-start gap-3 text-sm text-primary dark:text-primary-dark", children: [_jsx(RefreshCw, { size: 16, className: "text-accent mt-0.5" }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: "Sat\u0131n Al\u0131mlar\u0131 Geri Al" }), _jsx("div", { className: "text-[11px] text-secondary dark:text-secondary-dark", children: "Cihaz de\u011Fi\u015Ftirirsen aboneli\u011Fi geri y\u00FCkle butonunu kullan." })] })] })] }), _jsxs("button", { onClick: () => iapService.openManageSubscriptions(), className: "w-full inline-flex items-center justify-center gap-2 py-3 rounded-[16px] border border-border/40 bg-transparent text-secondary font-bold text-xs hover:text-primary transition-colors", children: ["Aboneli\u011Fi Y\u00F6net ", _jsx(ExternalLink, { size: 14 })] }), (termsUrl || privacyUrl) && (_jsxs("div", { className: "flex items-center justify-center gap-4 pt-1", children: [termsUrl && (_jsx("button", { onClick: openTerms, className: "text-[10px] text-secondary/70 hover:text-primary font-bold", children: "\u015Eartlar" })), termsUrl && privacyUrl && _jsx("span", { className: "text-secondary/30 text-[10px]", children: "\u2022" }), privacyUrl && (_jsx("button", { onClick: openPrivacy, className: "text-[10px] text-secondary/70 hover:text-primary font-bold", children: "Gizlilik" }))] })), _jsx("button", { onClick: onClose, className: "w-full text-center text-xs text-secondary/60 hover:text-primary transition-colors font-bold pt-1", children: "\u015Eimdilik \u00FCcretsiz versiyon kullan" }), _jsx("p", { className: "text-center text-[9px] text-secondary/40 mt-2 leading-relaxed px-4", children: "Abonelik, onaydan hemen sonra tahsil edilir. Her d\u00F6nem sonunda otomatik yenilenir. \u0130stedi\u011Fin zaman Aboneli\u011Fi Y\u00F6net butonundan iptal edebilirsin." })] })) })] })] }));
};
