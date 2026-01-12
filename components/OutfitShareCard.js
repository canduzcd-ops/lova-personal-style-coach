import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from 'react';
export const OutfitShareCard = forwardRef(({ entry }, ref) => {
    const title = entry.outfit?.outfit?.title || 'Kombin';
    const desc = entry.outfit?.outfit?.desc;
    const created = entry.createdAt ? new Date(entry.createdAt) : new Date();
    const timeStr = created.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = created.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    // Extract styles and colors
    const styles = new Set();
    const colors = new Set();
    entry.outfit?.outfit?.items?.forEach((item) => {
        item.styles?.forEach((s) => styles.add(s));
        if (item.color)
            colors.add(item.color);
    });
    return (_jsxs("div", { ref: ref, className: "w-[400px] bg-gradient-to-br from-surface via-page to-surface-dark dark:from-surface-dark dark:via-page-dark dark:to-surface rounded-3xl p-8 shadow-2xl", style: {
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.05) 100%)',
        }, children: [_jsxs("div", { className: "space-y-2 mb-6", children: [_jsxs("p", { className: "text-xs uppercase tracking-widest text-secondary/60 font-semibold", children: ["LOVA KOMBINI \u2022 ", dateStr] }), _jsx("h2", { className: "text-2xl font-serif font-bold text-primary dark:text-primary-dark", children: title })] }), (styles.size > 0 || colors.size > 0) && (_jsxs("div", { className: "flex flex-wrap gap-2 mb-6", children: [Array.from(styles)
                        .slice(0, 3)
                        .map((style) => (_jsx("span", { className: "px-3 py-1 bg-primary/15 dark:bg-primary/25 text-primary dark:text-primary-dark text-xs font-semibold rounded-full", children: style }, style))), Array.from(colors)
                        .slice(0, 2)
                        .map((color) => (_jsx("span", { className: "px-3 py-1 bg-secondary/15 dark:bg-secondary/25 text-secondary dark:text-secondary-dark text-xs font-semibold rounded-full", children: color }, color)))] })), desc && (_jsxs("p", { className: "text-sm text-secondary dark:text-secondary-dark leading-relaxed mb-6 italic", children: ["\"", desc, "\""] })), entry.outfit?.outfit?.items && entry.outfit.outfit.items.length > 0 && (_jsxs("div", { className: "mb-6 space-y-2 border-t border-border/30 dark:border-border-dark/30 pt-4", children: [_jsx("p", { className: "text-xs uppercase tracking-widest text-secondary/60 font-semibold", children: "Par\u00E7alar" }), _jsx("div", { className: "space-y-1", children: entry.outfit.outfit.items.slice(0, 5).map((item, idx) => (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx("span", { className: "text-primary dark:text-primary-dark", children: "\u2022" }), _jsxs("span", { className: "text-secondary dark:text-secondary-dark", children: [item.name, " ", item.color && `(${item.color})`] })] }, idx))) })] })), _jsxs("div", { className: "border-t border-border/30 dark:border-border-dark/30 pt-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [entry.isFavorite && _jsx("span", { className: "text-lg", children: "\u2764\uFE0F" }), entry.collectionTag && (_jsxs("span", { className: "text-xs px-2 py-1 bg-accent/15 text-accent rounded-full font-semibold", children: [entry.collectionTag === 'work' && '💼 İş', entry.collectionTag === 'weekend' && '🎉 Weekend', entry.collectionTag === 'date' && '💕 Randevu'] }))] }), _jsx("p", { className: "text-xs text-secondary/50 dark:text-secondary-dark/50", children: "Powered by LOVA" })] })] }));
});
OutfitShareCard.displayName = 'OutfitShareCard';
