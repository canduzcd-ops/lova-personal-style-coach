import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { AuthScreen } from './screens/AuthScreen';
import { Dashboard } from './screens/Dashboard';
import { IntroScreen } from './screens/IntroScreen';
import { authService } from './services/authService';
import { auth } from './services/firebaseClient';
import { Loader2 } from 'lucide-react';
import { PremiumProvider } from './contexts/PremiumContext';
const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [introSeen, setIntroSeen] = useState(false);
    useEffect(() => {
        const hasSeenIntro = localStorage.getItem('lova_intro_seen') === 'true';
        setIntroSeen(hasSeenIntro);
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const profile = await authService.getCurrentSessionUser();
                    if (profile)
                        setUser(profile);
                    else
                        setUser(null);
                }
                catch (e) {
                    setUser(null);
                }
            }
            else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    useEffect(() => {
        if (user?.theme === 'dark') {
            document.documentElement.classList.add('dark');
        }
        else {
            document.documentElement.classList.remove('dark');
        }
    }, [user?.theme]);
    const handleIntroComplete = () => {
        localStorage.setItem('lova_intro_seen', 'true');
        setIntroSeen(true);
    };
    if (loading) {
        return (_jsx("div", { className: "h-screen w-full flex items-center justify-center bg-page dark:bg-page-dark", children: _jsx(Loader2, { className: "animate-spin text-secondary", size: 32 }) }));
    }
    return (_jsx(PremiumProvider, { children: _jsx("div", { className: "relative h-screen flex flex-col bg-page dark:bg-page-dark font-sans max-w-md mx-auto shadow-2xl overflow-hidden text-primary dark:text-primary-dark", children: !user ? (!introSeen ? (_jsx(IntroScreen, { onComplete: handleIntroComplete })) : (_jsx(AuthScreen, { onLogin: setUser }))) : (_jsx(Dashboard, { user: user, onLogout: () => { authService.logout(); setUser(null); }, updateUser: setUser })) }) }));
};
export default App;
