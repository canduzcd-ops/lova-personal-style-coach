import { UserProfile, WardrobeItem, StyleTipResult, SuggestionResult, MakeupAnalysis, StyleRating } from '../types';
import { Tag, ShoppingBag } from 'lucide-react';

const gatewayUrl = import.meta.env.VITE_AI_GATEWAY_URL as string | undefined;
const gatewayKey = import.meta.env.VITE_AI_GATEWAY_KEY as string | undefined;

const normalizedBaseUrl = gatewayUrl ? gatewayUrl.replace(/\/$/, '') : null;

async function postToGateway<T>(path: string, payload: unknown): Promise<T | null> {
  if (!normalizedBaseUrl || !gatewayKey) {
    console.error("AI gateway is not configured (VITE_AI_GATEWAY_URL / VITE_AI_GATEWAY_KEY)");
    return null;
  }

  try {
    const res = await fetch(`${normalizedBaseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Key': gatewayKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('AI gateway error', res.status, body);
      return null;
    }

    return (await res.json()) as T;
  } catch (error) {
    console.error('AI gateway request failed', error);
    return null;
  }
}

export interface AnalyzedItem {
  type: string;
  color: string;
  name: string;
  aiTags: {
    season: string[];
    occasion: string[];
    style: string[];
    fabric: string;
    fit: string;
    pattern: string;
    aesthetic: string[];
  };
}


// Enhanced Image Analysis
export const analyzeImage = async (base64Image: string): Promise<AnalyzedItem | null> => {
  try {
    const response = await postToGateway<{ result: AnalyzedItem | null }>(
      '/analyzeImage',
      { base64Image }
    );

    return response?.result ?? null;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};

// Rate Outfit Analysis
export const rateOutfit = async (base64Image: string): Promise<Omit<StyleRating, 'image' | 'date'> | null> => {
  try {
    const response = await postToGateway<{ result: Omit<StyleRating, 'image' | 'date'> | null }>(
      '/rateOutfit',
      { base64Image }
    );

    return response?.result ?? null;

  } catch (error) {
    console.error("Outfit Rating Error:", error);
    return null;
  }
};

// Makeup Analysis using Face Image
export const analyzeFaceForMakeup = async (base64Image: string): Promise<MakeupAnalysis | null> => {
  try {
    const response = await postToGateway<{ result: MakeupAnalysis | null }>(
      '/analyzeFaceForMakeup',
      { base64Image }
    );

    return response?.result ?? null;

  } catch (error) {
    console.error("Makeup Analysis Error:", error);
    return null;
  }
};

// Smart Outfit Generation using User's Actual Items
export const generateOutfitFromWardrobe = async (user: UserProfile, wardrobe: WardrobeItem[]): Promise<SuggestionResult | null> => {
  try {
    const response = await postToGateway<{ result: SuggestionResult | null }>(
      '/generateOutfitFromWardrobe',
      { user, wardrobe }
    );

    if (!response?.result) return null;

    const additionalTips = (response.result.additionalTips?.length
      ? response.result.additionalTips
      : [
          { title: 'Eksik Parça', desc: response.result.outfit?.title || '', icon: null },
          { title: 'Doku Notu', desc: 'Zıt kumaşları eşleştirmek kombine derinlik katar.', icon: null },
        ])
      .map((tip, idx) => ({ ...tip, icon: idx === 0 ? ShoppingBag : Tag }));

    return {
      ...response.result,
      additionalTips,
    };

  } catch (error) {
    console.error("Outfit Generation Error:", error);
    return null;
  }
};

export const generatePersonalizedTips = async (user: UserProfile, wardrobe: WardrobeItem[]): Promise<StyleTipResult | null> => {
  try {
    const response = await postToGateway<{ result: StyleTipResult | null }>(
      '/generatePersonalizedTips',
      { user, wardrobe }
    );

    return response?.result ?? null;

  } catch (error) {
    console.error("Tips Error:", error);
    return null;
  }
};

// Video Generation for Splash Screen
export const generateFashionVideo = async (prompt: string): Promise<string | null> => {
  console.warn('generateFashionVideo is temporarily disabled in the client; gateway support pending.');
  return null;
};