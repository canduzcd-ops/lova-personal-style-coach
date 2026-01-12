import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useRef } from 'react';
import { outfitHistoryService } from '../services/outfitHistoryService';
import { Button } from '../components/Shared';
import { X, ThumbsUp, ThumbsDown, Clock, Share2, Heart } from 'lucide-react';
import { InlineLoader } from '../components/InlineLoader';
import { StateCard } from '../components/StateCard';
import { Toast } from '../components/Toast';
import { OutfitShareCard } from '../components/OutfitShareCard';
import { toPng } from 'html-to-image';
export const OutfitHistoryScreen = ({ user, onClose, onGenerateOutfit, onOpenWardrobe }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [filterLiked, setFilterLiked] = useState(false);
    const [filterCollection, setFilterCollection] = useState('all');
    const [shareEntry, setShareEntry] = useState(null);
    const shareCardRef = useRef(null);
    const loadHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await outfitHistoryService.listOutfits(user.id);
            setItems(res);
        }
        catch (e) {
            console.error(e);
            setError(e?.message || 'Kayıtlar yüklenemedi');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadHistory();
    }, [user.id]);
    const handleFeedback = async (entry, liked) => {
        try {
            await outfitHistoryService.setFeedback(entry.id, user.id, liked);
            setItems((prev) => prev.map((item) => item.id === entry.id ? { ...item, liked, feedbackAt: new Date().toISOString() } : item));
        }
        catch (e) {
            console.error(e);
            setToast({ type: 'error', title: 'Kaydedilemedi', desc: e?.message || 'Geri bildirim kaydedilemedi' });
        }
    };
    const handleFavorite = async (entry, isFavorite) => {
        try {
            await outfitHistoryService.setFavorite(entry.id, user.id, isFavorite);
            setItems((prev) => prev.map((item) => item.id === entry.id ? { ...item, isFavorite } : item));
        }
        catch (e) {
            console.error(e);
            setToast({ type: 'error', title: 'Kaydedilemedi', desc: e?.message || 'Favori kaydedilemedi' });
        }
    };
    const handleCollectionTag = async (entry, tag) => {
        try {
            await outfitHistoryService.setCollectionTag(entry.id, user.id, tag);
            setItems((prev) => prev.map((item) => item.id === entry.id ? { ...item, collectionTag: tag } : item));
        }
        catch (e) {
            console.error(e);
            setToast({ type: 'error', title: 'Kaydedilemedi', desc: e?.message || 'Koleksiyon etiketi kaydedilemedi' });
        }
    };
    const handleShare = async (entry) => {
        try {
            setShareEntry(entry);
            // Wait for card to render
            setTimeout(async () => {
                if (shareCardRef.current) {
                    const image = await toPng(shareCardRef.current, { width: 400, height: 600, pixelRatio: 2 });
                    // Check if native sharing is available
                    if (navigator.share && navigator.canShare({ files: [new File([image], 'outfit.png')] })) {
                        // Mobile native share
                        const blob = await fetch(image).then(res => res.blob());
                        const file = new File([blob], 'outfit.png', { type: 'image/png' });
                        await navigator.share({ files: [file], title: 'LOVA Kombini' });
                    }
                    else {
                        // Fallback: download image
                        const link = document.createElement('a');
                        link.href = image;
                        link.download = `outfit-${entry.id}.png`;
                        link.click();
                        setToast({ type: 'success', title: 'İndirildi', desc: 'Kombin görseli kaydedildi' });
                    }
                }
                setShareEntry(null);
            }, 100);
        }
        catch (e) {
            console.error(e);
            setToast({ type: 'error', title: 'Paylaşılamadı', desc: e?.message || 'Paylaşım başarısız' });
            setShareEntry(null);
        }
    };
    const displayItems = items.filter((item) => {
        const likeFilter = filterLiked ? item.liked === true : true;
        const collectionFilter = filterCollection === 'all' ? true : item.collectionTag === filterCollection;
        return likeFilter && collectionFilter;
    });
    return (_jsxs("div", { className: "fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex flex-col", children: [_jsxs("div", { className: "relative flex-1 bg-page dark:bg-page-dark overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-page/60 to-page dark:from-page-dark/60 dark:to-page-dark" }), _jsxs("div", { className: "relative z-10 h-full flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-5", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl bg-surface dark:bg-surface-dark flex items-center justify-center", children: _jsx(Clock, { size: 18 }) }), _jsxs("div", { children: [_jsx("p", { className: "text-[10px] uppercase tracking-[0.25em] text-secondary", children: "Ar\u015Fiv" }), _jsx("h2", { className: "text-xl font-serif font-bold text-primary dark:text-primary-dark", children: "Kombin Ge\u00E7mi\u015Fi" })] })] }), _jsx("button", { onClick: onClose, className: "w-10 h-10 rounded-full bg-surface dark:bg-surface-dark flex items-center justify-center hover:bg-border dark:hover:bg-border-dark", children: _jsx(X, { size: 18 }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto px-5 pb-6 space-y-4", children: [loading && _jsx(InlineLoader, { label: "Kay\u0131tlar y\u00FCkleniyor..." }), error && !loading && (_jsx(StateCard, { type: "error", title: "Ge\u00E7mi\u015F y\u00FCklenemedi", desc: error, onAction: loadHistory, actionLabel: "Tekrar dene" })), !loading && !items.length && !error && (_jsx(StateCard, { type: "empty", title: "Hen\u00FCz kay\u0131t yok", desc: "\u00DCretti\u011Fin kombinler burada listelenir.", actionLabel: "Kombin \u00FCret", onAction: onGenerateOutfit })), items.length > 0 && (_jsxs("div", { className: "space-y-3 pb-3 sticky top-0 bg-page dark:bg-page-dark z-20", children: [_jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => setFilterLiked(false), className: `flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${!filterLiked
                                                            ? 'bg-primary text-white shadow-md'
                                                            : 'bg-surface dark:bg-surface-dark text-secondary dark:text-secondary-dark border border-border dark:border-border-dark'}`, children: ["Hepsi (", items.length, ")"] }), _jsxs("button", { onClick: () => setFilterLiked(true), className: `flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterLiked
                                                            ? 'bg-accent text-white shadow-md'
                                                            : 'bg-surface dark:bg-surface-dark text-secondary dark:text-secondary-dark border border-border dark:border-border-dark'}`, children: ["\u2764\uFE0F Favoriler (", items.filter((i) => i.isFavorite === true).length, ")"] })] }), _jsxs("div", { className: "flex gap-2 flex-wrap", children: [_jsx("button", { onClick: () => setFilterCollection('all'), className: `px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterCollection === 'all'
                                                            ? 'bg-primary text-white shadow-md'
                                                            : 'bg-surface dark:bg-surface-dark text-secondary dark:text-secondary-dark border border-border dark:border-border-dark'}`, children: "T\u00FCm\u00FC" }), _jsxs("button", { onClick: () => setFilterCollection('work'), className: `px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterCollection === 'work'
                                                            ? 'bg-primary text-white shadow-md'
                                                            : 'bg-surface dark:bg-surface-dark text-secondary dark:text-secondary-dark border border-border dark:border-border-dark'}`, children: ["\uD83D\uDCBC \u0130\u015F (", items.filter((i) => i.collectionTag === 'work').length, ")"] }), _jsxs("button", { onClick: () => setFilterCollection('weekend'), className: `px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterCollection === 'weekend'
                                                            ? 'bg-primary text-white shadow-md'
                                                            : 'bg-surface dark:bg-surface-dark text-secondary dark:text-secondary-dark border border-border dark:border-border-dark'}`, children: ["\uD83C\uDF89 Weekend (", items.filter((i) => i.collectionTag === 'weekend').length, ")"] }), _jsxs("button", { onClick: () => setFilterCollection('date'), className: `px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterCollection === 'date'
                                                            ? 'bg-primary text-white shadow-md'
                                                            : 'bg-surface dark:bg-surface-dark text-secondary dark:text-secondary-dark border border-border dark:border-border-dark'}`, children: ["\uD83D\uDC95 Randevu (", items.filter((i) => i.collectionTag === 'date').length, ")"] })] })] })), displayItems.map((entry) => {
                                        const title = entry.outfit?.outfit?.title || 'Kombin';
                                        const desc = entry.outfit?.outfit?.desc;
                                        const created = entry.createdAt
                                            ? new Date(entry.createdAt)
                                            : new Date();
                                        const timeStr = created.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                                        const dateStr = created.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                                        // Extract style and color tags
                                        const styles = new Set();
                                        const colors = new Set();
                                        entry.outfit?.outfit?.items?.forEach((item) => {
                                            item.styles?.forEach((s) => styles.add(s));
                                            if (item.color)
                                                colors.add(item.color);
                                        });
                                        return (_jsx("div", { className: "bg-surface dark:bg-surface-dark rounded-2xl p-4 border border-border/40 dark:border-border-dark/60 shadow-sm hover:shadow-md transition-shadow", children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("p", { className: "text-[10px] uppercase tracking-[0.3em] text-secondary/70 font-semibold", children: [dateStr, " \u2022 ", timeStr] }), _jsx("h3", { className: "text-base font-serif font-bold text-primary dark:text-primary-dark", children: title })] }), _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: () => handleShare(entry), className: "w-8 h-8 rounded-full flex items-center justify-center border border-border/50 dark:border-border-dark/50 text-primary dark:text-primary-dark hover:bg-surface/80 hover:border-border transition-all", title: "Payla\u015F", children: _jsx(Share2, { size: 14 }) }), _jsx("button", { onClick: () => handleFavorite(entry, !entry.isFavorite), className: `w-8 h-8 rounded-full flex items-center justify-center border transition-all ${entry.isFavorite
                                                                            ? 'bg-accent text-white border-accent scale-110 shadow-md'
                                                                            : 'border-border/50 dark:border-border-dark/50 text-primary dark:text-primary-dark hover:bg-surface/80 hover:border-border'}`, title: "Favori", children: _jsx(Heart, { size: 14, fill: entry.isFavorite ? 'currentColor' : 'none' }) }), _jsx("button", { onClick: () => handleFeedback(entry, true), className: `w-8 h-8 rounded-full flex items-center justify-center border transition-all ${entry.liked === true
                                                                            ? 'bg-accent text-white border-accent scale-110 shadow-md'
                                                                            : 'border-border/50 dark:border-border-dark/50 text-primary dark:text-primary-dark hover:bg-surface/80 hover:border-border'}`, title: "Be\u011Fendim", children: _jsx(ThumbsUp, { size: 14 }) }), _jsx("button", { onClick: () => handleFeedback(entry, false), className: `w-8 h-8 rounded-full flex items-center justify-center border transition-all ${entry.liked === false
                                                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 border-red-300 dark:border-red-600 scale-110 shadow-md'
                                                                            : 'border-border/50 dark:border-border-dark/50 text-primary dark:text-primary-dark hover:bg-surface/80 hover:border-border'}`, title: "Be\u011Fenmedim", children: _jsx(ThumbsDown, { size: 14 }) })] })] }), (styles.size > 0 || colors.size > 0) && (_jsxs("div", { className: "flex flex-wrap gap-2", children: [Array.from(styles)
                                                                .slice(0, 2)
                                                                .map((style) => (_jsx("span", { className: "px-2 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-dark text-[10px] font-semibold rounded-md", children: style }, style))), Array.from(colors)
                                                                .slice(0, 2)
                                                                .map((color) => (_jsx("span", { className: "px-2 py-1 bg-surface-dark/30 dark:bg-surface/30 text-secondary dark:text-secondary-dark text-[10px] font-semibold rounded-md", children: color }, color)))] })), _jsxs("div", { className: "flex gap-2 flex-wrap", children: [_jsx("button", { onClick: () => handleCollectionTag(entry, entry.collectionTag === 'work' ? null : 'work'), className: `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${entry.collectionTag === 'work'
                                                                    ? 'bg-primary text-white shadow-md'
                                                                    : 'bg-surface/60 dark:bg-surface-dark/60 border border-border/40 dark:border-border-dark/40 text-secondary dark:text-secondary-dark hover:bg-surface hover:dark:bg-surface-dark'}`, children: "\uD83D\uDCBC \u0130\u015F" }), _jsx("button", { onClick: () => handleCollectionTag(entry, entry.collectionTag === 'weekend' ? null : 'weekend'), className: `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${entry.collectionTag === 'weekend'
                                                                    ? 'bg-primary text-white shadow-md'
                                                                    : 'bg-surface/60 dark:bg-surface-dark/60 border border-border/40 dark:border-border-dark/40 text-secondary dark:text-secondary-dark hover:bg-surface hover:dark:bg-surface-dark'}`, children: "\uD83C\uDF89 Weekend" }), _jsx("button", { onClick: () => handleCollectionTag(entry, entry.collectionTag === 'date' ? null : 'date'), className: `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${entry.collectionTag === 'date'
                                                                    ? 'bg-primary text-white shadow-md'
                                                                    : 'bg-surface/60 dark:bg-surface-dark/60 border border-border/40 dark:border-border-dark/40 text-secondary dark:text-secondary-dark hover:bg-surface hover:dark:bg-surface-dark'}`, children: "\uD83D\uDC95 Randevu" })] }), entry.liked === false && (_jsx("div", { className: "bg-red-50/60 dark:bg-red-900/15 rounded-lg p-3 border border-red-200/40 dark:border-red-900/30", children: _jsx("p", { className: "text-xs text-red-700 dark:text-red-200 leading-relaxed", children: "\uD83D\uDCA1 Kombinim daha ho\u015F olsun diye daha fazla par\u00E7a ekleyebilirsin veya rengini de\u011Fi\u015Ftirebilirsin." }) })), desc && (_jsx("p", { className: "text-sm text-secondary dark:text-secondary-dark leading-relaxed italic", children: desc }))] }) }, entry.id));
                                    })] }), _jsxs("div", { className: "p-5 bg-gradient-to-t from-page/90 via-page/60 to-transparent dark:from-page-dark/90 dark:via-page-dark/60 space-y-3", children: [!items.length && !loading && !error && (_jsxs("div", { className: "space-y-2", children: [_jsx(Button, { onClick: onGenerateOutfit, className: "w-full !py-3 !px-4", children: "\u2728 Kombin \u00DCret" }), _jsx(Button, { onClick: onOpenWardrobe, variant: "secondary", className: "w-full !py-3 !px-4", children: "\uD83D\uDC55 Dolab\u0131na Par\u00E7a Ekle" })] })), _jsx(Button, { onClick: onClose, className: "w-full", children: "Kapat" })] })] })] }), toast && (_jsx(Toast, { type: toast.type, title: toast.title, desc: toast.desc, onClose: () => setToast(null) })), shareEntry && (_jsx("div", { className: "fixed -top-[9999px] left-0", children: _jsx(OutfitShareCard, { ref: shareCardRef, entry: shareEntry }) }))] }));
};
