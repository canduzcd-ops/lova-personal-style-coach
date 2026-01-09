// services/iapService.ts
import { Capacitor } from '@capacitor/core';

export type PlanId = 'monthly' | 'yearly';

type Platform = 'android' | 'ios' | 'web';

type IapPrice = {
  price: string;           // "₺49,99" gibi
  period?: string;         // "P1M" / "P1Y" gibi (varsa)
  introPrice?: string;     // varsa
};

type IapPlanInfo = {
  id: PlanId;
  title?: string;
  price?: IapPrice;
  offerId?: string;        // android offers/baseplan match
  productId?: string;      // ios için
};

export type IapEntitlement = {
  isPremium: boolean;
  activePlan?: PlanId;
  source: 'play' | 'appstore' | 'unknown';
  lastUpdatedAt: string;   // ISO
};

// ---- CONFIG (SENİN APP'E GÖRE) ----
// Android: tek subscription "lova_premium" + base plan ids: monthly/yearly
// iOS: genelde ayrı product identifier kullanılır (App Store Connect'te oluşturunca buraya yazacaksın)
const IAP_CONFIG = {
  android: {
    subscriptionId: 'lova_premium',
    basePlanIds: {
      monthly: 'monthly',
      yearly: 'yearly',
    },
  },
  ios: {
    // iOS tarafını App Store Connect’te oluşturunca bunları doldur:
    monthlyProductId: 'lova_premium_monthly',
    yearlyProductId: 'lova_premium_yearly',
  },
  // Manage links (opsiyonel ama iyi)
  manage: {
    androidPackageName: 'com.racalabs.thelova',
  },
} as const;

// Minimal global typings (plugin TS type vermeyebiliyor)
declare global {
  interface Window {
    CdvPurchase?: any;
    store?: any;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function getPlatform(): Platform {
  if (!Capacitor.isNativePlatform()) return 'web';
  const p = Capacitor.getPlatform();
  if (p === 'android' || p === 'ios') return p;
  return 'web';
}

function getStore(): any | null {
  const s = (window as any).CdvPurchase?.store || (window as any).store;
  return s ?? null;
}

function safeText(x: any, fallback = ''): string {
  if (typeof x === 'string') return x;
  if (x == null) return fallback;
  return String(x);
}

function pickBestPrice(offerOrProduct: any): IapPrice | undefined {
  // cordova-plugin-purchase: offers için pricingPhases / pricingPhase gibi alanlar değişebiliyor.
  // Bu yüzden olabildiğince toleranslı parse ediyoruz.
  try {
    const price =
      offerOrProduct?.pricingPhases?.[0]?.price ||
      offerOrProduct?.pricingPhase?.price ||
      offerOrProduct?.price ||
      offerOrProduct?.pricing?.price ||
      offerOrProduct?.priceMicros; // bazen number gelebilir

    const period =
      offerOrProduct?.pricingPhases?.[0]?.billingPeriod ||
      offerOrProduct?.pricingPhase?.billingPeriod ||
      offerOrProduct?.billingPeriod;

    const introPrice =
      offerOrProduct?.pricingPhases?.[0]?.introPrice ||
      offerOrProduct?.introPrice;

    if (price == null) return undefined;

    return {
      price: safeText(price),
      period: period ? safeText(period) : undefined,
      introPrice: introPrice ? safeText(introPrice) : undefined,
    };
  } catch {
    return undefined;
  }
}

function periodMatchesPlan(period: string | undefined, plan: PlanId) {
  // ISO-8601 billing periods: P1M, P1Y
  if (!period) return false;
  const p = period.toUpperCase();
  if (plan === 'monthly') return p.includes('P1M');
  if (plan === 'yearly') return p.includes('P1Y');
  return false;
}

function offerLooksLikePlan(offer: any, plan: PlanId) {
  const id = safeText(offer?.id || offer?.offerId || offer?.identifier, '').toLowerCase();
  if (id.includes(plan)) return true;

  // some builds include basePlanId on android
  const basePlanId = safeText(offer?.basePlanId, '').toLowerCase();
  if (basePlanId && basePlanId === plan) return true;

  // pricing period match
  const period =
    offer?.pricingPhases?.[0]?.billingPeriod ||
    offer?.pricingPhase?.billingPeriod ||
    offer?.billingPeriod;

  return periodMatchesPlan(period ? safeText(period) : undefined, plan);
}

function productOwned(product: any): boolean {
  // farklı sürümlerde owned/isOwned gibi değişebiliyor
  return Boolean(product?.owned ?? product?.isOwned ?? product?.isPurchased ?? false);
}

export class IapService {
  private static _instance: IapService | null = null;
  static get instance() {
    if (!this._instance) this._instance = new IapService();
    return this._instance;
  }

  private _inited = false;
  private _initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this._inited) return;
    if (this._initPromise) return this._initPromise;

    this._initPromise = (async () => {
      const platform = getPlatform();
      if (platform === 'web') {
        this._inited = true;
        return;
      }

      const store = getStore();
      if (!store) {
        // Cordova plugin native ortamda biraz geç gelebiliyor
        await new Promise((r) => setTimeout(r, 300));
      }

      const s = getStore();
      if (!s) {
        throw new Error('IAP store not available. cordova-plugin-purchase yüklenmemiş olabilir.');
      }

      // log seviyesi (debug istersen aç)
      try {
        s.verbosity = s.DEBUG ?? 2;
      } catch {}

      // Register products
      // NOTE: plugin API'leri sürüme göre küçük farklar gösterebiliyor; toleranslı ilerliyoruz.
      const PRODUCT_TYPE = s.PAID_SUBSCRIPTION || 'paid subscription';

      if (platform === 'android') {
        s.register?.([
          {
            id: IAP_CONFIG.android.subscriptionId,
            type: PRODUCT_TYPE,
            platform: s.GOOGLE_PLAY || 'android-playstore',
          },
        ]);
      }

      if (platform === 'ios') {
        // iOS tarafında genelde iki ayrı product id olur
        s.register?.([
          {
            id: IAP_CONFIG.ios.monthlyProductId,
            type: PRODUCT_TYPE,
            platform: s.APPLE_APPSTORE || 'ios-appstore',
          },
          {
            id: IAP_CONFIG.ios.yearlyProductId,
            type: PRODUCT_TYPE,
            platform: s.APPLE_APPSTORE || 'ios-appstore',
          },
        ]);
      }

      // Events
      // On approved: finish (client-only MVP, server verification yok)
      s.when?.('product')?.updated?.(() => {
        // noop
      });

      s.when?.('receipt')?.updated?.(() => {
        // noop
      });

      s.when?.('transaction')?.approved?.((tx: any) => {
        // IMPORTANT: Client-only MVP -> direkt finish
        try {
          tx?.finish?.();
        } catch {}
      });

      // iOS restore için
      // store.ready callback
      await new Promise<void>((resolve) => {
        s.ready?.(() => resolve());
        // bazı sürümlerde ready yok, fallback:
        setTimeout(() => resolve(), 700);
      });

      // İlk refresh
      try {
        await s.refresh?.();
      } catch {}

      this._inited = true;
    })();

    return this._initPromise;
  }

  async getPlans(): Promise<IapPlanInfo[]> {
    await this.init();
    const platform = getPlatform();

    if (platform === 'web') {
      return [
        { id: 'monthly', title: 'Aylık', price: { price: '' } },
        { id: 'yearly', title: 'Yıllık', price: { price: '' } },
      ];
    }

    const store = getStore();
    if (!store) throw new Error('Store not available');

    if (platform === 'android') {
      const product = store.get?.(IAP_CONFIG.android.subscriptionId);
      const offers = product?.offers || product?.pricing?.offers || [];

      const monthlyOffer = offers.find((o: any) => offerLooksLikePlan(o, 'monthly'));
      const yearlyOffer = offers.find((o: any) => offerLooksLikePlan(o, 'yearly'));

      return [
        {
          id: 'monthly',
          title: product?.title || 'Aylık',
          offerId: monthlyOffer?.id || monthlyOffer?.offerId || IAP_CONFIG.android.basePlanIds.monthly,
          price: pickBestPrice(monthlyOffer || product),
        },
        {
          id: 'yearly',
          title: product?.title || 'Yıllık',
          offerId: yearlyOffer?.id || yearlyOffer?.offerId || IAP_CONFIG.android.basePlanIds.yearly,
          price: pickBestPrice(yearlyOffer || product),
        },
      ];
    }

    // iOS
    const monthly = store.get?.(IAP_CONFIG.ios.monthlyProductId);
    const yearly = store.get?.(IAP_CONFIG.ios.yearlyProductId);

    return [
      {
        id: 'monthly',
        title: monthly?.title || 'Aylık',
        productId: IAP_CONFIG.ios.monthlyProductId,
        price: pickBestPrice(monthly),
      },
      {
        id: 'yearly',
        title: yearly?.title || 'Yıllık',
        productId: IAP_CONFIG.ios.yearlyProductId,
        price: pickBestPrice(yearly),
      },
    ];
  }

  async purchase(plan: PlanId): Promise<IapEntitlement> {
    await this.init();
    const platform = getPlatform();
    if (platform === 'web') throw new Error('Satın alma sadece mobilde çalışır.');

    const store = getStore();
    if (!store) throw new Error('Store not available');

    if (platform === 'android') {
      const product = store.get?.(IAP_CONFIG.android.subscriptionId);
      if (!product) throw new Error('Android subscription product not loaded. (refresh?)');

      const offers = product?.offers || product?.pricing?.offers || [];
      const targetOffer = offers.find((o: any) => offerLooksLikePlan(o, plan));

      // Fallback: id match
      const fallbackOffer =
        targetOffer ||
        offers.find((o: any) => safeText(o?.id, '').toLowerCase().includes(plan));

      const offerToOrder = fallbackOffer;

      if (offerToOrder) {
        await store.order?.(offerToOrder);
      } else {
        // Son fallback: product direkt
        await store.order?.(product);
      }

      // Refresh + entitlement check
      try {
        await store.refresh?.();
      } catch {}

      const ent = this.getEntitlementSync();
      if (!ent.isPremium) {
        throw new Error('Satın alma tamamlanamadı / premium doğrulanamadı (client-only).');
      }
      // planı mümkün olduğunca set etmeye çalış
      ent.activePlan = ent.activePlan || plan;
      ent.source = 'play';
      return ent;
    }

    // iOS
    const iosProductId =
      plan === 'monthly' ? IAP_CONFIG.ios.monthlyProductId : IAP_CONFIG.ios.yearlyProductId;

    const product = store.get?.(iosProductId);
    if (!product) throw new Error('iOS product not loaded. App Store Connect product id kontrol et.');

    await store.order?.(product);

    try {
      await store.refresh?.();
    } catch {}

    const ent = this.getEntitlementSync();
    if (!ent.isPremium) {
      throw new Error('Satın alma tamamlanamadı / premium doğrulanamadı (client-only).');
    }
    ent.activePlan = ent.activePlan || plan;
    ent.source = 'appstore';
    return ent;
  }

  async restore(): Promise<IapEntitlement> {
    await this.init();
    const platform = getPlatform();
    if (platform === 'web') throw new Error('Restore sadece mobilde çalışır.');

    const store = getStore();
    if (!store) throw new Error('Store not available');

    try {
      await store.restorePurchases?.();
    } catch {
      // bazı android sürümlerinde restorePurchases olmayabilir
    }

    try {
      await store.refresh?.();
    } catch {}

    return this.getEntitlementSync();
  }

  getEntitlementSync(): IapEntitlement {
    const platform = getPlatform();
    const store = getStore();

    const base: IapEntitlement = {
      isPremium: false,
      source: 'unknown',
      lastUpdatedAt: nowIso(),
    };

    if (platform === 'web' || !store) return base;

    if (platform === 'android') {
      const p = store.get?.(IAP_CONFIG.android.subscriptionId);
      const owned = productOwned(p);

      // Plan tespiti (heuristic): offers -> billingPeriod
      let activePlan: PlanId | undefined;
      const offers = p?.offers || p?.pricing?.offers || [];
      const ownedOffer = offers.find((o: any) => Boolean(o?.isOwned || o?.owned));
      if (ownedOffer) {
        const period =
          ownedOffer?.pricingPhases?.[0]?.billingPeriod ||
          ownedOffer?.pricingPhase?.billingPeriod ||
          ownedOffer?.billingPeriod;

        if (periodMatchesPlan(period ? safeText(period) : undefined, 'monthly')) activePlan = 'monthly';
        if (periodMatchesPlan(period ? safeText(period) : undefined, 'yearly')) activePlan = 'yearly';
      }

      return {
        isPremium: owned,
        activePlan,
        source: 'play',
        lastUpdatedAt: nowIso(),
      };
    }

    // iOS
    const monthly = store.get?.(IAP_CONFIG.ios.monthlyProductId);
    const yearly = store.get?.(IAP_CONFIG.ios.yearlyProductId);

    const monthlyOwned = productOwned(monthly);
    const yearlyOwned = productOwned(yearly);

    return {
      isPremium: monthlyOwned || yearlyOwned,
      activePlan: yearlyOwned ? 'yearly' : monthlyOwned ? 'monthly' : undefined,
      source: 'appstore',
      lastUpdatedAt: nowIso(),
    };
  }

  openManageSubscriptions() {
    const platform = getPlatform();
    if (platform === 'android') {
      const url = `https://play.google.com/store/account/subscriptions?package=${encodeURIComponent(
        IAP_CONFIG.manage.androidPackageName
      )}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (platform === 'ios') {
      window.open('https://apps.apple.com/account/subscriptions', '_blank', 'noopener,noreferrer');
      return;
    }
  }
}

export const iapService = IapService.instance;
