
import React, { useState, useEffect } from 'react';
import { AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Button, Input } from '../components/Shared';
import { authService } from '../services/authService';
import { UserProfile } from '../types';
import { OnboardingFlow } from './OnboardingFlow';
import { LegalModal } from './LegalScreens';

interface Props {
  onLogin: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<Props> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
        const user = await authService.login(email, password);
        if (rememberMe) localStorage.setItem('lova_remember_me_email', email);
        else localStorage.removeItem('lova_remember_me_email');
        onLogin(user);
    } catch (err: any) {
        setError(err.message || "Giriş başarısız.");
    } finally {
        setLoading(false);
    }
  };

  const handleRegister = async (data: { name: string; styles: string[] }) => {
      setLoading(true);
      try {
          const user = await authService.register(email, password, data.name, data.styles);
          if (user) onLogin(user);
          else {
              alert("Kayıt başarılı! Lütfen e-postanızı doğrulayın.");
              setView('login');
          }
      } catch (err: any) {
          setError(err.message);
          setView('register'); 
      } finally {
          setLoading(false);
      }
  };

  const [onboardingMode, setOnboardingMode] = useState(false);
  const startRegister = (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || !password) return setError("E-posta ve şifre gerekli.");
      const pwCheck = authService.validatePassword(password);
      if (!pwCheck.valid) return setError(pwCheck.error || "Şifre zayıf.");
      setOnboardingMode(true);
  };

  if (onboardingMode) {
      return <OnboardingFlow onComplete={handleRegister} initialName={name} />;
  }

  return (
    <div className="relative h-full w-full bg-page dark:bg-page-dark transition-colors duration-500 overflow-hidden font-sans">
        
        {/* FULL SCREEN BACKGROUND IMAGE */}
        <div className="absolute inset-0 z-0">
            <img 
                // High-res Silk/Nude Texture Image
                src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=2576&auto=format&fit=crop" 
                className="w-full h-full object-cover object-center"
                alt="Editorial Texture"
            />
            {/* Subtle Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/10"></div>
        </div>

        {/* LOGO AREA (Floating Top) */}
        <div className="absolute top-0 left-0 right-0 z-10 pt-16 text-center">
            <h1 className="text-6xl font-serif text-white tracking-tighter drop-shadow-md animate-fade-in">LOVA</h1>
            <p className="text-[10px] font-bold text-white/90 uppercase tracking-[0.4em] mt-2 drop-shadow-sm animate-slide-up" style={{animationDelay: '0.1s'}}>
                Personal Style Coach
            </p>
        </div>

        {/* CONTENT BOTTOM SHEET (Glassmorphism) */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col justify-end h-full pointer-events-none">
            
            {/* The Form Container - Transparency maintained */}
            <div className="pointer-events-auto bg-page/60 dark:bg-page-dark/70 backdrop-blur-2xl rounded-t-[40px] px-8 pt-8 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-slide-up max-h-[75vh] overflow-y-auto no-scrollbar border-t border-white/20">
                
                {/* Header Text */}
                <div className="mb-6 text-center">
                    <h2 className="text-3xl font-serif text-primary dark:text-primary-dark">
                        {view === 'login' ? 'Tekrar Hoşgeldin' : (view === 'register' ? 'Üyelik Oluştur' : 'Şifre Sıfırla')}
                    </h2>
                    <div className="w-12 h-1 bg-accent rounded-full mx-auto mt-3 mb-2"></div>
                    <p className="text-sm text-secondary dark:text-secondary-dark font-light">
                        {view === 'login' ? 'Stil yolculuğuna kaldığın yerden devam et.' : 'Sana özel stil önerileri için katıl.'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 flex items-center gap-3 text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/20 animate-scale-in">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={view === 'login' ? handleLogin : (view === 'register' ? startRegister : (e) => e.preventDefault())} className="space-y-2">
                    <Input 
                        label="E-POSTA ADRESİ" 
                        value={email} 
                        onChange={setEmail} 
                        placeholder="isim@ornek.com" 
                        type="email"
                        // FULLY TRANSPARENT INPUTS
                        className="!bg-transparent border border-white/30 focus:border-accent text-primary dark:text-white placeholder:text-secondary/60"
                    />

                    {view !== 'forgot' && (
                        <Input 
                            label="ŞİFRE" 
                            value={password} 
                            onChange={setPassword} 
                            placeholder="••••••••" 
                            type="password"
                            // FULLY TRANSPARENT INPUTS
                            className="!bg-transparent border border-white/30 focus:border-accent text-primary dark:text-white placeholder:text-secondary/60"
                        />
                    )}

                    {/* Options Row */}
                    {view === 'login' && (
                        <div className="flex items-center justify-between mb-8 mt-2 pl-1 pr-1">
                            <button 
                                type="button" 
                                onClick={() => setRememberMe(!rememberMe)}
                                className="flex items-center gap-2 group"
                            >
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors duration-300 ${rememberMe ? 'bg-accent border-accent' : 'border-secondary/40 dark:border-secondary-dark'}`}>
                                    {rememberMe && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary dark:text-secondary-dark group-hover:text-primary dark:group-hover:text-primary-dark transition-colors">Beni Hatırla</span>
                            </button>
                            
                            <button type="button" onClick={() => setView('forgot')} className="text-[10px] font-bold uppercase tracking-wider text-secondary dark:text-secondary-dark hover:text-accent transition-colors">
                                Şifremi Unuttum
                            </button>
                        </div>
                    )}

                    <Button 
                        type="submit" 
                        disabled={loading} 
                        className="mb-4 !rounded-2xl shadow-xl hover:shadow-glow !py-4"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            view === 'login' ? 'GİRİŞ YAP' : (view === 'register' ? 'DEVAM ET' : 'GÖNDER')
                        )}
                    </Button>
                </form>

                {/* Footer Links */}
                <div className="mt-2 text-center pt-4 border-t border-primary/5 dark:border-white/5">
                    {view === 'login' && (
                        <p className="text-secondary dark:text-secondary-dark text-xs">
                            Hesabın yok mu? <button onClick={() => { setView('register'); setError(null); }} className="text-primary dark:text-primary-dark font-bold ml-1 hover:underline decoration-accent underline-offset-4">Hemen Katıl</button>
                        </p>
                    )}
                    {view === 'register' && (
                        <p className="text-secondary dark:text-secondary-dark text-xs">
                            Zaten üye misin? <button onClick={() => { setView('login'); setError(null); }} className="text-primary dark:text-primary-dark font-bold ml-1 hover:underline decoration-accent underline-offset-4">Giriş Yap</button>
                        </p>
                    )}
                    {view === 'forgot' && (
                        <button onClick={() => setView('login')} className="text-primary dark:text-primary-dark text-xs font-bold hover:underline decoration-accent underline-offset-4 flex items-center justify-center gap-2 mx-auto">
                            <ArrowRight size={12} className="rotate-180"/> Giriş Ekranına Dön
                        </button>
                    )}
                    
                    {/* Legal Links */}
                    <div className="flex items-center justify-center gap-6 mt-6 opacity-60">
                        <button onClick={() => setShowPrivacy(true)} className="text-[9px] font-bold uppercase text-secondary hover:text-primary transition-colors">Gizlilik Politikası</button>
                        <span className="w-1 h-1 rounded-full bg-secondary"></span>
                        <button onClick={() => setShowTerms(true)} className="text-[9px] font-bold uppercase text-secondary hover:text-primary transition-colors">Kullanım Koşulları</button>
                    </div>
                </div>
            </div>
        </div>

        {/* Legal Modals */}
        {showPrivacy && <LegalModal type="privacy" onClose={() => setShowPrivacy(false)} />}
        {showTerms && <LegalModal type="terms" onClose={() => setShowTerms(false)} />}
    </div>
  );
};
