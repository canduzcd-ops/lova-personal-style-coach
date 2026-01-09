import { Tag, ShoppingBag } from 'lucide-react';
const gatewayUrl = import.meta.env.VITE_AI_GATEWAY_URL;
const gatewayKey = import.meta.env.VITE_AI_GATEWAY_KEY;
const normalizedBaseUrl = gatewayUrl ? gatewayUrl.replace(/\/$/, '') : null;
async function postToGateway(path, payload) {
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
        return (await res.json());
    }
    catch (error) {
        console.error('AI gateway request failed', error);
        return null;
    }
}
// Enhanced Image Analysis
export const analyzeImage = async (base64Image) => {
    try {
        const response = await postToGateway('/analyzeImage', { base64Image });
        return response?.result ?? null;
    }
    catch (error) {
        console.error("Gemini Analysis Error:", error);
        return null;
    }
};
// Rate Outfit Analysis
export const rateOutfit = async (base64Image) => {
    try {
        const response = await postToGateway('/rateOutfit', { base64Image });
        return response?.result ?? null;
    }
    catch (error) {
        console.error("Outfit Rating Error:", error);
        return null;
    }
};
// Makeup Analysis using Face Image
export const analyzeFaceForMakeup = async (base64Image) => {
    try {
        const response = await postToGateway('/analyzeFaceForMakeup', { base64Image });
        return response?.result ?? null;
    }
    catch (error) {
        console.error("Makeup Analysis Error:", error);
        return null;
    }
};
// Smart Outfit Generation using User's Actual Items
export const generateOutfitFromWardrobe = async (user, wardrobe) => {
    try {
        const response = await postToGateway('/generateOutfitFromWardrobe', { user, wardrobe });
        if (!response?.result)
            return null;
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
    }
    catch (error) {
        console.error("Outfit Generation Error:", error);
        return null;
    }
};
export const generatePersonalizedTips = async (user, wardrobe) => {
    try {
        const response = await postToGateway('/generatePersonalizedTips', { user, wardrobe });
        return response?.result ?? null;
    }
    catch (error) {
        console.error("Tips Error:", error);
        return null;
    }
};
// Video Generation for Splash Screen
export const generateFashionVideo = async (prompt) => {
    console.warn('generateFashionVideo is temporarily disabled in the client; gateway support pending.');
    return null;
};
