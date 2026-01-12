import React, { useEffect, useState, useRef } from 'react';
import { OutfitHistoryEntry, UserProfile } from '../types';
import { outfitHistoryService } from '../services/outfitHistoryService';
import { Button } from '../components/Shared';
import { X, ThumbsUp, ThumbsDown, Clock, Share2, Heart } from 'lucide-react';
import { InlineLoader } from '../components/InlineLoader';
import { StateCard } from '../components/StateCard';
import { Toast, ToastType } from '../components/Toast';
import { OutfitShareCard } from '../components/OutfitShareCard';
import { toPng } from 'html-to-image';

interface Props {
  user: UserProfile;
  onClose: () => void;
  onGenerateOutfit?: () => void;
  onOpenWardrobe?: () => void;
}

export const OutfitHistoryScreen: React.FC<Props> = ({ user, onClose, onGenerateOutfit, onOpenWardrobe }) => {
  const [items, setItems] = useState<OutfitHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: ToastType; title: string; desc?: string } | null>(null);
  const [filterLiked, setFilterLiked] = useState(false);
  const [filterCollection, setFilterCollection] = useState<'all' | 'work' | 'weekend' | 'date'>('all');
  const [shareEntry, setShareEntry] = useState<OutfitHistoryEntry | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await outfitHistoryService.listOutfits(user.id);
      setItems(res);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Kayıtlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user.id]);

  const handleFeedback = async (entry: OutfitHistoryEntry, liked: boolean) => {
    try {
      await outfitHistoryService.setFeedback(entry.id, user.id, liked);
      setItems((prev) =>
        prev.map((item) =>
          item.id === entry.id ? { ...item, liked, feedbackAt: new Date().toISOString() } : item
        )
      );
    } catch (e: any) {
      console.error(e);
      setToast({ type: 'error', title: 'Kaydedilemedi', desc: e?.message || 'Geri bildirim kaydedilemedi' });
    }
  };

  const handleFavorite = async (entry: OutfitHistoryEntry, isFavorite: boolean) => {
    try {
      await outfitHistoryService.setFavorite(entry.id, user.id, isFavorite);
      setItems((prev) =>
        prev.map((item) =>
          item.id === entry.id ? { ...item, isFavorite } : item
        )
      );
    } catch (e: any) {
      console.error(e);
      setToast({ type: 'error', title: 'Kaydedilemedi', desc: e?.message || 'Favori kaydedilemedi' });
    }
  };

  const handleCollectionTag = async (entry: OutfitHistoryEntry, tag: 'work' | 'weekend' | 'date' | null) => {
    try {
      await outfitHistoryService.setCollectionTag(entry.id, user.id, tag);
      setItems((prev) =>
        prev.map((item) =>
          item.id === entry.id ? { ...item, collectionTag: tag } : item
        )
      );
    } catch (e: any) {
      console.error(e);
      setToast({ type: 'error', title: 'Kaydedilemedi', desc: e?.message || 'Koleksiyon etiketi kaydedilemedi' });
    }
  };

  const handleShare = async (entry: OutfitHistoryEntry) => {
    try {
      setShareEntry(entry);
      // Wait for card to render
      setTimeout(async () => {
        if (shareCardRef.current) {
          const image = await toPng(shareCardRef.current, { width: 400, height: 600, pixelRatio: 2 });
          
          // Check if native sharing is available
          if ((navigator as any).share && (navigator as any).canShare({ files: [new File([image], 'outfit.png')] })) {
            // Mobile native share
            const blob = await fetch(image).then(res => res.blob());
            const file = new File([blob], 'outfit.png', { type: 'image/png' });
            await (navigator as any).share({ files: [file], title: 'LOVA Kombini' });
          } else {
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
    } catch (e: any) {
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

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex flex-col">
      <div className="relative flex-1 bg-page dark:bg-page-dark overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-page/60 to-page dark:from-page-dark/60 dark:to-page-dark" />
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-surface dark:bg-surface-dark flex items-center justify-center">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-secondary">Arşiv</p>
                <h2 className="text-xl font-serif font-bold text-primary dark:text-primary-dark">Kombin Geçmişi</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-surface dark:bg-surface-dark flex items-center justify-center hover:bg-border dark:hover:bg-border-dark"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
            {loading && <InlineLoader label="Kayıtlar yükleniyor..." />}
            {error && !loading && (
              <StateCard type="error" title="Geçmiş yüklenemedi" desc={error} onAction={loadHistory} actionLabel="Tekrar dene" />
            )}
            {!loading && !items.length && !error && (
              <StateCard type="empty" title="Henüz kayıt yok" desc="Ürettiğin kombinler burada listelenir." 
                actionLabel="Kombin üret" onAction={onGenerateOutfit} />
            )}

            {items.length > 0 && (
              <div className="space-y-3 pb-3 sticky top-0 bg-page dark:bg-page-dark z-20">
                {/* Like Filter */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterLiked(false)}
                    className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      !filterLiked
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-surface dark:bg-surface-dark text-secondary dark:text-secondary-dark border border-border dark:border-border-dark'
                    }`}
                  >
                    Hepsi ({items.length})
                  </button>
                  <button
                    onClick={() => setFilterLiked(true)}
                    className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      filterLiked
                        ? 'bg-accent text-white shadow-md'
                        : 'bg-surface dark:bg-surface-dark text-secondary dark:text-secondary-dark border border-border dark:border-border-dark'
                    }`}
                  >
                    ❤️ Favoriler ({items.filter((i) => i.isFavorite === true).length})
                  </button>
                </div>

                {/* Collection Filter */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFilterCollection('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      filterCollection === 'all'
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-surface dark:bg-surface-dark text-secondary dark:text-secondary-dark border border-border dark:border-border-dark'
                    }`}
                  >
                    Tümü
                  </button>
                  <button
                    onClick={() => setFilterCollection('work')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      filterCollection === 'work'
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-surface dark:bg-surface-dark text-secondary dark:text-secondary-dark border border-border dark:border-border-dark'
                    }`}
                  >
                    💼 İş ({items.filter((i) => i.collectionTag === 'work').length})
                  </button>
                  <button
                    onClick={() => setFilterCollection('weekend')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      filterCollection === 'weekend'
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-surface dark:bg-surface-dark text-secondary dark:text-secondary-dark border border-border dark:border-border-dark'
                    }`}
                  >
                    🎉 Weekend ({items.filter((i) => i.collectionTag === 'weekend').length})
                  </button>
                  <button
                    onClick={() => setFilterCollection('date')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      filterCollection === 'date'
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-surface dark:bg-surface-dark text-secondary dark:text-secondary-dark border border-border dark:border-border-dark'
                    }`}
                  >
                    💕 Randevu ({items.filter((i) => i.collectionTag === 'date').length})
                  </button>
                </div>
              </div>
            )}

            {displayItems.map((entry) => {
              const title = entry.outfit?.outfit?.title || 'Kombin';
              const desc = entry.outfit?.outfit?.desc;
              const created = entry.createdAt
                ? new Date(entry.createdAt)
                : new Date();
              const timeStr = created.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
              const dateStr = created.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
              
              // Extract style and color tags
              const styles = new Set<string>();
              const colors = new Set<string>();
              entry.outfit?.outfit?.items?.forEach((item: any) => {
                item.styles?.forEach((s: string) => styles.add(s));
                if (item.color) colors.add(item.color);
              });

              return (
                <div
                  key={entry.id}
                  className="bg-surface dark:bg-surface-dark rounded-2xl p-4 border border-border/40 dark:border-border-dark/60 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-secondary/70 font-semibold">
                        {dateStr} • {timeStr}
                      </p>
                      <h3 className="text-base font-serif font-bold text-primary dark:text-primary-dark">{title}</h3>
                    </div>
                    <div className="flex gap-1">
                      {/* Share Button */}
                      <button
                        onClick={() => handleShare(entry)}
                        className="w-8 h-8 rounded-full flex items-center justify-center border border-border/50 dark:border-border-dark/50 text-primary dark:text-primary-dark hover:bg-surface/80 hover:border-border transition-all"
                        title="Paylaş"
                      >
                        <Share2 size={14} />
                      </button>

                      {/* Favorite Button */}
                      <button
                        onClick={() => handleFavorite(entry, !entry.isFavorite)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                          entry.isFavorite
                            ? 'bg-accent text-white border-accent scale-110 shadow-md'
                            : 'border-border/50 dark:border-border-dark/50 text-primary dark:text-primary-dark hover:bg-surface/80 hover:border-border'
                        }`}
                        title="Favori"
                      >
                        <Heart size={14} fill={entry.isFavorite ? 'currentColor' : 'none'} />
                      </button>

                      {/* Like Button */}
                      <button
                        onClick={() => handleFeedback(entry, true)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                          entry.liked === true
                            ? 'bg-accent text-white border-accent scale-110 shadow-md'
                            : 'border-border/50 dark:border-border-dark/50 text-primary dark:text-primary-dark hover:bg-surface/80 hover:border-border'
                        }`}
                        title="Beğendim"
                      >
                        <ThumbsUp size={14} />
                      </button>
                      <button
                        onClick={() => handleFeedback(entry, false)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                          entry.liked === false
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 border-red-300 dark:border-red-600 scale-110 shadow-md'
                            : 'border-border/50 dark:border-border-dark/50 text-primary dark:text-primary-dark hover:bg-surface/80 hover:border-border'
                        }`}
                        title="Beğenmedim"
                      >
                        <ThumbsDown size={14} />
                      </button>
                    </div>
                  </div>

                    {/* Tags: Styles & Colors */}
                    {(styles.size > 0 || colors.size > 0) && (
                      <div className="flex flex-wrap gap-2">
                        {Array.from(styles)
                          .slice(0, 2)
                          .map((style) => (
                            <span key={style} className="px-2 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-dark text-[10px] font-semibold rounded-md">
                              {style}
                            </span>
                          ))}
                        {Array.from(colors)
                          .slice(0, 2)
                          .map((color) => (
                            <span key={color} className="px-2 py-1 bg-surface-dark/30 dark:bg-surface/30 text-secondary dark:text-secondary-dark text-[10px] font-semibold rounded-md">
                              {color}
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Collection Tag Selector */}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleCollectionTag(entry, entry.collectionTag === 'work' ? null : 'work')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          entry.collectionTag === 'work'
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-surface/60 dark:bg-surface-dark/60 border border-border/40 dark:border-border-dark/40 text-secondary dark:text-secondary-dark hover:bg-surface hover:dark:bg-surface-dark'
                        }`}
                      >
                        💼 İş
                      </button>
                      <button
                        onClick={() => handleCollectionTag(entry, entry.collectionTag === 'weekend' ? null : 'weekend')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          entry.collectionTag === 'weekend'
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-surface/60 dark:bg-surface-dark/60 border border-border/40 dark:border-border-dark/40 text-secondary dark:text-secondary-dark hover:bg-surface hover:dark:bg-surface-dark'
                        }`}
                      >
                        🎉 Weekend
                      </button>
                      <button
                        onClick={() => handleCollectionTag(entry, entry.collectionTag === 'date' ? null : 'date')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          entry.collectionTag === 'date'
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-surface/60 dark:bg-surface-dark/60 border border-border/40 dark:border-border-dark/40 text-secondary dark:text-secondary-dark hover:bg-surface hover:dark:bg-surface-dark'
                        }`}
                      >
                        💕 Randevu
                      </button>
                    </div>

                    {/* Dislike Tip */}
                    {entry.liked === false && (
                      <div className="bg-red-50/60 dark:bg-red-900/15 rounded-lg p-3 border border-red-200/40 dark:border-red-900/30">
                        <p className="text-xs text-red-700 dark:text-red-200 leading-relaxed">
                          💡 Kombinim daha hoş olsun diye daha fazla parça ekleyebilirsin veya rengini değiştirebilirsin.
                        </p>
                      </div>
                    )}

                    {/* Description (if exists) */}
                    {desc && (
                      <p className="text-sm text-secondary dark:text-secondary-dark leading-relaxed italic">{desc}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-5 bg-gradient-to-t from-page/90 via-page/60 to-transparent dark:from-page-dark/90 dark:via-page-dark/60 space-y-3">
            {!items.length && !loading && !error && (
              <div className="space-y-2">
                <Button onClick={onGenerateOutfit} className="w-full !py-3 !px-4">
                  ✨ Kombin Üret
                </Button>
                <Button onClick={onOpenWardrobe} variant="secondary" className="w-full !py-3 !px-4">
                  👕 Dolabına Parça Ekle
                </Button>
              </div>
            )}
            <Button onClick={onClose} className="w-full">Kapat</Button>
          </div>
        </div>
      </div>
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          desc={toast.desc}
          onClose={() => setToast(null)}
        />
      )}

      {/* Hidden share card for rendering */}
      {shareEntry && (
        <div className="fixed -top-[9999px] left-0">
          <OutfitShareCard ref={shareCardRef} entry={shareEntry} />
        </div>
      )}
    </div>
  );
};
