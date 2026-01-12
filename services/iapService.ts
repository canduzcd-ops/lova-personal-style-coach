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
      console.log('[IAP] init başladı. Platform:', platform);
      
      if (platform === 'web') {
        console.log('[IAP] Web platform. init skip.');
        this._inited = true;
        return;
      }

      const store = getStore();
      if (!store) {
        // Cordova plugin native ortamda biraz geç gelebiliyor
        console.log('[IAP] Store henüz yüklenmedi. 300ms bekleniyor...');
        await new Promise((r) => setTimeout(r, 300));
      }

      const s = getStore();
      if (!s) {
        console.error('[IAP] Store bulunamadı. cordova-plugin-purchase yüklenmemiş olabilir.');
        throw new Error('IAP store not available. cordova-plugin-purchase yüklenmemiş olabilir.');
      }

      console.log('[IAP] Store mevcut. Store API:', Object.keys(s).slice(0, 10).join(', ') + '...');

      // log seviyesi (debug istersen aç)
      try {
        s.verbosity = s.DEBUG ?? 2;
        console.log('[IAP] Store verbosity set:', s.verbosity);
      } catch {}

      // Register products
      // NOTE: plugin API'leri sürüme göre küçük farklar gösterebiliyor; toleranslı ilerliyoruz.
      const PRODUCT_TYPE = s.PAID_SUBSCRIPTION || 'paid subscription';

      if (platform === 'android') {
        console.log('[IAP] Android: Registering subscription', IAP_CONFIG.android.subscriptionId);
        s.register?.([
          {
            id: IAP_CONFIG.android.subscriptionId,
            type: PRODUCT_TYPE,
            platform: s.GOOGLE_PLAY || 'android-playstore',
          },
        ]);
        console.log('[IAP] Android: register() çağrıldı.');
      }

      if (platform === 'ios') {
        // iOS tarafında genelde iki ayrı product id olur
        console.log('[IAP] iOS: Registering products', IAP_CONFIG.ios.monthlyProductId, IAP_CONFIG.ios.yearlyProductId);
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
        console.log('[IAP] iOS: register() çağrıldı.');
      }

      // Events
      // On approved: finish (client-only MVP, server verification yok)
      s.when?.('product')?.updated?.(() => {
        console.log('[IAP] product updated event');
      });

      s.when?.('receipt')?.updated?.(() => {
        console.log('[IAP] receipt updated event');
      });

      s.when?.('transaction')?.approved?.((tx: any) => {
        // IMPORTANT: Client-only MVP -> direkt finish
        console.log('[IAP] transaction approved, finishing...');
        try {
          tx?.finish?.();
        } catch {}
      });

      // iOS restore için
      // store.initialize() - YENİ API (cordova-plugin-purchase v13+)
      console.log('[IAP] store.initialize() çağrılıyor...');
      try {
        if (typeof s.initialize === 'function') {
          await s.initialize();
          console.log('[IAP] store.initialize() başarılı.');
        } else if (typeof s.update === 'function') {
          // Fallback: bazı sürümlerde update() kullanılıyor
          await s.update();
          console.log('[IAP] store.update() başarılı (fallback).');
        } else {
          // Eski API: ready callback
          console.log('[IAP] store.ready() çağrılıyor (eski API). 700ms timeout var...');
          await new Promise<void>((resolve) => {
            s.ready?.(() => {
              console.log('[IAP] store.ready() callback tetiklendi.');
              resolve();
            });
            // bazı sürümlerde ready yok, fallback:
            setTimeout(() => {
              console.log('[IAP] store.ready() timeout 700ms. Devam ediliyor.');
              resolve();
            }, 700);
          });
        }
      } catch (initErr) {
        console.warn('[IAP] store.initialize() hatası:', initErr);
        // Devam et, uygulama açılabilsin
      }

      // İlk refresh/update
      console.log('[IAP] Başlangıç refresh/update başlıyor...');
      try {
        if (typeof s.update === 'function') {
          await s.update();
          console.log('[IAP] store.update() başarılı.');
        } else if (typeof s.refresh === 'function') {
          await s.refresh();
          console.log('[IAP] store.refresh() başarılı.');
        }
      } catch (err) {
        console.warn('[IAP] Başlangıç refresh/update hatası:', err);
        // Hata olsa bile devam et
      }

      this._inited = true;
      console.log('[IAP] init tamamlandı. _inited = true');
    })();

    return this._initPromise;
  }

  async getPlans(): Promise<IapPlanInfo[]> {
    await this.init();
    const platform = getPlatform();
    console.log('[IAP] getPlans başladı. Platform:', platform);

    if (platform === 'web') {
      console.log('[IAP] getPlans: Web platform. Dummy plans dönülüyor.');
      return [
        { id: 'monthly', title: 'Aylık', price: { price: '' } },
        { id: 'yearly', title: 'Yıllık', price: { price: '' } },
      ];
    }

    const store = getStore();
    if (!store) {
      console.error('[IAP] getPlans: Store not available');
      throw new Error('Store not available');
    }

    if (platform === 'android') {
      console.log('[IAP] getPlans: Android. subscriptionId =', IAP_CONFIG.android.subscriptionId);
      const product = store.get?.(IAP_CONFIG.android.subscriptionId);
      console.log('[IAP] getPlans: Android product:', {
        id: product?.id,
        title: product?.title,
        state: product?.state,
        offersCount: (product?.offers || []).length,
        productKeys: product ? Object.keys(product).slice(0, 15) : 'null',
      });
      
      const offers = product?.offers || product?.pricing?.offers || [];
      console.log('[IAP] getPlans: Android offers:', offers.length, 'items');
      offers.forEach((o: any, idx: number) => {
        console.log(`  [Offer ${idx}]:`, { id: o?.id, offerId: o?.offerId, basePlanId: o?.basePlanId });
      });

      const monthlyOffer = offers.find((o: any) => offerLooksLikePlan(o, 'monthly'));
      const yearlyOffer = offers.find((o: any) => offerLooksLikePlan(o, 'yearly'));
      
      console.log('[IAP] getPlans: Android monthlyOffer found:', !!monthlyOffer, yearlyOffer, !!yearlyOffer);

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
    console.log('[IAP] getPlans: iOS. productIds =', IAP_CONFIG.ios.monthlyProductId, IAP_CONFIG.ios.yearlyProductId);
    const monthly = store.get?.(IAP_CONFIG.ios.monthlyProductId);
    const yearly = store.get?.(IAP_CONFIG.ios.yearlyProductId);
    console.log('[IAP] getPlans: iOS monthly:', !!monthly, 'yearly:', !!yearly);

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
    console.log('[IAP] purchase başladı. Platform:', platform, 'Plan:', plan);
    
    if (platform === 'web') {
      console.error('[IAP] purchase: Web platform, error throw.');
      throw new Error('Satın alma sadece mobilde çalışır.');
    }

    const store = getStore();
    if (!store) {
      console.error('[IAP] purchase: Store not available');
      throw new Error('Store not available');
    }

    if (platform === 'android') {
      console.log('[IAP] purchase: Android branch. subscriptionId =', IAP_CONFIG.android.subscriptionId);
      const product = store.get?.(IAP_CONFIG.android.subscriptionId);
      console.log('[IAP] purchase: Android product check:', {
        found: !!product,
        id: product?.id,
        state: product?.state,
        canPurchase: product?.canPurchase,
        offersCount: (product?.offers || []).length,
      });
      
      if (!product) {
        console.error('[IAP] purchase: Android product is null. store.get() failed. Throwing error.');
        throw new Error('Ürün bilgisi yüklenemedi. Lütfen uygulamayı yeniden başlatın ve tekrar deneyin.');
      }

      // Check if product can be purchased
      if (product.state === 'invalid' || product.valid === false) {
        console.error('[IAP] purchase: Product is invalid. Check Play Console product configuration.');
        throw new Error('Bu ürün şu anda satın alınamıyor. Play Console yapılandırmasını kontrol edin.');
      }

      const offers = product?.offers || product?.pricing?.offers || [];
      console.log('[IAP] purchase: Looking for plan:', plan, 'in', offers.length, 'offers');
      
      const targetOffer = offers.find((o: any) => offerLooksLikePlan(o, plan));
      console.log('[IAP] purchase: targetOffer (offerLooksLikePlan):', !!targetOffer, targetOffer?.id);

      // Fallback: id match
      const fallbackOffer =
        targetOffer ||
        offers.find((o: any) => safeText(o?.id, '').toLowerCase().includes(plan));
      console.log('[IAP] purchase: fallbackOffer:', !!fallbackOffer, fallbackOffer?.id);

      const offerToOrder = fallbackOffer;
      console.log('[IAP] purchase: Calling store.order() with offer:', !!offerToOrder, offerToOrder?.id);

      try {
        if (offerToOrder) {
          await store.order?.(offerToOrder);
        } else {
          // Son fallback: product direkt
          console.log('[IAP] purchase: No offer found, ordering product directly');
          await store.order?.(product);
        }
      } catch (orderError: any) {
        console.error('[IAP] purchase: order() error:', orderError);
        
        // Parse specific billing errors
        const errorMessage = orderError?.message || String(orderError);
        
        if (errorMessage.includes('BillingUnavailable') || 
            errorMessage.includes('not configured for billing') ||
            errorMessage.includes('faturalandırılmak üzere yapılandırılmadı')) {
          throw new Error(
            'Bu uygulama henüz Google Play faturalandırması için yapılandırılmamış.\n\n' +
            '• Uygulamanın Play Store\'da "Açık Test" veya "Üretim" aşamasında olduğundan emin olun.\n' +
            '• Play Console\'da abonelik ürünlerinin "Aktif" durumda olduğunu kontrol edin.\n' +
            '• Test kullanıcı e-postanızın lisans test kullanıcılarına eklendiğinden emin olun.'
          );
        }
        
        if (errorMessage.includes('ItemAlreadyOwned')) {
          throw new Error('Bu abonelik zaten satın alınmış. "Satın Alımları Geri Yükle" seçeneğini deneyin.');
        }
        
        if (errorMessage.includes('UserCancelled') || errorMessage.includes('cancelled')) {
          throw new Error('Satın alma işlemi iptal edildi.');
        }
        
        if (errorMessage.includes('DeveloperError')) {
          throw new Error(
            'Geliştirici yapılandırma hatası. Play Console\'daki ürün ID\'lerini kontrol edin.'
          );
        }
        
        throw new Error(errorMessage || 'Satın alma işlemi başarısız oldu.');
      }

      // Refresh + entitlement check
      console.log('[IAP] purchase: Calling store.refresh()...');
      try {
        await store.refresh?.();
        console.log('[IAP] purchase: store.refresh() completed');
      } catch (e) {
        console.error('[IAP] purchase: store.refresh() error:', e);
      }

      const ent = this.getEntitlementSync();
      console.log('[IAP] purchase: After refresh, entitlement:', { isPremium: ent.isPremium, activePlan: ent.activePlan });
      
      if (!ent.isPremium) {
        console.error('[IAP] purchase: Premium not verified after purchase attempt');
        throw new Error('Satın alma tamamlanamadı / premium doğrulanamadı (client-only).');
      }
      // planı mümkün olduğunca set etmeye çalış
      ent.activePlan = ent.activePlan || plan;
      ent.source = 'play';
      console.log('[IAP] purchase: Success. Returning entitlement:', ent);
      return ent;
    }

    // iOS
    const iosProductId =
      plan === 'monthly' ? IAP_CONFIG.ios.monthlyProductId : IAP_CONFIG.ios.yearlyProductId;
    console.log('[IAP] purchase: iOS branch. productId:', iosProductId);

    const product = store.get?.(iosProductId);
    console.log('[IAP] purchase: iOS product:', !!product, product?.id);
    
    if (!product) {
      console.error('[IAP] purchase: iOS product not found');
      throw new Error('iOS product not loaded. App Store Connect product id kontrol et.');
    }

    console.log('[IAP] purchase: Calling store.order() for iOS');
    await store.order?.(product);

    console.log('[IAP] purchase: Calling store.refresh() for iOS');
    try {
      await store.refresh?.();
      console.log('[IAP] purchase: iOS store.refresh() completed');
    } catch (e) {
      console.error('[IAP] purchase: iOS store.refresh() error:', e);
    }

    const ent = this.getEntitlementSync();
    console.log('[IAP] purchase: iOS after refresh, entitlement:', { isPremium: ent.isPremium });
    
    if (!ent.isPremium) {
      console.error('[IAP] purchase: iOS premium not verified');
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

    // cordova-plugin-purchase v13+: update() kullan, yoksa refresh()
    try {
      if (typeof store.update === 'function') {
        await store.update();
      } else if (typeof store.refresh === 'function') {
        await store.refresh();
      }
    } catch (err) {
      console.warn('[IAP] restore refresh/update hatası:', err);
    }

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
