import { GoogleGenAI } from "@google/genai";

interface WardrobeItem {
  id: string;
  type: string;
  name: string;
  color: string;
  note?: string;
  image?: string;
  aiTags?: {
    season?: string[];
    occasion?: string[];
    style?: string[];
    fabric?: string;
    fit?: string;
    pattern?: string;
    aesthetic?: string[];
  };
}

interface UserProfile {
  styles: string[];
}

interface SuggestionResult {
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

interface Env {
  GEMINI_API_KEY: string;
  GATEWAY_KEY: string;
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, x-gateway-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function withCors(headers: HeadersInit = {}, status = 200, body?: BodyInit | null) {
  return new Response(body, { status, headers: { "content-type": "application/json", ...corsHeaders, ...headers } });
}

function jsonResponse(data: unknown, status = 200) {
  return withCors({}, status, JSON.stringify(data));
}

function unauthorized() {
  return jsonResponse({ error: "Unauthorized" }, 401);
}

async function extractText(response: any): Promise<string | null> {
  if (!response) return null;
  const candidate = response.text;
  if (typeof candidate === "function") {
    try {
      return await candidate.call(response);
    } catch {
      return null;
    }
  }
  if (typeof candidate === "string") return candidate;
  return null;
}

function sanitizeBase64(raw: string | undefined) {
  if (!raw) return "";
  return raw.includes("base64,") ? raw.split("base64,")[1] : raw;
}

async function handleAnalyzeImage(ai: GoogleGenAI, base64Image: string) {
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
    `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: sanitizeBase64(base64Image) } },
        { text: prompt },
      ],
    },
    config: { responseMimeType: "application/json" },
  });

  const text = await extractText(response);
  return text ? JSON.parse(text) : null;
}

async function handleRateOutfit(ai: GoogleGenAI, base64Image: string) {
  const prompt = `
      Act as a high-end fashion critic. Analyze the outfit in the image.
      
      Output MUST be a valid JSON object. No markdown.
      Language: Turkish.

      Fields required:
      1. score: A number between 1.0 and 10.0 (e.g., 8.7). Be fair but critical based on color harmony, fit, and styling.
      2. comment: A constructive, short, 1-sentence comment about the outfit. Mention what works well or what could be improved (e.g., "Renk uyumu harika, ancak ayakkabı seçimi daha minimal olabilir.").

      Example:
      {
        "score": 8.5,
        "comment": "Toprak tonları ten renginle harika bir uyum yakalamış, kemer detayı silüeti güçlendiriyor."
      }
    `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: sanitizeBase64(base64Image) } },
        { text: prompt },
      ],
    },
    config: { responseMimeType: "application/json" },
  });

  const text = await extractText(response);
  return text ? JSON.parse(text) : null;
}

async function handleAnalyzeFace(ai: GoogleGenAI, base64Image: string) {
  const prompt = `
      Act as a professional makeup artist. Analyze the face in the image (assuming it is makeup-free or minimal makeup) to determine skin tone, eye shape, and best makeup practices.

      Output MUST be a valid JSON object. No markdown.
      Language: Turkish.

      Fields required:
      1. skinTone: Determine the undertone (e.g., 'Sıcak', 'Soğuk', 'Nötr', 'Zeytin').
      2. eyeShape: Determine the shape (e.g., 'Badem', 'Düşük Göz Kapağı', 'Yuvarlak', 'Çekik', 'Çukur').
      3. eyeColor: Dominant eye color (e.g., 'Ela', 'Kahverengi', 'Mavi', 'Yeşil').
      4. eyeliner: A specific, actionable tip for applying eyeliner based on the eye shape.
      5. eyeshadow: Specific color recommendations and technique based on skin tone and eye color.
      6. blush: Color and placement recommendation based on face shape/skin tone.
      7. lipstick: Best lipstick shades for daily use based on skin undertone.

      Example JSON Structure:
      {
        "skinTone": "Sıcak",
        "eyeShape": "Badem",
        "eyeColor": "Ela",
        "eyeliner": "Göz yapına göre ince kuyruklu...",
        "eyeshadow": "Toprak tonları...",
        "blush": "Şeftali tonlarında...",
        "lipstick": "Gül kurusu..."
      }
    `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: sanitizeBase64(base64Image) } },
        { text: prompt },
      ],
    },
    config: { responseMimeType: "application/json" },
  });

  const text = await extractText(response);
  return text ? JSON.parse(text) : null;
}

async function handleGenerateOutfit(ai: GoogleGenAI, user: UserProfile, wardrobe: WardrobeItem[]): Promise<SuggestionResult | null> {
  if (!wardrobe || wardrobe.length < 2) return null;

  const wardrobeList = wardrobe.map((item) => ({
    id: item.id,
    desc: `${item.color} ${item.name} (${item.type})`,
    details: {
      fabric: item.aiTags?.fabric,
      fit: item.aiTags?.fit,
      pattern: item.aiTags?.pattern,
      aesthetic: item.aiTags?.aesthetic?.join(", "),
    },
    styles: item.aiTags?.style?.join(", "),
  }));

  const userStyles = user.styles.join(", ");
  const now = new Date();
  const hour = now.getHours();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  let timeContext = isWeekend ? "Weekend Leisure" : "Weekday Routine";
  if (hour > 18) timeContext = "Evening / Night Out";

  const prompt = `
      Act as a high-end personal stylist specializing in Avant-garde, Gothic, Minimalist, and Bohem aesthetics.
      Your client has a specific style preference: ${userStyles}.
      Current Context: ${timeContext}.

      Available Wardrobe Inventory (JSON):
      ${JSON.stringify(wardrobeList)}

      **Your Mission:**
      Create the single most stylish, cohesive outfit possible from this inventory, paying close attention to **Silhouette**, **Color Theory**, and **Fabric Contrast**.

      **Styling Guidelines:**
      1. **Aesthetic Fidelity**: 
         - If 'Gothic': Prioritize black, dark reds, leather, lace, silver hardware.
         - If 'Avant-garde': Look for asymmetry, layering, and structural contrasts.
         - If 'Minimalist': Focus on clean lines, monochromatic or neutral palettes (Beige, Grey, White, Black).
      2. **Fabric Physics**: Combine contrasting textures to create depth. Examples: 
         - Heavy Knit + Satin
         - Leather + Sheer
         - Denim + Velvet
      3. **Silhouette Balance**: Balance volumes.
         - Tight Top + Wide Leg Pants.
         - Oversize Blazer + Slim fit.
      4. **Completeness**: Aim for a complete look (Top + Bottom + Shoes OR Dress + Shoes + Outerwear).

      Return JSON ONLY.
      {
         "selectedItemIds": [Array of item IDs],
         "title": "A high-fashion editorial title in Turkish (e.g., 'Gotik Romantizm', 'Şehirli Avant-garde', 'Monokrom Doku')",
         "desc": "A convincing stylist pitch in Turkish explaining the TEXTURE play and SILHOUETTE choice. Explain WHY these fabrics work together.",
         "beauty": { 
            "hair": {"title": "Turkish Title", "desc": "Specific advice matching the vibe (e.g. 'Sleek Bun' for Avant-garde, 'Messy Waves' for Boho)"}, 
            "makeup": {"title": "Turkish Title", "desc": "Specific advice (e.g., 'Smokey Eye', 'No-Makeup Look')"}, 
            "perfume": {"title": "Turkish Title", "desc": "Scent notes that match the mood (e.g., 'Sandalwood & Leather')"} 
         },
         "missingPiece": "One specific item (not generic) that would elevate this to a runway look (e.g., 'Silver Body Chain', 'Platform Boots', 'Oversize Trench') in Turkish."
      }
    `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.75,
    },
  });

  const text = await extractText(response);
  if (!text) return null;
  const data = JSON.parse(text || "{}");
  if (!data.selectedItemIds) return null;

  const selectedItems = wardrobe.filter((item) => data.selectedItemIds.includes(item.id));

  const suggestion: SuggestionResult = {
    outfit: {
      title: data.title,
      desc: data.desc,
      items: selectedItems.map((i) => ({ name: i.name, type: i.type, styles: user.styles, image: i.image })),
    },
    beauty: data.beauty,
    additionalTips: [
      { title: "Eksik Parça", desc: data.missingPiece, icon: null },
      { title: "Doku Notu", desc: "Zıt kumaşları eşleştirmek kombine derinlik katar.", icon: null },
    ],
  };

  return suggestion;
}

async function handlePersonalizedTips(ai: GoogleGenAI, user: UserProfile, wardrobe: WardrobeItem[]) {
  const userStyles = user.styles.join(", ");

  const itemsSummary = wardrobe
    .map((item) => `${item.color} ${item.name} (${item.aiTags?.fabric || "unknown fabric"}, ${item.aiTags?.aesthetic?.join(" ") || ""})`)
    .join(", ");

  const aesthetics = wardrobe.reduce<Record<string, number>>((acc, item) => {
    if (item.aiTags?.aesthetic) {
      item.aiTags.aesthetic.forEach((a) => {
        acc[a] = (acc[a] || 0) + 1;
      });
    }
    return acc;
  }, {});

  const colors = wardrobe.reduce<Record<string, number>>((acc, item) => {
    acc[item.color] = (acc[item.color] || 0) + 1;
    return acc;
  }, {});

  const dominantAesthetic = Object.entries(aesthetics).sort((a, b) => b[1] - a[1])[0]?.[0] || "Modern";
  const dominantColor = Object.entries(colors).sort((a, b) => b[1] - a[1])[0]?.[0] || "Neutral";

  const today = new Date();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;
  const context = isWeekend ? "Weekend/Casual" : "Weekday/Work/Daily";

  const prompt = `
      Act as the editor-in-chief of a fashion magazine like Vogue or Dazed.
      
      **User Profile:**
      - Preferred Styles: ${userStyles}
      - Wardrobe Dominant Aesthetic: '${dominantAesthetic}'
      - Wardrobe Dominant Color: '${dominantColor}'
      - Current Context: ${context}
      
      **Items Available:** 
      ${itemsSummary.slice(0, 1500)}...

      **Task:**
      Create a "Daily Style Briefing" in Turkish. The tone should be sophisticated, empowering, and helpful.

      **Requirements:**
      1. **Title**: Chic editorial headline (e.g. 'Neo-Gothic', 'Avant-garde Basics', 'Sunday Luxe').
      2. **DailyMantra**: A short, empowering fashion quote or mood sentence related to their style.
      3. **Tips**: 3 sophisticated, actionable styling tips. 
         - Tip 1: Focus on **Fabric/Texture** mixing based on their items.
         - Tip 2: Focus on **Color Palette** suggestions (how to break their dominant color).
         - Tip 3: Focus on **Accessories/Silhouette**.
      4. **ColorPalette**: 3 hex codes that form a harmonious palette for today based on their wardrobe.
      5. **StyleIcon**: One word vibe (e.g. 'Effortless', 'Edgy', 'Sculptural').

      Return JSON matching StyleTipResult interface.
    `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const text = await extractText(response);
  return text ? JSON.parse(text) : null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return withCors({}, 204, null);
    }

    if (!env.GEMINI_API_KEY || !env.GATEWAY_KEY) {
      return jsonResponse({ error: "Gateway not configured" }, 500);
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method Not Allowed" }, 405);
    }

    const providedKey = request.headers.get("x-gateway-key") || request.headers.get("X-Gateway-Key");
    if (!providedKey || providedKey !== env.GATEWAY_KEY) {
      return unauthorized();
    }

    const url = new URL(request.url);
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

    try {
      switch (url.pathname) {
        case "/analyzeImage": {
          const { base64Image } = await request.json();
          if (!base64Image) return jsonResponse({ error: "base64Image required" }, 400);
          const result = await handleAnalyzeImage(ai, base64Image);
          return jsonResponse({ result });
        }
        case "/rateOutfit": {
          const { base64Image } = await request.json();
          if (!base64Image) return jsonResponse({ error: "base64Image required" }, 400);
          const result = await handleRateOutfit(ai, base64Image);
          return jsonResponse({ result });
        }
        case "/analyzeFaceForMakeup": {
          const { base64Image } = await request.json();
          if (!base64Image) return jsonResponse({ error: "base64Image required" }, 400);
          const result = await handleAnalyzeFace(ai, base64Image);
          return jsonResponse({ result });
        }
        case "/generateOutfitFromWardrobe": {
          const { user, wardrobe } = await request.json();
          if (!user || !wardrobe) return jsonResponse({ error: "user and wardrobe required" }, 400);
          const result = await handleGenerateOutfit(ai, user as UserProfile, wardrobe as WardrobeItem[]);
          return jsonResponse({ result });
        }
        case "/generatePersonalizedTips": {
          const { user, wardrobe } = await request.json();
          if (!user || !wardrobe) return jsonResponse({ error: "user and wardrobe required" }, 400);
          const result = await handlePersonalizedTips(ai, user as UserProfile, wardrobe as WardrobeItem[]);
          return jsonResponse({ result });
        }
        default:
          return jsonResponse({ error: "Not Found" }, 404);
      }
    } catch (err: any) {
      console.error("Gateway error", err);
      return jsonResponse({ error: err?.message || "Internal Error" }, 500);
    }
  },
};
