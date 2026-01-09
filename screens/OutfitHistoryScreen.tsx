import React, { useEffect, useState } from 'react';
import { OutfitHistoryEntry, UserProfile } from '../types';
import { outfitHistoryService } from '../services/outfitHistoryService';
import { Button } from '../components/Shared';
import { X, ThumbsUp, ThumbsDown, Clock, CloudSun } from 'lucide-react';

interface Props {
  user: UserProfile;
  onClose: () => void;
}

export const OutfitHistoryScreen: React.FC<Props> = ({ user, onClose }) => {
  const [items, setItems] = useState<OutfitHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
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
    })();
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
      alert(e?.message || 'Geri bildirim kaydedilemedi');
    }
  };

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
            {loading && (
              <div className="text-sm text-secondary">Yükleniyor...</div>
            )}
            {error && (
              <div className="text-sm text-red-500">{error}</div>
            )}
            {!loading && !items.length && !error && (
              <div className="text-sm text-secondary">Henüz kayıt yok.</div>
            )}

            {items.map((entry) => {
              const title = entry.outfit?.outfit?.title || 'Kombin';
              const desc = entry.outfit?.outfit?.desc;
              const created = entry.createdAt
                ? new Date(entry.createdAt).toLocaleString()
                : '—';
              const detail = entry.outfit?.outfit?.items?.[0]?.styles?.join(', ')
                || entry.outfit?.outfit?.items?.[0]?.type
                || entry.weather?.summary;

              return (
                <div
                  key={entry.id}
                  className="bg-surface dark:bg-surface-dark rounded-2xl p-4 border border-border/40 dark:border-border-dark/60 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-secondary flex items-center gap-1">
                        <Clock size={12} /> {created}
                      </p>
                      <h3 className="text-lg font-serif font-bold text-primary dark:text-primary-dark">{title}</h3>
                      {desc && <p className="text-sm text-secondary dark:text-secondary-dark leading-relaxed">{desc}</p>}
                      {detail && (
                        <p className="text-xs text-secondary/80 flex items-center gap-1">
                          <CloudSun size={12} /> {detail}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleFeedback(entry, true)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
                          entry.liked === true
                            ? 'bg-accent text-white border-accent'
                            : 'border-border dark:border-border-dark text-primary dark:text-primary-dark hover:bg-surface/60'
                        }`}
                        aria-label="Beğendim"
                      >
                        <ThumbsUp size={16} />
                      </button>
                      <button
                        onClick={() => handleFeedback(entry, false)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
                          entry.liked === false
                            ? 'bg-red-100 text-red-600 border-red-200'
                            : 'border-border dark:border-border-dark text-primary dark:text-primary-dark hover:bg-surface/60'
                        }`}
                        aria-label="Beğenmedim"
                      >
                        <ThumbsDown size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-5 bg-gradient-to-t from-page/90 via-page/60 to-transparent dark:from-page-dark/90 dark:via-page-dark/60">
            <Button onClick={onClose} className="w-full">Kapat</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
