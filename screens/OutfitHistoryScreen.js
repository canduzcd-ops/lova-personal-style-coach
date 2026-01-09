import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { outfitHistoryService } from '../services/outfitHistoryService';
import { Button } from '../components/Shared';
import { X, ThumbsUp, ThumbsDown, Clock, CloudSun } from 'lucide-react';
export const OutfitHistoryScreen = ({ user, onClose }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        (async () => {
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
        })();
    }, [user.id]);
    const handleFeedback = async (entry, liked) => {
        try {
            await outfitHistoryService.setFeedback(entry.id, user.id, liked);
            setItems((prev) => prev.map((item) => item.id === entry.id ? { ...item, liked, feedbackAt: new Date().toISOString() } : item));
        }
        catch (e) {
            console.error(e);
            alert(e?.message || 'Geri bildirim kaydedilemedi');
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex flex-col", children: _jsxs("div", { className: "relative flex-1 bg-page dark:bg-page-dark overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-page/60 to-page dark:from-page-dark/60 dark:to-page-dark" }), _jsxs("div", { className: "relative z-10 h-full flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-5", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl bg-surface dark:bg-surface-dark flex items-center justify-center", children: _jsx(Clock, { size: 18 }) }), _jsxs("div", { children: [_jsx("p", { className: "text-[10px] uppercase tracking-[0.25em] text-secondary", children: "Ar\u015Fiv" }), _jsx("h2", { className: "text-xl font-serif font-bold text-primary dark:text-primary-dark", children: "Kombin Ge\u00E7mi\u015Fi" })] })] }), _jsx("button", { onClick: onClose, className: "w-10 h-10 rounded-full bg-surface dark:bg-surface-dark flex items-center justify-center hover:bg-border dark:hover:bg-border-dark", children: _jsx(X, { size: 18 }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto px-5 pb-6 space-y-4", children: [loading && (_jsx("div", { className: "text-sm text-secondary", children: "Y\u00FCkleniyor..." })), error && (_jsx("div", { className: "text-sm text-red-500", children: error })), !loading && !items.length && !error && (_jsx("div", { className: "text-sm text-secondary", children: "Hen\u00FCz kay\u0131t yok." })), items.map((entry) => {
                                    const title = entry.outfit?.outfit?.title || 'Kombin';
                                    const desc = entry.outfit?.outfit?.desc;
                                    const created = entry.createdAt
                                        ? new Date(entry.createdAt).toLocaleString()
                                        : '—';
                                    const detail = entry.outfit?.outfit?.items?.[0]?.styles?.join(', ')
                                        || entry.outfit?.outfit?.items?.[0]?.type
                                        || entry.weather?.summary;
                                    return (_jsx("div", { className: "bg-surface dark:bg-surface-dark rounded-2xl p-4 border border-border/40 dark:border-border-dark/60 shadow-sm", children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("p", { className: "text-[10px] uppercase tracking-[0.3em] text-secondary flex items-center gap-1", children: [_jsx(Clock, { size: 12 }), " ", created] }), _jsx("h3", { className: "text-lg font-serif font-bold text-primary dark:text-primary-dark", children: title }), desc && _jsx("p", { className: "text-sm text-secondary dark:text-secondary-dark leading-relaxed", children: desc }), detail && (_jsxs("p", { className: "text-xs text-secondary/80 flex items-center gap-1", children: [_jsx(CloudSun, { size: 12 }), " ", detail] }))] }), _jsxs("div", { className: "flex flex-col gap-2", children: [_jsx("button", { onClick: () => handleFeedback(entry, true), className: `w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${entry.liked === true
                                                                ? 'bg-accent text-white border-accent'
                                                                : 'border-border dark:border-border-dark text-primary dark:text-primary-dark hover:bg-surface/60'}`, "aria-label": "Be\u011Fendim", children: _jsx(ThumbsUp, { size: 16 }) }), _jsx("button", { onClick: () => handleFeedback(entry, false), className: `w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${entry.liked === false
                                                                ? 'bg-red-100 text-red-600 border-red-200'
                                                                : 'border-border dark:border-border-dark text-primary dark:text-primary-dark hover:bg-surface/60'}`, "aria-label": "Be\u011Fenmedim", children: _jsx(ThumbsDown, { size: 16 }) })] })] }) }, entry.id));
                                })] }), _jsx("div", { className: "p-5 bg-gradient-to-t from-page/90 via-page/60 to-transparent dark:from-page-dark/90 dark:via-page-dark/60", children: _jsx(Button, { onClick: onClose, className: "w-full", children: "Kapat" }) })] })] }) }));
};
