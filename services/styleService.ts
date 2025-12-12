
import { STYLE_OPTIONS } from '../constants';
import { Palette, Tag, Scissors, ShoppingBag, Sun, Layers } from 'lucide-react';
import { StyleTipResult, SuggestionResult, UserProfile, WardrobeItem, StyleRating } from '../types';
import { generatePersonalizedTips, generateOutfitFromWardrobe, rateOutfit as aiRateOutfit } from './aiService';

// --- ADVANCED STYLE LOGIC ---

// 1. Fabric Compatibility Matrix (Who matches with whom?)
// Defines which fabrics create good textural contrast or harmony.
const FABRIC_PAIRS: Record<string, string[]> = {
    'Denim': ['Pamuk', 'Deri', 'Keten', 'Triko', 'Yün', 'Saten'],
    'Deri': ['Denim', 'İpek', 'Pamuk', 'Yün', 'Dantel', 'File'],
    'İpek': ['Deri', 'Denim', 'Keten', 'Yün', 'Kaşmir'],
    'Keten': ['Pamuk', 'Denim', 'İpek', 'Örgü'],
    'Yün': ['Deri', 'Denim', 'İpek', 'Saten', 'Kadife'],
    'Saten': ['Yün', 'Deri', 'Denim', 'Kaşmir'],
    'Dantel': ['Deri', 'Denim', 'Kadife', 'Saten'],
    'Kadife': ['Dantel', 'İpek', 'Saten', 'Şifon'],
    'Pamuk': ['Denim', 'Keten', 'Deri', 'Pamuk'],
    'Teknik': ['Pamuk', 'Jersey', 'File', 'Paraşüt']
};

// 2. Style DNA: Keywords, Colors, and Fabrics for specific aesthetics
const STYLE_DNA: Record<string, { colors: string[], fabrics: string[], keywords: string[] }> = {
    'gothic': {
        colors: ['Siyah', 'Bordo', 'Mor', 'Antrasit', 'Kırmızı'],
        fabrics: ['Deri', 'Dantel', 'Kadife', 'Tül', 'File'],
        keywords: ['karanlık', 'metal', 'zincir', 'korse', 'bot', 'dramatik']
    },
    'avantgarde': {
        colors: ['Siyah', 'Beyaz', 'Gri', 'Antrasit', 'Monokrom'],
        fabrics: ['Deri', 'Neopren', 'Teknik', 'Yün', 'Pamuk'],
        keywords: ['asimetrik', 'yapısal', 'oversize', 'katmanlı', 'deconstructed', 'heykelsi']
    },
    'boho': {
        colors: ['Bej', 'Kahve', 'Taba', 'Kiremit', 'Ekru', 'Yeşil'],
        fabrics: ['Keten', 'Süet', 'Şifon', 'Örgü', 'Makrome'],
        keywords: ['etnik', 'desen', 'salaş', 'püskül', 'çiçek', 'doğal']
    },
    'minimal': {
        colors: ['Siyah', 'Beyaz', 'Bej', 'Gri', 'Lacivert', 'Ekru', 'Krem'],
        fabrics: ['Pamuk', 'Keten', 'Kaşmir', 'İpek', 'Yün'],
        keywords: ['düz', 'sade', 'keskin', 'basic', 'zamansız', 'kaliteli']
    },
    'street': {
        colors: ['Siyah', 'Gri', 'Turuncu', 'Haki', 'Neon', 'Mavi'],
        fabrics: ['Denim', 'Pamuk', 'Paraşüt', 'Deri', 'Teknik'],
        keywords: ['oversize', 'logo', 'kapüşon', 'sneaker', 'kargo', 'rahat']
    },
    'classic': {
        colors: ['Lacivert', 'Siyah', 'Beyaz', 'Bej', 'Gri'],
        fabrics: ['Pamuk', 'Yün', 'İpek', 'Kaşmir'],
        keywords: ['ceket', 'gömlek', 'ofis', 'şık', 'resmi']
    },
    'vintage': {
        colors: ['Kahve', 'Hardal', 'Yeşil', 'Bordo', 'Krem'],
        fabrics: ['Kadife', 'Deri', 'Yün', 'Şifon'],
        keywords: ['retro', 'eski', 'nostaljik', 'desenli']
    }
};

// Helper: Calculate compatibility score between two items based on style context
const calculateCompatibility = (item1: WardrobeItem, item2: WardrobeItem, targetStyle: string): number => {
    let score = 0;

    // A. Color Harmony (Simple check for now: Monochromatic or Safe Neutrals)
    const neutrals = ['Siyah', 'Beyaz', 'Gri', 'Bej', 'Antrasit', 'Ekru', 'Krem'];
    if (item1.color === item2.color) score += 3; // Monochrome is usually stylish
    else if (neutrals.includes(item1.color) || neutrals.includes(item2.color)) score += 2; // Safe pairing
    
    // B. Fabric Contrast using Matrix
    const f1 = item1.aiTags?.fabric || 'Pamuk';
    const f2 = item2.aiTags?.fabric || 'Pamuk';
    
    // Check direct compatibility from matrix
    if (FABRIC_PAIRS[f1]?.includes(f2) || FABRIC_PAIRS[f2]?.includes(f1)) {
        score += 3; // Texture contrast is key for good style
    }

    // C. Style DNA Matching
    const dna = STYLE_DNA[targetStyle];
    if (dna) {
        // If items explicitly belong to the target style (via aiTags or matching DNA properties)
        const i1Matches = item1.aiTags?.style?.includes(targetStyle) || dna.fabrics.includes(f1) || dna.colors.includes(item1.color);
        const i2Matches = item2.aiTags?.style?.includes(targetStyle) || dna.fabrics.includes(f2) || dna.colors.includes(item2.color);
        
        if (i1Matches && i2Matches) score += 5; // High stylistic coherence
        else if (i1Matches || i2Matches) score += 2;
    }

    return score;
};

// Fallback static generator
export const generateStaticStyleTips = (userStyles: string[]): StyleTipResult => {
  const dominantStyleId = userStyles[Math.floor(Math.random() * userStyles.length)] || 'minimal';
  const dominantStyleLabel = STYLE_OPTIONS.find(s => s.id === dominantStyleId)?.label || 'Minimalist';

  return {
    title: `${dominantStyleLabel} Günlük Raporu`,
    dailyMantra: "Bugün aynadaki yansıman, içindeki gücü göstersin.",
    tips: [
      "Tek renk (monokrom) giyinmek her zaman daha sofistike gösterir.",
      "Kombinini tamamlamak için zıt dokuları (örneğin deri ve triko) bir arada kullan.",
      "Özgüven, giydiğin en pahalı parçadan daha değerlidir."
    ],
    styleIcon: dominantStyleId,
    colorPalette: ["#1C1917", "#D6C0B3", "#E1ADAC"]
  };
};

export const generateSmartStyleTips = async (user: UserProfile, wardrobe: WardrobeItem[]): Promise<StyleTipResult> => {
  try {
    const aiResult = await generatePersonalizedTips(user, wardrobe);
    if (aiResult) return aiResult;
    return generateStaticStyleTips(user.styles);
  } catch (e) {
    return generateStaticStyleTips(user.styles);
  }
};

// Main Outfit Generator Wrapper
export const generateSmartOutfit = async (user: UserProfile, wardrobe: WardrobeItem[]): Promise<SuggestionResult> => {
    // Try AI generation first for best results
    try {
        if (wardrobe.length >= 2) {
            const aiOutfit = await generateOutfitFromWardrobe(user, wardrobe);
            if (aiOutfit) return aiOutfit;
        }
    } catch (e) {
        console.error("AI Outfit Gen failed, switching to Smart Offline Algorithm");
    }

    // Fallback to Advanced Offline Logic
    return generateOfflineSuggestion(user, wardrobe);
};

export const generateOfflineSuggestion = (userProfile: UserProfile, wardrobe: WardrobeItem[]): SuggestionResult => {
  const userStyles = userProfile?.styles || ['minimal'];
  // Pick a random target style from user's preferences to guide this generation
  const targetStyle = userStyles[Math.floor(Math.random() * userStyles.length)];
  const styleLabel = STYLE_OPTIONS.find(s => s.id === targetStyle)?.label || 'Modern';

  // Categorize Wardrobe
  const tops = wardrobe.filter(i => i.type === 'ust');
  const bottoms = wardrobe.filter(i => i.type === 'alt');
  const dresses = wardrobe.filter(i => i.type === 'elbise');
  const outers = wardrobe.filter(i => i.type === 'dis');
  const shoes = wardrobe.filter(i => i.type === 'ayakkabi');
  const accessories = wardrobe.filter(i => i.type === 'aksesuar');

  let selectedItems: WardrobeItem[] = [];

  // --- STEP 1: SELECT HERO ITEM ---
  // We try to find a "Hero" item that strongly represents the target style
  const dna = STYLE_DNA[targetStyle];
  
  // Score items based on how well they fit the target style
  const scoreItemForStyle = (item: WardrobeItem) => {
      let s = 0;
      if (item.aiTags?.style?.includes(targetStyle)) s += 10; // Direct Tag match
      if (dna) {
          if (dna.colors.includes(item.color)) s += 3;
          if (dna.fabrics.includes(item.aiTags?.fabric || '')) s += 4;
          if (dna.keywords.some(k => item.name.toLowerCase().includes(k))) s += 2;
      }
      return s + Math.random() * 2; // Add randomness so it's not always the same item
  };

  // Decide: Dress vs Top/Bottom
  // Prefer dresses if style is Boho/Romantic or randomly
  const useDress = dresses.length > 0 && (Math.random() > 0.6 || (tops.length === 0 || bottoms.length === 0));

  if (useDress) {
      // Pick best dress for style
      const sortedDresses = dresses.sort((a, b) => scoreItemForStyle(b) - scoreItemForStyle(a));
      selectedItems.push(sortedDresses[0]);
  } else {
      // Pick best Top
      if (tops.length > 0) {
          const sortedTops = tops.sort((a, b) => scoreItemForStyle(b) - scoreItemForStyle(a));
          selectedItems.push(sortedTops[0]);
      }
      
      // Find matching Bottom using compatibility score
      if (bottoms.length > 0 && selectedItems.length > 0) {
          const heroTop = selectedItems[0];
          const sortedBottoms = bottoms.sort((a, b) => 
              calculateCompatibility(heroTop, b, targetStyle) - calculateCompatibility(heroTop, a, targetStyle)
          );
          selectedItems.push(sortedBottoms[0]);
      } else if (bottoms.length > 0) {
          selectedItems.push(bottoms[0]);
      }
  }

  // --- STEP 2: ADD LAYERS (Outerwear) ---
  if (outers.length > 0 && Math.random() > 0.3) {
      // Find outerwear that matches the base look
      const baseItem = selectedItems[0]; // Top or Dress
      const sortedOuters = outers.sort((a, b) => 
        calculateCompatibility(baseItem, b, targetStyle) - calculateCompatibility(baseItem, a, targetStyle)
      );
      selectedItems.push(sortedOuters[0]);
  }

  // --- STEP 3: SHOES ---
  if (shoes.length > 0) {
      // Shoes should match the general vibe
      const sortedShoes = shoes.sort((a, b) => scoreItemForStyle(b) - scoreItemForStyle(a));
      selectedItems.push(sortedShoes[0]);
  }

  // --- STEP 4: ACCESSORIES ---
  if (accessories.length > 0 && Math.random() > 0.4) {
      const sortedAcc = accessories.sort((a, b) => scoreItemForStyle(b) - scoreItemForStyle(a));
      selectedItems.push(sortedAcc[0]);
  }

  // --- GENERATE EDITORIAL COPY ---
  let title = `${styleLabel} Manifestosu`;
  let desc = `Gardırobundaki ${selectedItems[0]?.name || 'parçalar'} ile oluşturulan bu kombin, ${styleLabel} estetiğinin modern bir yorumu.`;
  
  if (targetStyle === 'avantgarde') {
      title = "Yapısal Formlar";
      desc = "Asimetri ve doku oyunlarıyla sıradanlığa meydan okuyan bir silüet.";
  } else if (targetStyle === 'gothic') {
      title = "Karanlık Romantizm";
      desc = "Siyahın derinliği ve dokuların dramatik uyumu ile oluşturulan gizemli bir hava.";
  } else if (targetStyle === 'minimal') {
      title = "Sessiz Lüks";
      desc = "Az ama öz. Temiz çizgiler ve nötr tonların sakinleştirici uyumu.";
  } else if (targetStyle === 'street') {
      title = "Şehir Ritmi";
      desc = "Konfor ve stilin buluştuğu, şehrin hızına ayak uyduran dinamik bir görünüm.";
  }

  if (selectedItems.length < 2) {
    title = "Eksik Parçalar";
    desc = "Bu stili tamamlamak için gardırobuna bir alt giyim veya dış giyim parçası eklemelisin.";
  }

  // Dynamic Tips based on selection
  const fabricNote = selectedItems[0]?.aiTags?.fabric || 'Kumaş';
  
  return {
    outfit: {
      title,
      desc,
      items: selectedItems.map(i => ({
        name: i.name,
        type: i.type,
        styles: [targetStyle],
        image: i.image
      }))
    },
    beauty: {
      hair: { 
          title: targetStyle === 'avantgarde' ? "Islak Görünüm" : (targetStyle === 'boho' ? "Dağınık Dalgalar" : "Doğal Görünüm"), 
          desc: targetStyle === 'avantgarde' ? "Geriye taranmış, modern ve net." : "Doğal akışına bırakılmış saçlar." 
      },
      makeup: { 
          title: targetStyle === 'gothic' ? "Koyu Dudaklar" : "Fresh Skin", 
          desc: targetStyle === 'gothic' ? "Bordo veya koyu mor bir rujla vurucu etki." : "Işıltılı ve hafif bir bitiş." 
      },
      perfume: { 
          title: targetStyle === 'boho' ? "Odunsu & Çiçeksi" : "Baharatlı & Derin", 
          desc: "Kombininin ruhunu tamamlayan bir koku." 
      }
    },
    additionalTips: [
      { title: "Doku Oyunu", desc: `${fabricNote} dokusunu, zıt bir materyalle eşleştirerek derinlik kat.`, icon: Layers },
      { title: "Silüet", desc: "Bol parçaları dar parçalarla dengeleyerek vücut hatlarını koru.", icon: Scissors }
    ]
  };
};

export const generateSuggestionFromImage = (userProfile: UserProfile, wardrobe: WardrobeItem[], targetItem: WardrobeItem): SuggestionResult => {
  // Use the advanced offline logic but force the targetItem as the "Hero"
  // Filter out the target item from wardrobe to avoid duplication
  const filteredWardrobe = wardrobe.filter(i => i.id !== targetItem.id);
  const suggestion = generateOfflineSuggestion(userProfile, filteredWardrobe);
  
  // Replace the first item of the same type or prepend if not exists
  const matchingTypeIndex = suggestion.outfit.items.findIndex(i => i.type === targetItem.type);
  
  let newItems = [...suggestion.outfit.items];
  const targetItemMapped = {
      name: targetItem.name, 
      type: targetItem.type, 
      styles: userProfile.styles, 
      image: targetItem.image
  };

  if (matchingTypeIndex !== -1) {
      newItems[matchingTypeIndex] = targetItemMapped;
  } else {
      newItems = [targetItemMapped, ...newItems];
  }
  
  return {
      ...suggestion,
      outfit: {
          title: "Mükemmel Eşleşme",
          desc: `${targetItem.name} etrafında kurgulanan bu görünüm, stilinle bütünleşiyor.`,
          items: newItems
      }
  };
};

export const rateOutfit = async (base64Image: string): Promise<Omit<StyleRating, 'image' | 'date'> | null> => {
  return aiRateOutfit(base64Image);
};
