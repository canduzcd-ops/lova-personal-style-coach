import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { AuthScreen } from './screens/AuthScreen';
import { Dashboard } from './screens/Dashboard';
import { IntroScreen } from './screens/IntroScreen';
import { authService } from './services/authService';
import { auth } from './services/firebaseClient';
import { Loader2 } from 'lucide-react';
import { PremiumProvider } from './contexts/PremiumContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { ModalStackProvider, useModalStack } from './src/contexts/ModalStackContext';
import { ModalPortal } from './src/components/ModalPortal';
import { checkDormantAndNotify } from './services/engagementService';
const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [introSeen, setIntroSeen] = useState(false);
    // Render dışı hataları yakala
    const [fatal, setFatal] = useState(null);
    useEffect(() => {
        const onError = (event) => {
            const msg = event?.error?.message || event.message || 'Unknown window error';
            const stack = event?.error?.stack;
            console.error('[WINDOW ERROR]', event?.error || event.message);
            setFatal({ type: 'window.onerror', message: msg, stack });
        };
        const onRejection = (event) => {
            const reason = event.reason;
            const msg = reason?.message || String(reason) || 'Unknown unhandled rejection';
            const stack = reason?.stack;
            console.error('[UNHANDLED REJECTION]', reason);
            setFatal({ type: 'unhandledrejection', message: msg, stack });
        };
        window.addEventListener('error', onError);
        window.addEventListener('unhandledrejection', onRejection);
        return () => {
            window.removeEventListener('error', onError);
            window.removeEventListener('unhandledrejection', onRejection);
        };
    }, []);
    useEffect(() => {
        try {
            const hasSeenIntro = localStorage.getItem('lova_intro_seen') === 'true';
            setIntroSeen(hasSeenIntro);
        }
        catch (e) {
            console.warn('[LS] localStorage read failed', e);
            setIntroSeen(false);
        }
        // Android'de Google Sign-In redirect sonucunu kontrol et
        const checkRedirectResult = async () => {
            try {
                console.log('[AUTH] Checking redirect result...');
                const result = await auth.getRedirectResult();
                if (result?.user) {
                    console.log('[AUTH] Redirect result found:', result.user.email);
                    // onAuthStateChanged zaten tetiklenecek
                }
                else {
                    console.log('[AUTH] No redirect result');
                }
            }
            catch (error) {
                console.error('[AUTH] getRedirectResult error:', error);
            }
        };
        checkRedirectResult();
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            console.log('[AUTH] onAuthStateChanged fired', !!firebaseUser);
            try {
                if (firebaseUser) {
                    try {
                        const profile = await authService.getCurrentSessionUser();
                        if (profile) {
                            setUser(profile);
                            checkDormantAndNotify().catch((err) => console.warn('Dormant check failed', err));
                        }
                        else {
                            setUser(null);
                        }
                    }
                    catch (e) {
                        console.warn('[AUTH] getCurrentSessionUser FAILED', e);
                        setUser(null);
                    }
                }
                else {
                    setUser(null);
                }
            }
            finally {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);
    useEffect(() => {
        if (user?.theme === 'dark')
            document.documentElement.classList.add('dark');
        else
            document.documentElement.classList.remove('dark');
    }, [user?.theme]);
    const handleIntroComplete = () => {
        try {
            localStorage.setItem('lova_intro_seen', 'true');
        }
        catch (e) {
            console.warn('[LS] localStorage write failed', e);
        }
        setIntroSeen(true);
    };
    const stage = useMemo(() => {
        if (loading)
            return 'loading';
        if (!user && !introSeen)
            return 'intro';
        if (!user && introSeen)
            return 'auth';
        return 'dashboard';
    }, [loading, user, introSeen]);
    if (fatal) {
        return (_jsxs("div", { style: {
                padding: 16,
                fontFamily: 'monospace',
                color: '#fff',
                background: '#b00020',
                minHeight: '100vh',
                overflow: 'auto',
            }, children: [_jsx("div", { style: { fontSize: 16, fontWeight: 800, marginBottom: 10 }, children: "FATAL ERROR" }), _jsxs("div", { style: { opacity: 0.9, marginBottom: 10 }, children: ["Type: ", fatal.type] }), _jsx("div", { style: { whiteSpace: 'pre-wrap' }, children: fatal.message }), fatal.stack ? (_jsxs(_Fragment, { children: [_jsx("hr", { style: { margin: '12px 0', opacity: 0.4 } }), _jsx("div", { style: { whiteSpace: 'pre-wrap', opacity: 0.9 }, children: fatal.stack })] })) : null] }));
    }
    if (loading) {
        return (_jsx("div", { className: "h-screen w-full flex items-center justify-center bg-page dark:bg-page-dark", children: _jsx(Loader2, { className: "animate-spin text-secondary", size: 32 }) }));
    }
    return (_jsx(ModalStackProvider, { children: _jsx(PremiumProvider, { children: _jsxs(NetworkProvider, { children: [_jsx(AppContent, { user: user, introSeen: introSeen, handleIntroComplete: handleIntroComplete, setUser: setUser }), _jsx(ModalPortal, {})] }) }) }));
};
const AppContent = ({ user, introSeen, handleIntroComplete, setUser }) => {
    const { isAnyOpen } = useModalStack();
    return (_jsx("div", { className: "relative min-h-[100dvh] flex flex-col bg-page dark:bg-page-dark font-sans max-w-md mx-auto shadow-2xl text-primary dark:text-primary-dark", style: {
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            overflowY: isAnyOpen ? 'hidden' : 'auto',
            overflowX: 'hidden',
        }, children: !user ? (!introSeen ? (_jsx(IntroScreen, { onComplete: handleIntroComplete })) : (_jsx(AuthScreen, { onLogin: setUser }))) : (_jsx(Dashboard, { user: user, onLogout: () => {
                authService.logout();
                setUser(null);
            }, updateUser: setUser })) }));
};
export default App;
