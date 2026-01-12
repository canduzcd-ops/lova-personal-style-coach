import React, { forwardRef } from 'react';
import { OutfitHistoryEntry } from '../types';

interface Props {
  entry: OutfitHistoryEntry;
}

export const OutfitShareCard = forwardRef<HTMLDivElement, Props>(({ entry }, ref) => {
  const title = entry.outfit?.outfit?.title || 'Kombin';
  const desc = entry.outfit?.outfit?.desc;
  const created = entry.createdAt ? new Date(entry.createdAt) : new Date();
  const timeStr = created.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = created.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

  // Extract styles and colors
  const styles = new Set<string>();
  const colors = new Set<string>();
  entry.outfit?.outfit?.items?.forEach((item: any) => {
    item.styles?.forEach((s: string) => styles.add(s));
    if (item.color) colors.add(item.color);
  });

  return (
    <div
      ref={ref}
      className="w-[400px] bg-gradient-to-br from-surface via-page to-surface-dark dark:from-surface-dark dark:via-page-dark dark:to-surface rounded-3xl p-8 shadow-2xl"
      style={{
        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.05) 100%)',
      }}
    >
      {/* Header */}
      <div className="space-y-2 mb-6">
        <p className="text-xs uppercase tracking-widest text-secondary/60 font-semibold">
          LOVA KOMBINI • {dateStr}
        </p>
        <h2 className="text-2xl font-serif font-bold text-primary dark:text-primary-dark">
          {title}
        </h2>
      </div>

      {/* Tags */}
      {(styles.size > 0 || colors.size > 0) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {Array.from(styles)
            .slice(0, 3)
            .map((style) => (
              <span
                key={style}
                className="px-3 py-1 bg-primary/15 dark:bg-primary/25 text-primary dark:text-primary-dark text-xs font-semibold rounded-full"
              >
                {style}
              </span>
            ))}
          {Array.from(colors)
            .slice(0, 2)
            .map((color) => (
              <span
                key={color}
                className="px-3 py-1 bg-secondary/15 dark:bg-secondary/25 text-secondary dark:text-secondary-dark text-xs font-semibold rounded-full"
              >
                {color}
              </span>
            ))}
        </div>
      )}

      {/* Description */}
      {desc && (
        <p className="text-sm text-secondary dark:text-secondary-dark leading-relaxed mb-6 italic">
          "{desc}"
        </p>
      )}

      {/* Items Grid */}
      {entry.outfit?.outfit?.items && entry.outfit.outfit.items.length > 0 && (
        <div className="mb-6 space-y-2 border-t border-border/30 dark:border-border-dark/30 pt-4">
          <p className="text-xs uppercase tracking-widest text-secondary/60 font-semibold">Parçalar</p>
          <div className="space-y-1">
            {entry.outfit.outfit.items.slice(0, 5).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <span className="text-primary dark:text-primary-dark">•</span>
                <span className="text-secondary dark:text-secondary-dark">
                  {item.name} {item.color && `(${item.color})`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border/30 dark:border-border-dark/30 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {entry.isFavorite && <span className="text-lg">❤️</span>}
          {entry.collectionTag && (
            <span className="text-xs px-2 py-1 bg-accent/15 text-accent rounded-full font-semibold">
              {entry.collectionTag === 'work' && '💼 İş'}
              {entry.collectionTag === 'weekend' && '🎉 Weekend'}
              {entry.collectionTag === 'date' && '💕 Randevu'}
            </span>
          )}
        </div>
        <p className="text-xs text-secondary/50 dark:text-secondary-dark/50">Powered by LOVA</p>
      </div>
    </div>
  );
});

OutfitShareCard.displayName = 'OutfitShareCard';
