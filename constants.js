import { Palette, Tag, Scissors } from 'lucide-react';
export const STYLE_OPTIONS = [
    { id: 'minimal', label: 'Minimalist', desc: 'Sade, net ve zamansız parçalar.' },
    { id: 'boho', label: 'Bohem', desc: 'Özgür ruhlu, etnik desenli ve doğal kumaşlar.' },
    { id: 'chic', label: 'Şehirli Şık', desc: 'Modern kesimler, sofistike aksesuarlar.' },
    { id: 'street', label: 'Streetwear', desc: 'Rahat, oversize, logolu ve dinamik.' },
    { id: 'vintage', label: 'Vintage', desc: 'Nostaljik dokunuşlar, 70ler-90lar.' },
    { id: 'classic', label: 'Klasik', desc: 'Zamansız parçalar, geleneksel şıklık.' },
    { id: 'sporty', label: 'Sportif Şık', desc: 'Lüks kumaşlarla spor giyim rahatlığı.' },
    { id: 'gothic', label: 'Gotik', desc: 'Koyu renkler, deri ve metal detaylar.' },
    { id: 'preppy', label: 'Kolej', desc: 'Düzenli, temiz çizgiler, polo yakalar.' },
    { id: 'avantgarde', label: 'Avant-garde', desc: 'Deneysel ve sanatsal tasarımlar.' },
];
export const APP_THEMES = [
    { id: 'light', label: 'Lova Nude', color: '#FFF7F0', type: 'light' },
    { id: 'dark', label: 'Midnight', color: '#0C0C0C', type: 'dark' },
    { id: 'romantic', label: 'Romantik Pembe', color: '#FFF0F5', type: 'light' },
    { id: 'nardo', label: 'Nardo Gri', color: '#6E7176', type: 'dark' },
    { id: 'ocean', label: 'Okyanus', color: '#F0F9FF', type: 'light' },
];
export const WARDROBE_CATEGORIES = [
    { id: 'ust', label: 'Üst', placeholder: 'Örn: Beyaz T-Shirt' },
    { id: 'alt', label: 'Alt', placeholder: 'Örn: Jean Pantolon' },
    { id: 'elbise', label: 'Elbise', placeholder: 'Örn: Midi Elbise' },
    { id: 'dis', label: 'Dış Giyim', placeholder: 'Örn: Trençkot' },
    { id: 'ayakkabi', label: 'Ayakkabı', placeholder: 'Örn: Sneaker' },
    { id: 'aksesuar', label: 'Aksesuar', placeholder: 'Örn: Kolye' },
];
// Mock Data for "AI" Logic
export const MOCK_TIPS = [
    {
        title: "Doku Oyunu",
        desc: "Kombinine ipek, yün veya deri gibi zıt dokular ekle.",
        icon: Palette
    },
    {
        title: "Aksesuar Detayı",
        desc: "Seçtiğin tarza uygun bir statement küpe kullan.",
        icon: Tag
    },
    {
        title: "Saç ve Makyaj",
        desc: "Saç ve makyajını, kombinin ruhuna uygun sade tut.",
        icon: Scissors
    }
];
