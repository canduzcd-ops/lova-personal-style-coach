

export interface UserProfile {
  id: string; // unique id
  email: string; // auth
  name: string;
  styles: string[];
  joinedAt: string;
  isPremium: boolean;
  isGuest?: boolean; // New flag for guest users
  avatar_url?: string; // Profile picture (Base64 or URL)
  subscriptionEndDate?: string;
  premiumType?: 'monthly' | 'yearly' | 'trial' | 'lifetime';
  theme: 'light' | 'dark' | 'romantic' | 'nardo' | 'ocean' | string;
  
  // Usage tracking for free tier
  usage: {
    wardrobeCount: number;
    dailyScanCount: number;
    lastScanDate: string; // YYYY-MM-DD
  };

  // NEW: Strict Trial Logic
  trialUsage: {
    wardrobeAccessUsed: boolean; // True if they finished their one-time adding session
    combinationsCount: number;   // Max 2 for free users
  };

  // Premium Feature: Body Measurements
  bodyMeasurements?: BodyMeasurements;
  bodyType?: 'elma' | 'armut' | 'kum_saati' | 'dikdortgen' | 'ters_ucgen' | string;

  // Premium Feature: Makeup Analysis
  makeupAnalysis?: MakeupAnalysis;

  // Feature: Style Rating
  styleRating?: StyleRating;
}

export interface BodyMeasurements {
  height: number;
  weight: number;
  bust: number; // Göğüs
  waist: number; // Bel
  hips: number; // Basen
}

export interface MakeupAnalysis {
  skinTone: string;
  eyeShape: string;
  eyeColor: string;
  eyeliner: string;
  eyeshadow: string;
  blush: string;
  lipstick: string;
  lastAnalyzed?: string;
  userImage?: string; // Base64 of the analyzed face
}

export interface StyleRating {
  score: number;
  comment: string;
  image: string; // Base64 of the outfit
  date: string;
}

export interface WardrobeItem {
  id: string; // Changed to string for Firestore ID
  type: string; // 'ust', 'alt', 'elbise', 'dis', 'ayakkabi', 'aksesuar'
  name: string;
  color: string;
  note?: string;
  image?: string; // dataURL
  userId?: string; // Standardized to camelCase
  createdAt?: any;
  // Enhanced AI Data
  aiTags?: {
    season?: string[];
    occasion?: string[];
    style?: string[];
    fabric?: string;
    fit?: string;
    pattern?: string;
    aesthetic?: string[];
  };
  tagsNormalized?: {
    styles: string[];
    colors: string[];
  };
}

export interface StyleOption {
  id: string;
  label: string;
  desc: string;
}

export interface UserPrefs {
  notifications: boolean;
}

// AI/Logic Types
export interface StyleTipResult {
  title: string;
  tips: string[];
  styleIcon: string;
  dailyMantra?: string;
  colorPalette?: string[];
}

export interface SuggestionResult {
  outfit: {
    title: string;
    desc: string;
    items: { name: string; type: string; styles: string[]; image?: string }[];
  };
  beauty: {
    hair: { title: string; desc: string };
    makeup: { title: string; desc: string };
    perfume: { title: string; desc: string };
  };
  additionalTips: { title: string; desc: string; icon: any }[];
}

export interface OutfitHistoryEntry {
  id: string;
  userId: string;
  outfit: any;
  weather?: any;
  source?: string;
  liked?: boolean | null;
  createdAt?: string;
  feedbackAt?: string;
  isFavorite?: boolean;
  collectionTag?: 'work' | 'weekend' | 'date' | null;
}

export interface SavedOutfit {
  id: number;
  date: string;
  data: SuggestionResult;
}

export const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    price: 59.99,
    period: 'Aylık',
    label: 'Esnek Plan'
  },
  yearly: {
    id: 'yearly',
    price: 499.99,
    period: 'Yıllık',
    label: 'En Popüler',
    discount: '%30 İndirim'
  }
};

export const FREE_LIMITS = {
  MAX_WARDROBE_ITEMS: 20, // Deprecated in favor of trialUsage logic, but kept for type safety
  DAILY_AI_SCANS: 3
};