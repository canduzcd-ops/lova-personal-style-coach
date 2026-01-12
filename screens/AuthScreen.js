import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { ArrowRight, Loader2, Chrome, Apple } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../components/Shared';
import { authService } from '../services/authService';
import { OnboardingFlow } from './OnboardingFlow';
import { LegalModal } from './LegalScreens';
import { setAppLanguage } from '../src/i18n';
import { StateCard } from '../components/StateCard';
import { Toast } from '../components/Toast';
import { Capacitor } from '@capacitor/core';
export const AuthScreen = ({ onLogin }) => {
    const [view, setView] = useState('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const { t, i18n } = useTranslation();
    // Legal Modals
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [onboardingMode, setOnboardingMode] = useState(false);
    useEffect(() => {
        try {
            const savedEmail = localStorage.getItem('lova_remember_me_email');
            if (savedEmail) {
                setEmail(savedEmail);
                setRememberMe(true);
            }
        }
        catch (e) {
            console.warn('[AuthScreen] localStorage read failed:', e);
        }
    }, []);
    const currentLang = (i18n.resolvedLanguage || i18n.language || '').startsWith('en') ? 'en' : 'tr';
    const setLang = async (lng) => {
        try {
            await setAppLanguage(lng);
        }
        catch (e) {
            console.error('changeLanguage error:', e);
        }
    };
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const user = await authService.login(email, password);
            if (rememberMe)
                localStorage.setItem('lova_remember_me_email', email);
            else
                localStorage.removeItem('lova_remember_me_email');
            onLogin(user);
        }
        catch (err) {
            setError(err.message || t('auth.alerts.loginFailed', 'Giriş başarısız.'));
        }
        finally {
            setLoading(false);
        }
    };
    const handleRegister = async (data) => {
        setLoading(true);
        setOnboardingMode(false);
        try {
            const user = await authService.register(email, password, data.name, data.styles);
            if (user)
                onLogin(user);
            else {
                setToast({ type: 'success', title: t('auth.alerts.registerSuccessVerify', 'Kayıt başarılı! Lütfen e-postanı doğrula.') });
                setView('login');
            }
        }
        catch (err) {
            console.error('Register error:', err);
            setError(err.message || t('auth.alerts.registerFailed', 'Kayıt hatası.'));
            setView('register');
        }
        finally {
            setLoading(false);
        }
    };
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        const cleanedEmail = email.trim();
        if (!cleanedEmail)
            return setError(t('auth.alerts.emailRequired'));
        setLoading(true);
        setError(null);
        try {
            await authService.resetPassword(cleanedEmail);
            setToast({ type: 'success', title: t('auth.alerts.resetSuccess') });
            setView('login');
        }
        catch (err) {
            setError(err.message || t('auth.alerts.resetFailed', 'Şifre sıfırlama e-postası gönderilemedi.'));
        }
        finally {
            setLoading(false);
        }
    };
    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const user = await authService.loginWithGoogle();
            onLogin(user);
        }
        catch (err) {
            // Redirect durumunda hata gösterme
            if (err.message === 'REDIRECT_IN_PROGRESS') {
                console.log('[Auth] Google redirect başlatıldı');
                return;
            }
            setError(err.message || 'Google giriş başarısız.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleAppleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const user = await authService.loginWithApple();
            onLogin(user);
        }
        catch (err) {
            setError(err.message || 'Apple giriş başarısız.');
        }
        finally {
            setLoading(false);
        }
    };
    const startRegister = (e) => {
        e.preventDefault();
        if (!email || !password)
            return setError(t('auth.alerts.emailRequired'));
        const pwCheck = authService.validatePassword(password);
        if (!pwCheck.valid)
            return setError(pwCheck.error || t('auth.alerts.weakPassword', 'Şifre zayıf.'));
        setOnboardingMode(true);
    };
    if (onboardingMode) {
        return _jsx(OnboardingFlow, { onComplete: handleRegister, initialName: name });
    }
    return (_jsxs("div", { className: "relative w-full bg-page dark:bg-page-dark transition-colors duration-500 font-sans", style: {
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            touchAction: 'pan-y',
            overflowX: 'hidden',
        }, children: [_jsx("div", { className: "absolute top-4 right-4 z-[999999] pointer-events-auto", style: { WebkitTapHighlightColor: 'transparent' }, children: _jsxs("div", { className: "flex gap-1 bg-black/20 backdrop-blur-xl border border-white/20 rounded-full p-1", children: [_jsx("button", { type: "button", onClick: () => setLang('tr'), className: `px-3 py-1 rounded-full text-[10px] font-bold ${currentLang === 'tr' ? 'bg-white text-black' : 'text-white/90'}`, children: "TR" }), _jsx("button", { type: "button", onClick: () => setLang('en'), className: `px-3 py-1 rounded-full text-[10px] font-bold ${currentLang === 'en' ? 'bg-white text-black' : 'text-white/90'}`, children: "EN" })] }) }), _jsxs("div", { className: "absolute inset-0 z-0", children: [_jsx("img", { src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=2576&fm=jpg&fit=crop", className: "w-full h-full object-cover object-center", alt: "Editorial Texture", onError: (e) => {
                            // Fallback gradient if image fails to load
                            e.target.style.display = 'none';
                        } }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/60" })] }), _jsxs("div", { className: "relative z-10 pt-20 text-center", children: [_jsx("h1", { className: "text-6xl font-serif text-white tracking-tighter drop-shadow-lg animate-fade-in", children: "LOVA" }), _jsx("p", { className: "text-[10px] font-bold text-white/90 uppercase tracking-[0.4em] mt-2 drop-shadow-sm animate-slide-up", style: { animationDelay: '0.1s' }, children: t('auth.brand.tagline', 'Personal Style Coach') })] }), _jsx("div", { className: "relative z-20 mt-auto", children: _jsxs("div", { className: "bg-page/95 dark:bg-page-dark/95 backdrop-blur-2xl rounded-t-[40px] px-8 pt-8 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-slide-up border-t border-white/10", style: {
                        maxHeight: '72vh',
                        overflowY: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        touchAction: 'pan-y',
                    }, children: [_jsxs("div", { className: "mb-6 text-center", children: [_jsx("h2", { className: "text-3xl font-serif text-primary dark:text-primary-dark", children: view === 'login'
                                        ? t('auth.title.login')
                                        : view === 'register'
                                            ? t('auth.title.register')
                                            : t('auth.title.forgot') }), _jsx("div", { className: "w-12 h-1 bg-accent rounded-full mx-auto mt-3 mb-2" }), _jsx("p", { className: "text-sm text-secondary dark:text-secondary-dark font-light", children: view === 'login'
                                        ? t('auth.subtitle.login')
                                        : view === 'register'
                                            ? t('auth.subtitle.register')
                                            : t('auth.subtitle.forgot') })] }), error && (_jsx("div", { className: "mb-6 animate-scale-in", children: _jsx(StateCard, { type: "error", title: t('auth.alerts.errorTitle', 'Bir sorun oluştu'), desc: error }) })), _jsxs("form", { onSubmit: view === 'login' ? handleLogin : view === 'register' ? startRegister : handleForgotPassword, className: "space-y-2", children: [_jsx(Input, { label: t('auth.emailLabel'), value: email, onChange: setEmail, placeholder: t('auth.emailPlaceholder', 'isim@ornek.com'), type: "email", className: "!bg-surface/50 dark:!bg-surface-dark/50 border border-border dark:border-border-dark focus:border-accent text-primary dark:text-primary-dark placeholder:text-secondary/60" }), view !== 'forgot' && (_jsx(Input, { label: t('auth.passwordLabel'), value: password, onChange: setPassword, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", type: "password", className: "!bg-surface/50 dark:!bg-surface-dark/50 border border-border dark:border-border-dark focus:border-accent text-primary dark:text-primary-dark placeholder:text-secondary/60" })), view === 'login' && (_jsxs("div", { className: "flex items-center justify-between mb-8 mt-2 pl-1 pr-1", children: [_jsxs("button", { type: "button", onClick: () => setRememberMe(!rememberMe), className: "flex items-center gap-2 group", children: [_jsx("div", { className: `w-4 h-4 rounded-full border flex items-center justify-center transition-colors duration-300 ${rememberMe ? 'bg-accent border-accent' : 'border-secondary/40 dark:border-secondary-dark'}`, children: rememberMe && _jsx("div", { className: "w-1.5 h-1.5 bg-white rounded-full" }) }), _jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-secondary dark:text-secondary-dark group-hover:text-primary dark:group-hover:text-primary-dark transition-colors", children: t('auth.rememberMe') })] }), _jsx("button", { type: "button", onClick: () => setView('forgot'), className: "text-[10px] font-bold uppercase tracking-wider text-secondary dark:text-secondary-dark hover:text-accent transition-colors", children: t('auth.forgot') })] })), _jsx(Button, { type: "submit", disabled: loading, className: "mb-4 !rounded-2xl shadow-xl hover:shadow-glow !py-4", children: loading ? (_jsx(Loader2, { className: "animate-spin", size: 20 })) : view === 'login' ? (t('auth.submit.login')) : view === 'register' ? (t('auth.submit.register')) : (t('auth.submit.forgot')) })] }), (view === 'login' || view === 'register') && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-3 my-6", children: [_jsx("div", { className: "flex-1 h-px bg-border dark:bg-border-dark" }), _jsx("span", { className: "text-[10px] font-bold uppercase text-secondary/60 px-2", children: "ya da" }), _jsx("div", { className: "flex-1 h-px bg-border dark:bg-border-dark" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("button", { type: "button", onClick: handleGoogleLogin, disabled: loading, className: "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-border dark:border-border-dark bg-surface/50 dark:bg-surface-dark/50 hover:bg-surface dark:hover:bg-surface-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx(Chrome, { size: 16, className: "text-primary dark:text-primary-dark" }), _jsx("span", { className: "text-sm font-semibold text-primary dark:text-primary-dark", children: "Google ile Giri\u015F Yap" })] }), Capacitor.getPlatform() === 'ios' && (_jsxs("button", { type: "button", onClick: handleAppleLogin, disabled: loading, className: "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-border dark:border-border-dark bg-surface/50 dark:bg-surface-dark/50 hover:bg-surface dark:hover:bg-surface-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx(Apple, { size: 16, className: "text-primary dark:text-primary-dark" }), _jsx("span", { className: "text-sm font-semibold text-primary dark:text-primary-dark", children: "Apple ile Giri\u015F Yap" })] }))] })] })), _jsxs("div", { className: "mt-4 text-center pt-4 border-t border-border/30 dark:border-border-dark/30", children: [view === 'login' && (_jsxs("p", { className: "text-secondary dark:text-secondary-dark text-xs", children: [t('auth.footer.noAccount'), ' ', _jsx("button", { type: "button", onClick: () => {
                                                setView('register');
                                                setError(null);
                                            }, className: "text-primary dark:text-primary-dark font-bold ml-1 hover:underline decoration-accent underline-offset-4", children: t('auth.footer.join') })] })), view === 'register' && (_jsxs("p", { className: "text-secondary dark:text-secondary-dark text-xs", children: [t('auth.footer.haveAccount'), ' ', _jsx("button", { type: "button", onClick: () => {
                                                setView('login');
                                                setError(null);
                                            }, className: "text-primary dark:text-primary-dark font-bold ml-1 hover:underline decoration-accent underline-offset-4", children: t('auth.footer.login') })] })), view === 'forgot' && (_jsxs("button", { type: "button", onClick: () => setView('login'), className: "text-primary dark:text-primary-dark text-xs font-bold hover:underline decoration-accent underline-offset-4 flex items-center justify-center gap-2 mx-auto", children: [_jsx(ArrowRight, { size: 12, className: "rotate-180" }), " ", t('auth.footer.back')] })), _jsxs("div", { className: "flex items-center justify-center gap-6 mt-6 opacity-60", children: [_jsx("button", { type: "button", onClick: () => setShowPrivacy(true), className: "text-[9px] font-bold uppercase text-secondary hover:text-primary transition-colors", children: t('auth.legal.privacy') }), _jsx("span", { className: "w-1 h-1 rounded-full bg-secondary" }), _jsx("button", { type: "button", onClick: () => setShowTerms(true), className: "text-[9px] font-bold uppercase text-secondary hover:text-primary transition-colors", children: t('auth.legal.terms') })] })] })] }) }), showPrivacy && _jsx(LegalModal, { type: "privacy", onClose: () => setShowPrivacy(false) }), showTerms && _jsx(LegalModal, { type: "terms", onClose: () => setShowTerms(false) }), toast && (_jsx(Toast, { type: toast.type, title: toast.title, desc: toast.desc, onClose: () => setToast(null) }))] }));
};
