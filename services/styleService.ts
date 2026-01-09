import { STYLE_OPTIONS } from '../constants';
import { Layers, Scissors } from 'lucide-react';
import i18n from '../src/i18n';
import { StyleTipResult, SuggestionResult, UserProfile, WardrobeItem, StyleRating } from '../types';
import {
  generatePersonalizedTips,
  generateOutfitFromWardrobe,
  rateOutfit as aiRateOutfit,
} from './aiService';

// --- ADVANCED STYLE LOGIC ---

// 1) Fabric Compatibility Matrix
const FABRIC_PAIRS: Record<string, string[]> = {
  Denim: ['Pamuk', 'Deri', 'Keten', 'Triko', 'Yün', 'Saten'],
  Deri: ['Denim', 'İpek', 'Pamuk', 'Yün', 'Dantel', 'File'],
  İpek: ['Deri', 'Denim', 'Keten', 'Yün', 'Kaşmir'],
  Keten: ['Pamuk', 'Denim', 'İpek', 'Örgü'],
  Yün: ['Deri', 'Denim', 'İpek', 'Saten', 'Kadife'],
  Saten: ['Yün', 'Deri', 'Denim', 'Kaşmir'],
  Dantel: ['Deri', 'Denim', 'Kadife', 'Saten'],
  Kadife: ['Dantel', 'İpek', 'Saten', 'Şifon'],
  Pamuk: ['Denim', 'Keten', 'Deri', 'Pamuk'],
  Teknik: ['Pamuk', 'Jersey', 'File', 'Paraşüt'],
};

// 2) Style DNA
const STYLE_DNA: Record<string, { colors: string[]; fabrics: string[]; keywords: string[] }> = {
  gothic: {
    colors: ['Siyah', 'Bordo', 'Mor', 'Antrasit', 'Kırmızı'],
    fabrics: ['Deri', 'Dantel', 'Kadife', 'Tül', 'File'],
    keywords: ['karanlık', 'metal', 'zincir', 'korse', 'bot', 'dramatik'],
  },
  avantgarde: {
    colors: ['Siyah', 'Beyaz', 'Gri', 'Antrasit', 'Monokrom'],
    fabrics: ['Deri', 'Neopren', 'Teknik', 'Yün', 'Pamuk'],
    keywords: ['asimetrik', 'yapısal', 'oversize', 'katmanlı', 'deconstructed', 'heykelsi'],
  },
  classic: {
    colors: ['Lacivert', 'Beyaz', 'Gri', 'Bej', 'Krem'],
    fabrics: ['Pamuk', 'Yün', 'İpek', 'Kaşmir'],
    keywords: ['ceket', 'gömlek', 'ofis', 'şık', 'resmi'],
  },
  vintage: {
    colors: ['Kahve', 'Hardal', 'Yeşil', 'Bordo', 'Krem'],
    fabrics: ['Kadife', 'Deri', 'Yün', 'Şifon'],
    keywords: ['retro', 'eski', 'nostaljik', 'desenli'],
  },
  minimal: {
    colors: ['Siyah', 'Beyaz', 'Gri', 'Bej', 'Ekru', 'Krem'],
    fabrics: ['Pamuk', 'Keten', 'Yün', 'Kaşmir'],
    keywords: ['basic', 'düz', 'temiz', 'sade', 'minimal'],
  },
  street: {
    colors: ['Siyah', 'Gri', 'Beyaz', 'Mavi', 'Haki'],
    fabrics: ['Denim', 'Pamuk', 'Teknik', 'Jersey'],
    keywords: ['sneaker', 'hoodie', 'oversize', 'cargo', 'street'],
  },
  boho: {
    colors: ['Krem', 'Toprak', 'Kahve', 'Hardal', 'Yeşil'],
    fabrics: ['Keten', 'Pamuk', 'Şifon', 'Dantel'],
    keywords: ['bohem', 'çiçekli', 'püskül', 'rahat', 'kat kat'],
  },
};

// Helper: compatibility score
const calculateCompatibility = (item1: WardrobeItem, item2: WardrobeItem, targetStyle: string): number => {
  let score = 0;

  const neutrals = ['Siyah', 'Beyaz', 'Gri', 'Bej', 'Antrasit', 'Ekru', 'Krem'];
  if (item1.color === item2.color) score += 3;
  else if (neutrals.includes(item1.color) || neutrals.includes(item2.color)) score += 2;

  const f1 = item1.aiTags?.fabric || 'Pamuk';
  const f2 = item2.aiTags?.fabric || 'Pamuk';
  if (FABRIC_PAIRS[f1]?.includes(f2) || FABRIC_PAIRS[f2]?.includes(f1)) score += 3;

  const dna = STYLE_DNA[targetStyle];
  if (dna) {
    const i1Matches =
      item1.aiTags?.style?.includes(targetStyle) || dna.fabrics.includes(f1) || dna.colors.includes(item1.color);
    const i2Matches =
      item2.aiTags?.style?.includes(targetStyle) || dna.fabrics.includes(f2) || dna.colors.includes(item2.color);

    if (i1Matches && i2Matches) score += 5;
    else if (i1Matches || i2Matches) score += 2;
  }

  return score;
};

// --- STATIC TIPS ---
export const generateStaticStyleTips = (userStyles: string[]): StyleTipResult => {
  const dominantStyleId = userStyles[Math.floor(Math.random() * userStyles.length)] || 'minimal';
  const dominantStyleLabel =
    STYLE_OPTIONS.find((s) => s.id === dominantStyleId)?.label || i18n.t('style.fallbackStyle', 'Modern');

  return {
    title: i18n.t('style.static.title', { style: dominantStyleLabel }),
    dailyMantra: i18n.t('style.static.mantra', 'Bugün aynadaki yansıman, içindeki gücü göstersin.'),
    tips: [
      i18n.t('style.static.tip1', 'Tek bir güçlü parça seç, geri kalan her şeyi onu parlatacak kadar sade tut.'),
      i18n.t('style.static.tip2', 'Tek bir "hero" parça seç.'),
      i18n.t('style.static.tip3', 'Doku kontrastı ekle.'),
    ],
    styleIcon: dominantStyleId,
    colorPalette: ['#1C1917', '#D6C0B3', '#E1ADAC'],
  };
};

export const generateSmartStyleTips = async (user: UserProfile, wardrobe: WardrobeItem[]): Promise<StyleTipResult> => {
  try {
    const aiResult = await generatePersonalizedTips(user, wardrobe);
    if (aiResult) return aiResult;
    return generateStaticStyleTips(user.styles);
  } catch {
    return generateStaticStyleTips(user.styles);
  }
};

// --- MAIN OUTFIT GENERATOR ---
export const generateSmartOutfit = async (
  user: UserProfile,
  wardrobe: WardrobeItem[],
  anchorItem?: WardrobeItem
): Promise<SuggestionResult> => {
  if (anchorItem) {
    const res = generateSuggestionFromImage(user, wardrobe, anchorItem);
    return {
      ...res,
      outfit: {
        ...res.outfit,
        desc: `${i18n.t('home.anchor_desc', 'This outfit was prepared around your selected piece.')} ${res.outfit.desc}`,
      },
    };
  }

  try {
    if (wardrobe.length >= 2) {
      const aiOutfit = await generateOutfitFromWardrobe(user, wardrobe);
      if (aiOutfit) return aiOutfit;
    }
  } catch (e) {
    console.error('AI Outfit Gen failed, switching to Smart Offline Algorithm', e);
  }

  return generateOfflineSuggestion(user, wardrobe);
};

export const generateOfflineSuggestion = (userProfile: UserProfile, wardrobe: WardrobeItem[]): SuggestionResult => {
  const userStyles = userProfile?.styles?.length ? userProfile.styles : ['minimal'];
  const targetStyle = userStyles[Math.floor(Math.random() * userStyles.length)] || 'minimal';
  const styleLabel = STYLE_OPTIONS.find((s) => s.id === targetStyle)?.label || i18n.t('style.fallbackStyle', 'Modern');

  const tops = wardrobe.filter((i) => i.type === 'ust');
  const bottoms = wardrobe.filter((i) => i.type === 'alt');
  const dresses = wardrobe.filter((i) => i.type === 'elbise');
  const outers = wardrobe.filter((i) => i.type === 'dis');
  const shoes = wardrobe.filter((i) => i.type === 'ayakkabi');
  const accessories = wardrobe.filter((i) => i.type === 'aksesuar');

  const selectedItems: WardrobeItem[] = [];
  const dna = STYLE_DNA[targetStyle];

  const scoreItemForStyle = (item: WardrobeItem) => {
    let s = 0;
    if (item.aiTags?.style?.includes(targetStyle)) s += 10;
    if (dna) {
      if (dna.colors.includes(item.color)) s += 3;
      if (dna.fabrics.includes(item.aiTags?.fabric || '')) s += 4;
      if (dna.keywords.some((k) => item.name.toLowerCase().includes(k))) s += 2;
    }
    return s + Math.random() * 2;
  };

  const useDress = dresses.length > 0 && (Math.random() > 0.6 || tops.length === 0 || bottoms.length === 0);

  if (useDress) {
    const sorted = [...dresses].sort((a, b) => scoreItemForStyle(b) - scoreItemForStyle(a));
    selectedItems.push(sorted[0]);
  } else {
    if (tops.length > 0) {
      const sorted = [...tops].sort((a, b) => scoreItemForStyle(b) - scoreItemForStyle(a));
      selectedItems.push(sorted[0]);
    }

    if (bottoms.length > 0 && selectedItems.length > 0) {
      const heroTop = selectedItems[0];
      const sortedBottoms = [...bottoms].sort(
        (a, b) => calculateCompatibility(heroTop, b, targetStyle) - calculateCompatibility(heroTop, a, targetStyle)
      );
      selectedItems.push(sortedBottoms[0]);
    } else if (bottoms.length > 0) {
      selectedItems.push(bottoms[0]);
    }
  }

  if (outers.length > 0 && selectedItems.length > 0 && Math.random() > 0.3) {
    const baseItem = selectedItems[0];
    const sortedOuters = [...outers].sort(
      (a, b) => calculateCompatibility(baseItem, b, targetStyle) - calculateCompatibility(baseItem, a, targetStyle)
    );
    selectedItems.push(sortedOuters[0]);
  }

  if (shoes.length > 0) {
    const sorted = [...shoes].sort((a, b) => scoreItemForStyle(b) - scoreItemForStyle(a));
    selectedItems.push(sorted[0]);
  }

  if (accessories.length > 0 && Math.random() > 0.4) {
    const sorted = [...accessories].sort((a, b) => scoreItemForStyle(b) - scoreItemForStyle(a));
    selectedItems.push(sorted[0]);
  }

  let title = i18n.t('style.outfit.title', { style: styleLabel, defaultValue: `Today's ${styleLabel} look` });
  let desc = i18n.t('style.outfit.desc', {
    item: selectedItems[0]?.name || i18n.t('style.outfit.itemFallback', 'your piece'),
    style: styleLabel,
    defaultValue: 'A look built around your wardrobe.',
  });

  if (targetStyle === 'avantgarde') {
    title = i18n.t('style.outfit.avantgarde.title', 'Avant-Garde Edit');
    desc = i18n.t('style.outfit.avantgarde.desc', 'Sharp lines, structure, and modern edge.');
  } else if (targetStyle === 'gothic') {
    title = i18n.t('style.outfit.gothic.title', 'Gothic Mood');
    desc = i18n.t('style.outfit.gothic.desc', 'Dark tones, dramatic textures, strong attitude.');
  } else if (targetStyle === 'minimal') {
    title = i18n.t('style.outfit.minimal.title', 'Minimal Chic');
    desc = i18n.t('style.outfit.minimal.desc', 'Clean silhouettes and effortless calm.');
  } else if (targetStyle === 'street') {
    title = i18n.t('style.outfit.street.title', 'Street Ready');
    desc = i18n.t('style.outfit.street.desc', 'Comfort meets confidence—easy, cool, functional.');
  }

  if (selectedItems.length < 2) {
    title = i18n.t('style.outfit.missing.title', 'Add a few more pieces');
    desc = i18n.t('style.outfit.missing.desc', 'To generate a full outfit, add at least 2 items to your wardrobe.');
  }

  const fabricNote = selectedItems[0]?.aiTags?.fabric || i18n.t('style.fabricFallback', 'Fabric');

  const beauty = {
    hair: {
      title:
        targetStyle === 'avantgarde'
          ? i18n.t('style.outfit.beauty.hair.avantgarde.title', 'Slick Wet Look')
          : targetStyle === 'boho'
          ? i18n.t('style.outfit.beauty.hair.boho.title', 'Messy Waves')
          : i18n.t('style.outfit.beauty.hair.default.title', 'Natural Finish'),
      desc: i18n.t('style.outfit.beauty.hair.desc', 'Keep it effortless and clean.'),
    },
    makeup: {
      title:
        targetStyle === 'gothic'
          ? i18n.t('style.outfit.beauty.makeup.gothic.title', 'Dark Lips')
          : i18n.t('style.outfit.beauty.makeup.default.title', 'Fresh Skin'),
      desc:
        targetStyle === 'gothic'
          ? i18n.t('style.outfit.beauty.makeup.gothic.desc', 'Burgundy or deep plum for impact.')
          : i18n.t('style.outfit.beauty.makeup.default.desc', 'Light, glowy, and soft.'),
    },
    perfume: {
      title:
        targetStyle === 'boho'
          ? i18n.t('style.outfit.beauty.perfume.boho.title', 'Woody & Floral')
          : i18n.t('style.outfit.beauty.perfume.default.title', 'Spicy & Deep'),
      desc: i18n.t('style.outfit.beauty.perfume.desc', 'A scent that completes the mood.'),
    },
  };

  return {
    outfit: {
      title,
      desc,
      items: selectedItems.map((i) => ({
        name: i.name,
        type: i.type,
        styles: [targetStyle],
        image: i.image,
      })),
    },
    beauty,
    additionalTips: [
      {
        title: i18n.t('style.outfit.tips.tipFabricTitle', 'Texture Play'),
        desc: i18n.t('style.outfit.tips.tipFabricDesc', {
          fabric: fabricNote,
          defaultValue: `${fabricNote} texture paired with a contrasting material adds depth.`,
        }),
        icon: Layers,
      },
      {
        title: i18n.t('style.outfit.tips.tipSilhouetteTitle', 'Silhouette'),
        desc: i18n.t(
          'style.outfit.tips.tipSilhouetteDesc',
          'Balance loose and fitted pieces to keep proportions clean.'
        ),
        icon: Scissors,
      },
    ],
  };
};

export const generateSuggestionFromImage = (
  userProfile: UserProfile,
  wardrobe: WardrobeItem[],
  targetItem: WardrobeItem
): SuggestionResult => {
  const filteredWardrobe = wardrobe.filter((i) => i.id !== targetItem.id);
  const suggestion = generateOfflineSuggestion(userProfile, filteredWardrobe);

  const matchingTypeIndex = suggestion.outfit.items.findIndex((i) => i.type === targetItem.type);

  let newItems = [...suggestion.outfit.items];
  const targetItemMapped = {
    name: targetItem.name,
    type: targetItem.type,
    styles: userProfile.styles,
    image: targetItem.image,
  };

  if (matchingTypeIndex !== -1) newItems[matchingTypeIndex] = targetItemMapped;
  else newItems = [targetItemMapped, ...newItems];

  return {
    ...suggestion,
    outfit: {
      title: i18n.t('style.outfit.match.title', 'Perfect Match'),
      desc: i18n.t('style.outfit.match.desc', { item: targetItem.name, defaultValue: `A look built around ${targetItem.name}.` }),
      items: newItems,
    },
  };
};

export const rateOutfit = async (base64Image: string): Promise<Omit<StyleRating, 'image' | 'date'> | null> => {
  return aiRateOutfit(base64Image);
};
