import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button, Input } from '../components/Shared';
import { authService } from '../services/authService';
import { OnboardingFlow } from './OnboardingFlow';
import { LegalModal } from './LegalScreens';
export const AuthScreen = ({ onLogin }) => {
    const [view, setView] = useState('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Legal Modals
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    useEffect(() => {
        const savedEmail = localStorage.getItem('lova_remember_me_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);
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
            setError(err.message || "Giriş başarısız.");
        }
        finally {
            setLoading(false);
        }
    };
    const handleRegister = async (data) => {
        setLoading(true);
        try {
            const user = await authService.register(email, password, data.name, data.styles);
            if (user)
                onLogin(user);
            else {
                alert("Kayıt başarılı! Lütfen e-postanızı doğrulayın.");
                setView('login');
            }
        }
        catch (err) {
            setError(err.message);
            setView('register');
        }
        finally {
            setLoading(false);
        }
    };
    const [onboardingMode, setOnboardingMode] = useState(false);
    const startRegister = (e) => {
        e.preventDefault();
        if (!email || !password)
            return setError("E-posta ve şifre gerekli.");
        const pwCheck = authService.validatePassword(password);
        if (!pwCheck.valid)
            return setError(pwCheck.error || "Şifre zayıf.");
        setOnboardingMode(true);
    };
    if (onboardingMode) {
        return _jsx(OnboardingFlow, { onComplete: handleRegister, initialName: name });
    }
    return (_jsxs("div", { className: "relative h-full w-full bg-page dark:bg-page-dark transition-colors duration-500 overflow-hidden font-sans", children: [_jsxs("div", { className: "absolute inset-0 z-0", children: [_jsx("img", { 
                        // High-res Silk/Nude Texture Image
                        src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=2576&auto=format&fit=crop", className: "w-full h-full object-cover object-center", alt: "Editorial Texture" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/10" })] }), _jsxs("div", { className: "absolute top-0 left-0 right-0 z-10 pt-16 text-center", children: [_jsx("h1", { className: "text-6xl font-serif text-white tracking-tighter drop-shadow-md animate-fade-in", children: "LOVA" }), _jsx("p", { className: "text-[10px] font-bold text-white/90 uppercase tracking-[0.4em] mt-2 drop-shadow-sm animate-slide-up", style: { animationDelay: '0.1s' }, children: "Personal Style Coach" })] }), _jsx("div", { className: "absolute bottom-0 left-0 right-0 z-20 flex flex-col justify-end h-full pointer-events-none", children: _jsxs("div", { className: "pointer-events-auto bg-page/60 dark:bg-page-dark/70 backdrop-blur-2xl rounded-t-[40px] px-8 pt-8 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-slide-up max-h-[75vh] overflow-y-auto no-scrollbar border-t border-white/20", children: [_jsxs("div", { className: "mb-6 text-center", children: [_jsx("h2", { className: "text-3xl font-serif text-primary dark:text-primary-dark", children: view === 'login' ? 'Tekrar Hoşgeldin' : (view === 'register' ? 'Üyelik Oluştur' : 'Şifre Sıfırla') }), _jsx("div", { className: "w-12 h-1 bg-accent rounded-full mx-auto mt-3 mb-2" }), _jsx("p", { className: "text-sm text-secondary dark:text-secondary-dark font-light", children: view === 'login' ? 'Stil yolculuğuna kaldığın yerden devam et.' : 'Sana özel stil önerileri için katıl.' })] }), error && (_jsxs("div", { className: "mb-6 flex items-center gap-3 text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/20 animate-scale-in", children: [_jsx(AlertCircle, { size: 16 }), " ", error] })), _jsxs("form", { onSubmit: view === 'login' ? handleLogin : (view === 'register' ? startRegister : (e) => e.preventDefault()), className: "space-y-2", children: [_jsx(Input, { label: "E-POSTA ADRES\u0130", value: email, onChange: setEmail, placeholder: "isim@ornek.com", type: "email", 
                                    // FULLY TRANSPARENT INPUTS
                                    className: "!bg-transparent border border-white/30 focus:border-accent text-primary dark:text-white placeholder:text-secondary/60" }), view !== 'forgot' && (_jsx(Input, { label: "\u015E\u0130FRE", value: password, onChange: setPassword, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", type: "password", 
                                    // FULLY TRANSPARENT INPUTS
                                    className: "!bg-transparent border border-white/30 focus:border-accent text-primary dark:text-white placeholder:text-secondary/60" })), view === 'login' && (_jsxs("div", { className: "flex items-center justify-between mb-8 mt-2 pl-1 pr-1", children: [_jsxs("button", { type: "button", onClick: () => setRememberMe(!rememberMe), className: "flex items-center gap-2 group", children: [_jsx("div", { className: `w-4 h-4 rounded-full border flex items-center justify-center transition-colors duration-300 ${rememberMe ? 'bg-accent border-accent' : 'border-secondary/40 dark:border-secondary-dark'}`, children: rememberMe && _jsx("div", { className: "w-1.5 h-1.5 bg-white rounded-full" }) }), _jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-secondary dark:text-secondary-dark group-hover:text-primary dark:group-hover:text-primary-dark transition-colors", children: "Beni Hat\u0131rla" })] }), _jsx("button", { type: "button", onClick: () => setView('forgot'), className: "text-[10px] font-bold uppercase tracking-wider text-secondary dark:text-secondary-dark hover:text-accent transition-colors", children: "\u015Eifremi Unuttum" })] })), _jsx(Button, { type: "submit", disabled: loading, className: "mb-4 !rounded-2xl shadow-xl hover:shadow-glow !py-4", children: loading ? _jsx(Loader2, { className: "animate-spin", size: 20 }) : (view === 'login' ? 'GİRİŞ YAP' : (view === 'register' ? 'DEVAM ET' : 'GÖNDER')) })] }), _jsxs("div", { className: "mt-2 text-center pt-4 border-t border-primary/5 dark:border-white/5", children: [view === 'login' && (_jsxs("p", { className: "text-secondary dark:text-secondary-dark text-xs", children: ["Hesab\u0131n yok mu? ", _jsx("button", { onClick: () => { setView('register'); setError(null); }, className: "text-primary dark:text-primary-dark font-bold ml-1 hover:underline decoration-accent underline-offset-4", children: "Hemen Kat\u0131l" })] })), view === 'register' && (_jsxs("p", { className: "text-secondary dark:text-secondary-dark text-xs", children: ["Zaten \u00FCye misin? ", _jsx("button", { onClick: () => { setView('login'); setError(null); }, className: "text-primary dark:text-primary-dark font-bold ml-1 hover:underline decoration-accent underline-offset-4", children: "Giri\u015F Yap" })] })), view === 'forgot' && (_jsxs("button", { onClick: () => setView('login'), className: "text-primary dark:text-primary-dark text-xs font-bold hover:underline decoration-accent underline-offset-4 flex items-center justify-center gap-2 mx-auto", children: [_jsx(ArrowRight, { size: 12, className: "rotate-180" }), " Giri\u015F Ekran\u0131na D\u00F6n"] })), _jsxs("div", { className: "flex items-center justify-center gap-6 mt-6 opacity-60", children: [_jsx("button", { onClick: () => setShowPrivacy(true), className: "text-[9px] font-bold uppercase text-secondary hover:text-primary transition-colors", children: "Gizlilik Politikas\u0131" }), _jsx("span", { className: "w-1 h-1 rounded-full bg-secondary" }), _jsx("button", { onClick: () => setShowTerms(true), className: "text-[9px] font-bold uppercase text-secondary hover:text-primary transition-colors", children: "Kullan\u0131m Ko\u015Fullar\u0131" })] })] })] }) }), showPrivacy && _jsx(LegalModal, { type: "privacy", onClose: () => setShowPrivacy(false) }), showTerms && _jsx(LegalModal, { type: "terms", onClose: () => setShowTerms(false) })] }));
};
