import { Tag, ShoppingBag } from 'lucide-react';
import { captureError, track } from './telemetry';
const gatewayUrl = import.meta.env.VITE_AI_GATEWAY_URL;
const gatewayKey = import.meta.env.VITE_AI_GATEWAY_KEY;
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const normalizedBaseUrl = gatewayUrl ? gatewayUrl.replace(/\/$/, '') : null;
// Use gateway if configured, otherwise fallback to direct Gemini API
const useDirectGemini = !normalizedBaseUrl || !gatewayKey;
const USER_FACING_GATEWAY_ERROR = "Asistan şu an yanıt veremedi, lütfen tekrar deneyin.";
// Gemini API endpoint
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
// Rate limiting - track last request time
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 4000; // 4 seconds between requests (15 RPM = 4s interval)
// Simple rate limiter
const waitForRateLimit = async () => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`[aiService] Rate limiting: waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();
};
const logGatewayError = (path, attempt, error) => {
    console.error('AI gateway request error', {
        path,
        attempt,
        error,
    });
};
async function postToGateway(path, payload) {
    if (!normalizedBaseUrl || !gatewayKey) {
        console.error("AI gateway is not configured (VITE_AI_GATEWAY_URL / VITE_AI_GATEWAY_KEY)");
        captureError(new Error('AI gateway misconfigured'), { path, reason: 'missing_config' });
        throw new Error(USER_FACING_GATEWAY_ERROR);
    }
    const attemptRequest = async (attempt) => {
        const res = await fetch(`${normalizedBaseUrl}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Gateway-Key': gatewayKey,
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const body = await res.text().catch(() => '<body read failed>');
            throw { status: res.status, body };
        }
        return (await res.json());
    };
    let lastError = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            return await attemptRequest(attempt);
        }
        catch (error) {
            lastError = error;
            logGatewayError(path, attempt, error);
            captureError(error, { path, attempt });
            if (attempt === 2) {
                throw new Error(USER_FACING_GATEWAY_ERROR);
            }
        }
    }
    // Fallback; should be unreachable
    throw lastError instanceof Error ? lastError : new Error(USER_FACING_GATEWAY_ERROR);
}
// Enhanced Image Analysis
export const analyzeImage = async (base64Image) => {
    track('ai_analyze_start', {});
    // Validate input
    if (!base64Image) {
        track('ai_analyze_failed', { error: 'empty_image' });
        throw new Error('Fotoğraf verisi boş. Lütfen tekrar deneyin.');
    }
    // Check if it's a valid base64 image
    if (!base64Image.startsWith('data:image/')) {
        track('ai_analyze_failed', { error: 'invalid_format' });
        throw new Error('Geçersiz fotoğraf formatı. Lütfen farklı bir fotoğraf seçin.');
    }
    try {
        // Use direct Gemini API if gateway is not configured
        if (useDirectGemini) {
            if (!geminiApiKey) {
                throw new Error('AI servisi yapılandırılmamış. VITE_GEMINI_API_KEY kontrol edin.');
            }
            const result = await analyzeImageDirectly(base64Image);
            if (!result) {
                track('ai_analyze_failed', { error: 'null_result_direct' });
                throw new Error('Analiz sonucu alınamadı. Fotoğrafın net ve iyi aydınlatılmış olduğundan emin olun.');
            }
            track('ai_analyze_success', { method: 'direct' });
            return result;
        }
        // Use gateway
        const response = await postToGateway('/analyzeImage', { base64Image });
        if (!response?.result) {
            track('ai_analyze_failed', { error: 'null_result' });
            throw new Error('Analiz sonucu alınamadı. Fotoğrafın net ve iyi aydınlatılmış olduğundan emin olun.');
        }
        track('ai_analyze_success', { method: 'gateway' });
        return response.result;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
        track('ai_analyze_failed', { error: message });
        // Re-throw with user-friendly message
        if (message.includes('gateway') || message.includes('yanıt veremedi')) {
            throw new Error('Stil asistanı şu an meşgul. Lütfen birkaç saniye sonra tekrar deneyin.');
        }
        throw error;
    }
};
// Direct Gemini API call for image analysis using fetch
async function analyzeImageDirectly(base64Image, retryCount = 0) {
    if (!geminiApiKey) {
        console.error('[aiService] Gemini API key not configured');
        throw new Error('AI servisi yapılandırılmamış. VITE_GEMINI_API_KEY kontrol edin.');
    }
    console.log('[aiService] analyzeImageDirectly called, retry:', retryCount);
    // Apply rate limiting
    await waitForRateLimit();
    const prompt = `
Act as a professional fashion stylist. Analyze the clothing item in the image and extract structured data for a wardrobe app.

Output must be a valid JSON object. Do not include markdown formatting like \`\`\`json.

Fields required:
1. type: One of ['ust', 'alt', 'elbise', 'dis', 'ayakkabi', 'aksesuar'].
2. color: Dominant color name in Turkish (e.g., 'Lacivert', 'Krem', 'Antrasit', 'Bordo').
3. name: A concise, descriptive title in Turkish (e.g., 'Yüksek Bel Palazzo Pantolon').
4. aiTags: An object with the following properties:
   - season: Array of strings. Options: ['İlkbahar', 'Yaz', 'Sonbahar', 'Kış', 'Mevsimsiz']. Select all that apply.
   - occasion: Array of strings. Options: ['Günlük', 'Ofis', 'Davet', 'Spor', 'Tatil', 'Akşam Yemeği']. Select all that apply.
   - fit: String describing the cut (e.g., 'Slim Fit', 'Oversize', 'Regular', 'Skinny', 'Crop', 'Dökümlü', 'Asimetrik').
   - fabric: String guessing the material (e.g., 'İpek', 'Keten', 'Pamuk', 'Denim', 'Deri', 'Yün', 'Saten', 'Kadife', 'Dantel', 'Teknik Kumaş').
   - pattern: String (e.g., 'Düz', 'Çizgili', 'Çiçekli', 'Ekose', 'Logolu', 'Hayvan Desenli').
   - style: Array of strings (e.g., 'Minimal', 'Bohem', 'Klasik', 'Retro', 'Sokak Stili', 'Gothic', 'Avant-garde', 'Preppy').
   - aesthetic: Array of strings (e.g., 'Old Money', 'Clean Girl', 'Y2K', 'Office Siren', 'Dark Academia', 'Whimsigoth', 'Streetwear').

Ensure 'season' and 'occasion' have at least one valid value.
Only output the JSON object, nothing else.
  `.trim();
    try {
        // Extract base64 data and mime type
        const matches = base64Image.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
            console.error('[aiService] Invalid base64 format, no matches found');
            throw new Error('Geçersiz fotoğraf formatı');
        }
        const mimeType = matches[1];
        const base64Data = matches[2];
        console.log('[aiService] Calling Gemini API with mimeType:', mimeType, 'base64 length:', base64Data.length);
        // Build request body
        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType,
                                data: base64Data,
                            },
                        },
                    ],
                },
            ],
        };
        // Call Gemini API directly with fetch
        const apiUrl = `${GEMINI_API_URL}?key=${geminiApiKey}`;
        console.log('[aiService] Fetching:', apiUrl.replace(geminiApiKey, '***'));
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        console.log('[aiService] Response status:', response.status);
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('[aiService] API error response:', errorBody);
            if (response.status === 429) {
                throw { status: 429, message: 'Rate limit exceeded' };
            }
            if (response.status === 401 || response.status === 403) {
                throw { status: response.status, message: 'API key invalid or unauthorized' };
            }
            throw new Error(`API hatası: ${response.status} - ${errorBody.substring(0, 200)}`);
        }
        const data = await response.json();
        console.log('[aiService] Gemini response received');
        // Extract text from response
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('[aiService] Extracted text:', text.substring(0, 200));
        if (!text) {
            console.error('[aiService] No text in response:', JSON.stringify(data).substring(0, 500));
            throw new Error('API yanıt vermedi');
        }
        // Clean up response - remove markdown code blocks if present
        let cleanedText = text.trim();
        if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.slice(7);
        }
        else if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.slice(3);
        }
        if (cleanedText.endsWith('```')) {
            cleanedText = cleanedText.slice(0, -3);
        }
        cleanedText = cleanedText.trim();
        console.log('[aiService] Cleaned text for parsing:', cleanedText.substring(0, 300));
        const parsed = JSON.parse(cleanedText);
        console.log('[aiService] Parsed result:', JSON.stringify(parsed));
        return parsed;
    }
    catch (error) {
        console.error('[aiService] ========== GEMINI API ERROR ==========');
        console.error('[aiService] Error:', error);
        console.error('[aiService] Error message:', error?.message);
        console.error('[aiService] Error status:', error?.status);
        console.error('[aiService] =======================================');
        const errorStatus = error?.status;
        // Check for rate limit (429)
        if (errorStatus === 429) {
            if (retryCount < 3) {
                const backoffTime = Math.pow(2, retryCount + 1) * 5000; // 10s, 20s, 40s
                console.log(`[aiService] Rate limited, retrying in ${backoffTime}ms (attempt ${retryCount + 1}/3)`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
                return analyzeImageDirectly(base64Image, retryCount + 1);
            }
            throw new Error('API limiti aşıldı. Lütfen 1 dakika sonra tekrar deneyin.');
        }
        // Check for API key errors (401, 403)
        if (errorStatus === 401 || errorStatus === 403) {
            throw new Error('API anahtarı geçersiz veya yetkisiz.');
        }
        // For any other error, show the actual message
        const userMessage = error?.message || 'Bilinmeyen hata';
        throw new Error(`Analiz hatası: ${userMessage.substring(0, 100)}`);
    }
}
// Rate Outfit Analysis
export const rateOutfit = async (base64Image) => {
    const response = await postToGateway('/rateOutfit', { base64Image });
    return response?.result ?? null;
};
// Makeup Analysis using Face Image
export const analyzeFaceForMakeup = async (base64Image) => {
    const response = await postToGateway('/analyzeFaceForMakeup', { base64Image });
    return response?.result ?? null;
};
// Direct Gemini API call for outfit generation
async function generateOutfitDirectly(user, wardrobe) {
    if (!geminiApiKey) {
        console.error('[aiService] Gemini API key not configured');
        return null;
    }
    console.log('[aiService] generateOutfitDirectly called, wardrobe items:', wardrobe.length);
    // Apply rate limiting
    await waitForRateLimit();
    const wardrobeSummary = wardrobe.map(item => ({
        type: item.type,
        name: item.name,
        color: item.color,
        style: item.aiTags?.style || [],
        occasion: item.aiTags?.occasion || [],
        season: item.aiTags?.season || [],
    }));
    const prompt = `
Sen profesyonel bir stil danışmanısın. Kullanıcının gardırobundan uyumlu bir kombin öner.

Kullanıcı bilgileri:
- Stil tercihleri: ${user.styles?.join(', ') || 'Belirtilmemiş'}

Gardıroptaki parçalar:
${JSON.stringify(wardrobeSummary, null, 2)}

Lütfen şu JSON formatında yanıt ver (markdown kullanma, sadece JSON):
{
  "outfit": {
    "title": "Kombinin yaratıcı başlığı (örn: 'Şehirli Şıklık')",
    "desc": "Kombinin kısa açıklaması (1-2 cümle)",
    "items": [
      { "name": "Parça adı", "type": "ust/alt/elbise/dis/ayakkabi/aksesuar" }
    ]
  },
  "beauty": {
    "hair": { "title": "Saç Önerisi", "desc": "Bu kombine uygun saç stili önerisi" },
    "makeup": { "title": "Makyaj Önerisi", "desc": "Bu kombine uygun makyaj önerisi" },
    "perfume": { "title": "Parfüm Önerisi", "desc": "Bu kombine uygun koku önerisi" }
  },
  "additionalTips": [
    { "title": "İpucu başlığı", "desc": "Detaylı stil ipucu" }
  ]
}

Önemli:
- Sadece gardıropta olan parçalardan kombin oluştur
- Güzellik önerilerini Türkçe yaz
- Her zaman en az 2 ek ipucu ver
`.trim();
    try {
        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
        };
        const apiUrl = `${GEMINI_API_URL}?key=${geminiApiKey}`;
        console.log('[aiService] Calling Gemini for outfit generation');
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });
        console.log('[aiService] Outfit generation response status:', response.status);
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('[aiService] Outfit generation API error:', errorBody);
            throw new Error(`API hatası: ${response.status}`);
        }
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('[aiService] Outfit generation raw text:', text.substring(0, 300));
        // Clean up response
        let cleanedText = text.trim();
        if (cleanedText.startsWith('```json'))
            cleanedText = cleanedText.slice(7);
        else if (cleanedText.startsWith('```'))
            cleanedText = cleanedText.slice(3);
        if (cleanedText.endsWith('```'))
            cleanedText = cleanedText.slice(0, -3);
        cleanedText = cleanedText.trim();
        const parsed = JSON.parse(cleanedText);
        // Match items with wardrobe images
        const outfitWithImages = {
            ...parsed.outfit,
            items: parsed.outfit.items.map((item) => {
                const matchedItem = wardrobe.find(w => w.name.toLowerCase().includes(item.name.toLowerCase()) ||
                    item.name.toLowerCase().includes(w.name.toLowerCase()) ||
                    (w.type === item.type && w.color === item.color));
                return {
                    ...item,
                    image: matchedItem?.image || null,
                    styles: matchedItem?.aiTags?.style || [],
                };
            }),
        };
        console.log('[aiService] Outfit generation successful');
        return {
            outfit: outfitWithImages,
            beauty: parsed.beauty || {
                hair: { title: 'Saç', desc: 'Doğal ve rahat bir stil' },
                makeup: { title: 'Makyaj', desc: 'Minimal ve şık' },
                perfume: { title: 'Parfüm', desc: 'Hafif çiçeksi notalar' },
            },
            additionalTips: (parsed.additionalTips || []).map((tip, idx) => ({
                ...tip,
                icon: idx === 0 ? ShoppingBag : Tag,
            })),
        };
    }
    catch (error) {
        console.error('[aiService] Outfit generation error:', error);
        throw new Error('Kombin oluşturulamadı. Lütfen tekrar deneyin.');
    }
}
// Smart Outfit Generation using User's Actual Items
export const generateOutfitFromWardrobe = async (user, wardrobe) => {
    track('ai_generate_start', {});
    try {
        // Use direct Gemini API if gateway is not configured
        if (useDirectGemini) {
            console.log('[aiService] Using direct Gemini API for outfit generation');
            const result = await generateOutfitDirectly(user, wardrobe);
            if (result) {
                track('ai_generate_success', { method: 'direct' });
                return result;
            }
            track('ai_generate_failed', { error: 'null_result_direct' });
            return null;
        }
        // Use gateway
        const response = await postToGateway('/generateOutfitFromWardrobe', { user, wardrobe });
        if (!response?.result) {
            track('ai_generate_failed', { error: 'null_response' });
            return null;
        }
        const additionalTips = (response.result.additionalTips?.length
            ? response.result.additionalTips
            : [
                { title: 'Eksik Parça', desc: response.result.outfit?.title || '', icon: null },
                { title: 'Doku Notu', desc: 'Zıt kumaşları eşleştirmek kombine derinlik katar.', icon: null },
            ])
            .map((tip, idx) => ({ ...tip, icon: idx === 0 ? ShoppingBag : Tag }));
        track('ai_generate_success', { method: 'gateway' });
        return {
            ...response.result,
            additionalTips,
        };
    }
    catch (error) {
        track('ai_generate_failed', { error: String(error) });
        throw error;
    }
};
export const generatePersonalizedTips = async (user, wardrobe) => {
    const response = await postToGateway('/generatePersonalizedTips', { user, wardrobe });
    return response?.result ?? null;
};
// Video Generation for Splash Screen
export const generateFashionVideo = async (prompt) => {
    console.warn('generateFashionVideo is temporarily disabled in the client; gateway support pending.');
    return null;
};
