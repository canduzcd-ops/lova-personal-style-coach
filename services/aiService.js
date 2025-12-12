import { GoogleGenAI } from "@google/genai";
import { STYLE_OPTIONS } from '../constants';
import { Tag, ShoppingBag } from 'lucide-react';
// .env içindeki değişkeni al
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
    // Konsolda net görünsün
    console.error("VITE_GEMINI_API_KEY is missing. Check your .env file.");
    throw new Error("AI API key is not set");
}
const ai = new GoogleGenAI({ apiKey });
// Enhanced Image Analysis
export const analyzeImage = async (base64Image) => {
    try {
        const base64Data = base64Image.includes('base64,')
            ? base64Image.split('base64,')[1]
            : base64Image;
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
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: prompt }
                ]
            },
            config: { responseMimeType: 'application/json' }
        });
        if (response.text) {
            return JSON.parse(response.text);
        }
        return null;
    }
    catch (error) {
        console.error("Gemini Analysis Error:", error);
        return null;
    }
};
// Rate Outfit Analysis
export const rateOutfit = async (base64Image) => {
    try {
        const base64Data = base64Image.includes('base64,')
            ? base64Image.split('base64,')[1]
            : base64Image;
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
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: prompt }
                ]
            },
            config: { responseMimeType: 'application/json' }
        });
        if (response.text) {
            return JSON.parse(response.text);
        }
        return null;
    }
    catch (error) {
        console.error("Outfit Rating Error:", error);
        return null;
    }
};
// Makeup Analysis using Face Image
export const analyzeFaceForMakeup = async (base64Image) => {
    try {
        const base64Data = base64Image.includes('base64,')
            ? base64Image.split('base64,')[1]
            : base64Image;
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
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: prompt }
                ]
            },
            config: { responseMimeType: 'application/json' }
        });
        if (response.text) {
            return JSON.parse(response.text);
        }
        return null;
    }
    catch (error) {
        console.error("Makeup Analysis Error:", error);
        return null;
    }
};
// Smart Outfit Generation using User's Actual Items
export const generateOutfitFromWardrobe = async (user, wardrobe) => {
    try {
        if (wardrobe.length < 2)
            return null;
        // Convert wardrobe to a detailed text representation for the AI
        const wardrobeList = wardrobe.map(item => ({
            id: item.id,
            desc: `${item.color} ${item.name} (${item.type})`,
            details: {
                fabric: item.aiTags?.fabric,
                fit: item.aiTags?.fit,
                pattern: item.aiTags?.pattern,
                aesthetic: item.aiTags?.aesthetic?.join(', ')
            },
            styles: item.aiTags?.style?.join(', ')
        }));
        const userStyles = user.styles.map(s => STYLE_OPTIONS.find(o => o.id === s)?.label).join(', ');
        // Determine context based on time/day
        const now = new Date();
        const hour = now.getHours();
        const isWeekend = now.getDay() === 0 || now.getDay() === 6;
        let timeContext = isWeekend ? "Weekend Leisure" : "Weekday Routine";
        if (hour > 18)
            timeContext = "Evening / Night Out";
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
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                temperature: 0.75 // Slightly higher creativity for fashion
            }
        });
        const data = JSON.parse(response.text || '{}');
        if (!data.selectedItemIds)
            return null;
        // Map IDs back to actual objects
        const selectedItems = wardrobe.filter(item => data.selectedItemIds.includes(item.id));
        return {
            outfit: {
                title: data.title,
                desc: data.desc,
                items: selectedItems.map(i => ({
                    name: i.name,
                    type: i.type,
                    styles: user.styles,
                    image: i.image
                }))
            },
            beauty: data.beauty,
            additionalTips: [
                { title: "Eksik Parça", desc: data.missingPiece, icon: ShoppingBag },
                { title: "Doku Notu", desc: "Zıt kumaşları eşleştirmek kombine derinlik katar.", icon: Tag }
            ]
        };
    }
    catch (error) {
        console.error("Outfit Generation Error:", error);
        return null;
    }
};
export const generatePersonalizedTips = async (user, wardrobe) => {
    try {
        const userStyles = user.styles.join(', ');
        // Create a rich summary of the wardrobe
        const itemsSummary = wardrobe.map(item => `${item.color} ${item.name} (${item.aiTags?.fabric || 'unknown fabric'}, ${item.aiTags?.aesthetic?.join(' ') || ''})`).join(', ');
        // Analyze composition for better prompt
        const aesthetics = wardrobe.reduce((acc, item) => {
            if (item.aiTags?.aesthetic) {
                item.aiTags.aesthetic.forEach(a => {
                    acc[a] = (acc[a] || 0) + 1;
                });
            }
            return acc;
        }, {});
        const colors = wardrobe.reduce((acc, item) => {
            acc[item.color] = (acc[item.color] || 0) + 1;
            return acc;
        }, {});
        const dominantAesthetic = Object.entries(aesthetics).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Modern';
        const dominantColor = Object.entries(colors).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Neutral';
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
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        if (response.text) {
            return JSON.parse(response.text);
        }
        return null;
    }
    catch (error) {
        console.error("Tips Error:", error);
        return null;
    }
};
// Video Generation for Splash Screen
export const generateFashionVideo = async (prompt) => {
    // Always create a new instance with the latest key environment
    const aiClient = new GoogleGenAI({
        apiKey: import.meta.env.VITE_GEMINI_API_KEY,
    });
    try {
        let operation = await aiClient.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '9:16' // Mobile portrait
            }
        });
        // Poll for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Poll every 3 seconds
            operation = await aiClient.operations.getVideosOperation({ operation: operation });
        }
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
            // Fetch actual bytes to blob
            const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        }
        return null;
    }
    catch (error) {
        console.error("Video Generation Error:", error);
        throw error;
    }
};
