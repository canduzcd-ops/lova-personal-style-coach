import React, { useEffect, useState } from 'react';
import { ArrowRight, Loader2, Chrome, Apple } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../components/Shared';
import { authService } from '../services/authService';
import { UserProfile } from '../types';
import { OnboardingFlow } from './OnboardingFlow';
import { LegalModal } from './LegalScreens';
import { setAppLanguage } from '../src/i18n';
import { StateCard } from '../components/StateCard';
import { Toast, ToastType } from '../components/Toast';
import { Capacitor } from '@capacitor/core';

interface Props {
  onLogin: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<Props> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: ToastType; title: string; desc?: string } | null>(null);

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
    } catch (e) {
      console.warn('[AuthScreen] localStorage read failed:', e);
    }
  }, []);

  const currentLang: 'tr' | 'en' =
    (i18n.resolvedLanguage || i18n.language || '').startsWith('en') ? 'en' : 'tr';

  const setLang = async (lng: 'tr' | 'en') => {
    try {
      await setAppLanguage(lng);
    } catch (e) {
      console.error('changeLanguage error:', e);
    }
  };

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
      setError(err.message || t('auth.alerts.loginFailed', 'Giriş başarısız.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: { name: string; styles: string[] }) => {
    setLoading(true);
    setOnboardingMode(false);
    try {
      const user = await authService.register(email, password, data.name, data.styles);
      if (user) onLogin(user);
      else {
        setToast({ type: 'success', title: t('auth.alerts.registerSuccessVerify', 'Kayıt başarılı! Lütfen e-postanı doğrula.') });
        setView('login');
      }
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.message || t('auth.alerts.registerFailed', 'Kayıt hatası.'));
      setView('register');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedEmail = email.trim();
    if (!cleanedEmail) return setError(t('auth.alerts.emailRequired'));
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(cleanedEmail);
      setToast({ type: 'success', title: t('auth.alerts.resetSuccess') });
      setView('login');
    } catch (err: any) {
      setError(err.message || t('auth.alerts.resetFailed', 'Şifre sıfırlama e-postası gönderilemedi.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await authService.loginWithGoogle();
      onLogin(user);
    } catch (err: any) {
      // Redirect durumunda hata gösterme
      if (err.message === 'REDIRECT_IN_PROGRESS') {
        console.log('[Auth] Google redirect başlatıldı');
        return;
      }
      setError(err.message || 'Google giriş başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await authService.loginWithApple();
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Apple giriş başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const startRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError(t('auth.alerts.emailRequired'));
    const pwCheck = authService.validatePassword(password);
    if (!pwCheck.valid) return setError(pwCheck.error || t('auth.alerts.weakPassword', 'Şifre zayıf.'));
    setOnboardingMode(true);
  };

  if (onboardingMode) {
    return <OnboardingFlow onComplete={handleRegister} initialName={name} />;
  }

  return (
    <div
      className="relative w-full bg-page dark:bg-page-dark transition-colors duration-500 font-sans"
      style={{ 
        minHeight: '100dvh', 
        display: 'flex', 
        flexDirection: 'column',
        touchAction: 'pan-y',
        overflowX: 'hidden',
      }}
    >
      {/* TR/EN SWITCHER */}
      <div className="absolute top-4 right-4 z-[999999] pointer-events-auto" style={{ WebkitTapHighlightColor: 'transparent' }}>
        <div className="flex gap-1 bg-black/20 backdrop-blur-xl border border-white/20 rounded-full p-1">
          <button
            type="button"
            onClick={() => setLang('tr')}
            className={`px-3 py-1 rounded-full text-[10px] font-bold ${
              currentLang === 'tr' ? 'bg-white text-black' : 'text-white/90'
            }`}
          >
            TR
          </button>

          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-full text-[10px] font-bold ${
              currentLang === 'en' ? 'bg-white text-black' : 'text-white/90'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      {/* FULL SCREEN BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=2576&fm=jpg&fit=crop"
          className="w-full h-full object-cover object-center"
          alt="Editorial Texture"
          onError={(e) => {
            // Fallback gradient if image fails to load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/60" />
      </div>

      {/* LOGO AREA */}
      <div className="relative z-10 pt-20 text-center">
        <h1 className="text-6xl font-serif text-white tracking-tighter drop-shadow-lg animate-fade-in">LOVA</h1>
        <p
          className="text-[10px] font-bold text-white/90 uppercase tracking-[0.4em] mt-2 drop-shadow-sm animate-slide-up"
          style={{ animationDelay: '0.1s' }}
        >
          {t('auth.brand.tagline', 'Personal Style Coach')}
        </p>
      </div>

      {/* CONTENT BOTTOM SHEET */}
      <div className="relative z-20 mt-auto">
        <div 
          className="bg-page/95 dark:bg-page-dark/95 backdrop-blur-2xl rounded-t-[40px] px-8 pt-8 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-slide-up border-t border-white/10"
          style={{
            maxHeight: '72vh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-serif text-primary dark:text-primary-dark">
              {view === 'login'
                ? t('auth.title.login')
                : view === 'register'
                ? t('auth.title.register')
                : t('auth.title.forgot')}
            </h2>
            <div className="w-12 h-1 bg-accent rounded-full mx-auto mt-3 mb-2" />
            <p className="text-sm text-secondary dark:text-secondary-dark font-light">
              {view === 'login'
                ? t('auth.subtitle.login')
                : view === 'register'
                ? t('auth.subtitle.register')
                : t('auth.subtitle.forgot')}
            </p>
          </div>

          {error && (
            <div className="mb-6 animate-scale-in">
              <StateCard type="error" title={t('auth.alerts.errorTitle', 'Bir sorun oluştu')} desc={error} />
            </div>
          )}

          <form
            onSubmit={view === 'login' ? handleLogin : view === 'register' ? startRegister : handleForgotPassword}
            className="space-y-2"
          >
            <Input
              label={t('auth.emailLabel')}
              value={email}
              onChange={setEmail}
              placeholder={t('auth.emailPlaceholder', 'isim@ornek.com')}
              type="email"
              className="!bg-surface/50 dark:!bg-surface-dark/50 border border-border dark:border-border-dark focus:border-accent text-primary dark:text-primary-dark placeholder:text-secondary/60"
            />

            {view !== 'forgot' && (
              <Input
                label={t('auth.passwordLabel')}
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                type="password"
                className="!bg-surface/50 dark:!bg-surface-dark/50 border border-border dark:border-border-dark focus:border-accent text-primary dark:text-primary-dark placeholder:text-secondary/60"
              />
            )}

            {view === 'login' && (
              <div className="flex items-center justify-between mb-8 mt-2 pl-1 pr-1">
                <button type="button" onClick={() => setRememberMe(!rememberMe)} className="flex items-center gap-2 group">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors duration-300 ${
                      rememberMe ? 'bg-accent border-accent' : 'border-secondary/40 dark:border-secondary-dark'
                    }`}
                  >
                    {rememberMe && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary dark:text-secondary-dark group-hover:text-primary dark:group-hover:text-primary-dark transition-colors">
                    {t('auth.rememberMe')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setView('forgot')}
                  className="text-[10px] font-bold uppercase tracking-wider text-secondary dark:text-secondary-dark hover:text-accent transition-colors"
                >
                  {t('auth.forgot')}
                </button>
              </div>
            )}

            <Button type="submit" disabled={loading} className="mb-4 !rounded-2xl shadow-xl hover:shadow-glow !py-4">
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : view === 'login' ? (
                t('auth.submit.login')
              ) : view === 'register' ? (
                t('auth.submit.register')
              ) : (
                t('auth.submit.forgot')
              )}
            </Button>
          </form>

          {/* Social Login Options (Login & Register views only) */}
          {(view === 'login' || view === 'register') && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border dark:bg-border-dark" />
                <span className="text-[10px] font-bold uppercase text-secondary/60 px-2">ya da</span>
                <div className="flex-1 h-px bg-border dark:bg-border-dark" />
              </div>

              <div className="space-y-2">
                {/* Google Sign-In - Available on web */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-border dark:border-border-dark bg-surface/50 dark:bg-surface-dark/50 hover:bg-surface dark:hover:bg-surface-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Chrome size={16} className="text-primary dark:text-primary-dark" />
                  <span className="text-sm font-semibold text-primary dark:text-primary-dark">Google ile Giriş Yap</span>
                </button>

                {/* Apple Sign-In - iOS native only */}
                {Capacitor.getPlatform() === 'ios' && (
                  <button
                    type="button"
                    onClick={handleAppleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-border dark:border-border-dark bg-surface/50 dark:bg-surface-dark/50 hover:bg-surface dark:hover:bg-surface-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Apple size={16} className="text-primary dark:text-primary-dark" />
                    <span className="text-sm font-semibold text-primary dark:text-primary-dark">Apple ile Giriş Yap</span>
                  </button>
                )}
              </div>
            </>
          )}

          <div className="mt-4 text-center pt-4 border-t border-border/30 dark:border-border-dark/30">
            {view === 'login' && (
              <p className="text-secondary dark:text-secondary-dark text-xs">
                {t('auth.footer.noAccount')}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setView('register');
                    setError(null);
                  }}
                  className="text-primary dark:text-primary-dark font-bold ml-1 hover:underline decoration-accent underline-offset-4"
                >
                  {t('auth.footer.join')}
                </button>
              </p>
            )}

            {view === 'register' && (
              <p className="text-secondary dark:text-secondary-dark text-xs">
                {t('auth.footer.haveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError(null);
                  }}
                  className="text-primary dark:text-primary-dark font-bold ml-1 hover:underline decoration-accent underline-offset-4"
                >
                  {t('auth.footer.login')}
                </button>
              </p>
            )}

            {view === 'forgot' && (
              <button
                type="button"
                onClick={() => setView('login')}
                className="text-primary dark:text-primary-dark text-xs font-bold hover:underline decoration-accent underline-offset-4 flex items-center justify-center gap-2 mx-auto"
              >
                <ArrowRight size={12} className="rotate-180" /> {t('auth.footer.back')}
              </button>
            )}

            <div className="flex items-center justify-center gap-6 mt-6 opacity-60">
              <button type="button" onClick={() => setShowPrivacy(true)} className="text-[9px] font-bold uppercase text-secondary hover:text-primary transition-colors">
                {t('auth.legal.privacy')}
              </button>
              <span className="w-1 h-1 rounded-full bg-secondary" />
              <button type="button" onClick={() => setShowTerms(true)} className="text-[9px] font-bold uppercase text-secondary hover:text-primary transition-colors">
                {t('auth.legal.terms')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPrivacy && <LegalModal type="privacy" onClose={() => setShowPrivacy(false)} />}
      {showTerms && <LegalModal type="terms" onClose={() => setShowTerms(false)} />}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          desc={toast.desc}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
