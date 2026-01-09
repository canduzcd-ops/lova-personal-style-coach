import React, { useEffect, useMemo, useState } from 'react';
import { Check, X, Crown, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '../components/Shared';
import { SUBSCRIPTION_PLANS, UserProfile } from '../types';
import { iapService, PlanId } from '../services/iapService';
import { Capacitor } from '@capacitor/core';
import { usePremium } from '../contexts/PremiumContext';

interface Props {
  user: UserProfile;
  onClose: () => void;
  onSuccess: (updatedUser: UserProfile) => void;
}

type PriceState = {
  monthly?: string;
  yearly?: string;
};

export const PremiumScreen: React.FC<Props> = ({ user, onClose, onSuccess }) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [prices, setPrices] = useState<PriceState>({});
  const [iapReady, setIapReady] = useState<boolean>(false);
  const [iapError, setIapError] = useState<string | null>(null);
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
      } catch (e: any) {
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
    } catch (error: any) {
      console.error(error);
      alert(error?.message || 'Satın alma işlemi başarısız oldu.');
    } finally {
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
      } else {
        premium.clear();
        alert('Bu hesapta aktif abonelik bulunamadı.');
      }
      onSuccess(user);
    } catch (error: any) {
      console.error(error);
      alert(error?.message || 'Restore işlemi başarısız oldu.');
    } finally {
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

  return (
    <div className="fixed inset-0 z-50 bg-page flex flex-col animate-slide-up-modal">
      {/* Header Image Area */}
      <div className="h-64 relative bg-surface flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-page z-10"></div>
        <img
          src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80"
          className="w-full h-full object-cover opacity-80 animate-scale-in sepia-[0.2]"
          alt="Premium Fashion"
        />

        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 bg-white/40 backdrop-blur-md p-2 rounded-full text-primary hover:bg-white transition-colors active:scale-90 duration-200"
        >
          <X size={20} />
        </button>

        <div className="absolute bottom-6 left-6 z-20 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-accent text-white px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3 shadow-glow">
            <Crown size={12} fill="currentColor" /> Lova Premium
          </div>
          <h2 className="text-4xl font-serif text-primary leading-none">
            Tarzını<br />Limitlere Takılmadan Yansıt.
          </h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-page">
        {/* IAP Status */}
        {!isNative && (
          <div className="mb-4 p-3 rounded-xl border border-border/40 bg-white/40 text-xs text-secondary">
            Bu ekran mobilde “satın alma” yapar. Şu an web’de görüntülüyorsun.
          </div>
        )}

        {isNative && !iapReady && (
          <div className="mb-4 p-3 rounded-xl border border-border/40 bg-white/40 text-xs text-secondary">
            Satın alma sistemi hazırlanıyor…
            {iapError ? <div className="mt-1 text-red-500">{iapError}</div> : null}
          </div>
        )}

        {/* Features */}
        <div className="space-y-4 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3 text-secondary">
              <div className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-accent">
                <Check size={14} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-medium text-primary">{feature}</span>
            </div>
          ))}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {/* Monthly */}
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`p-4 rounded-[20px] border-2 transition-all duration-300 ease-luxury relative flex flex-col h-32 justify-between active:scale-95 ${
              selectedPlan === 'monthly'
                ? 'border-accent bg-surface shadow-soft scale-105'
                : 'border-border/30 bg-white/50 hover:border-border'
            }`}
          >
            <div className="text-left">
              <span className="text-secondary text-[10px] font-bold uppercase tracking-widest block mb-1">
                {SUBSCRIPTION_PLANS.monthly.period}
              </span>
              <span className="text-primary font-serif text-2xl">{monthlyPriceText}</span>
            </div>
            <div className="text-left text-[10px] text-secondary font-medium">{SUBSCRIPTION_PLANS.monthly.label}</div>

            {selectedPlan === 'monthly' && (
              <div className="absolute top-3 right-3 text-accent animate-pop">
                <Check size={18} />
              </div>
            )}
          </button>

          {/* Yearly */}
          <button
            onClick={() => setSelectedPlan('yearly')}
            className={`p-4 rounded-[20px] border-2 transition-all duration-300 ease-luxury relative flex flex-col h-32 justify-between active:scale-95 ${
              selectedPlan === 'yearly'
                ? 'border-accent bg-surface shadow-soft scale-105'
                : 'border-border/30 bg-white/50 hover:border-border'
            }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg whitespace-nowrap animate-pulse-slow">
              {SUBSCRIPTION_PLANS.yearly.discount}
            </div>

            <div className="text-left mt-2">
              <span className="text-secondary text-[10px] font-bold uppercase tracking-widest block mb-1">
                {SUBSCRIPTION_PLANS.yearly.period}
              </span>
              <span className="text-primary font-serif text-2xl">{yearlyPriceText}</span>
            </div>
            <div className="text-left text-[10px] text-accent font-bold">{SUBSCRIPTION_PLANS.yearly.label}</div>

            {selectedPlan === 'yearly' && (
              <div className="absolute top-3 right-3 text-accent animate-pop">
                <Check size={18} />
              </div>
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="mt-auto space-y-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Button
            onClick={handlePurchase}
            disabled={loading || (isNative && !iapReady)}
            variant="primary"
            className="shadow-lg hover:shadow-glow"
          >
            {loading ? 'İşleniyor...' : (selectedPlan === 'yearly' ? 'Yıllık Planla Başla' : 'Aylık Planla Başla')}
          </Button>

          <button
            onClick={handleRestore}
            disabled={restoring || (isNative && !iapReady)}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-[16px] border border-border/40 bg-white/40 text-primary font-bold text-xs hover:bg-white/60 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} />
            {restoring ? 'Geri yükleniyor…' : 'Satın Alımları Geri Yükle'}
          </button>

          <button
            onClick={() => iapService.openManageSubscriptions()}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-[16px] border border-border/40 bg-transparent text-secondary font-bold text-xs hover:text-primary transition-colors"
          >
            Aboneliği Yönet <ExternalLink size={14} />
          </button>

          <div className="flex items-center justify-center gap-4 pt-1">
            <button onClick={openTerms} className="text-[10px] text-secondary/70 hover:text-primary font-bold">
              Şartlar
            </button>
            <span className="text-secondary/30 text-[10px]">•</span>
            <button onClick={openPrivacy} className="text-[10px] text-secondary/70 hover:text-primary font-bold">
              Gizlilik
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full text-center text-xs text-secondary/60 hover:text-primary transition-colors font-bold pt-1"
          >
            Ücretsiz versiyon ile devam et
          </button>

          <p className="text-center text-[9px] text-secondary/40 mt-1 leading-relaxed px-4">
            Ödeme, onayınızın ardından hesabınızdan tahsil edilir. Abonelik otomatik yenilenir.
            İptal edilmediği sürece dönem sonunda devam eder.
          </p>
        </div>
      </div>
    </div>
  );
};
