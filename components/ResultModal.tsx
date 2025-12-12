import React, { useState, useEffect } from 'react';
import { X, Save, Lock, Tag, Scissors, Eye, Droplet, Sparkles, Check, Share2 } from 'lucide-react';
import { Button } from './Shared';
import { SuggestionResult } from '../types';

interface Props {
  loading: boolean;
  result: SuggestionResult | null;
  onClose: () => void;
  onSave?: (result: SuggestionResult) => void;
}

export const ResultModal: React.FC<Props> = ({ loading, result, onClose, onSave }) => {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => { setIsSaved(false); }, [result]);

  const handleSave = () => {
    if (result && onSave) {
      onSave(result);
      setIsSaved(true);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] bg-page/90 dark:bg-page-dark/90 backdrop-blur-2xl flex flex-col items-center justify-center animate-fade-in">
        <div className="relative mb-8">
          <div className="w-24 h-24 border-2 border-border dark:border-border-dark rounded-full"></div>
          <div className="w-24 h-24 border-2 border-t-accent rounded-full animate-spin absolute top-0 left-0"></div>
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent animate-pulse" size={32} strokeWidth={1} />
        </div>
        <h3 className="text-3xl font-serif text-primary dark:text-primary-dark mb-2">Analiz Ediliyor</h3>
        <p className="text-secondary dark:text-secondary-dark text-[10px] tracking-[0.3em] uppercase">Gardırobun taranıyor...</p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-page dark:bg-page-dark flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-6 flex justify-between items-center z-10 bg-page/80 dark:bg-page-dark/80 backdrop-blur-xl sticky top-0">
        <button onClick={onClose} className="p-3 bg-surface dark:bg-surface-dark rounded-full shadow-sm hover:scale-105 transition-transform"><X size={20} className="text-primary dark:text-primary-dark" /></button>
        <span className="font-serif italic text-lg text-primary dark:text-primary-dark">Daily Look</span>
        <button 
          onClick={handleSave} 
          disabled={isSaved}
          className={`p-3 rounded-full shadow-sm transition-all hover:scale-105 ${isSaved ? 'bg-green-100 text-green-600 dark:bg-green-100 dark:text-green-600' : 'bg-surface dark:bg-surface-dark text-primary dark:text-primary-dark'}`}
        >
          {isSaved ? <Check size={20} /> : <Save size={20} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Editorial Title Section */}
        <div className="px-8 pt-4 pb-12 text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-accent/20 blur-[50px] rounded-full"></div>
          <h2 className="text-5xl font-serif text-primary dark:text-primary-dark mb-6 relative z-10 leading-[1.1]">{result.outfit.title}</h2>
          <div className="w-12 h-1 bg-primary dark:bg-primary-dark mx-auto mb-6 rounded-full opacity-20"></div>
          <p className="text-secondary dark:text-secondary-dark text-sm font-light leading-relaxed max-w-sm mx-auto relative z-10">{result.outfit.desc}</p>
        </div>

        {/* Outfit Grid - Magazine Layout */}
        <div className="px-6 mb-12">
            <div className="grid grid-cols-2 gap-4">
              {result.outfit.items.map((item, i) => (
                <div key={i} className={`group relative rounded-[32px] overflow-hidden shadow-sm bg-surface dark:bg-surface-dark ${i === 0 ? 'col-span-2 aspect-[4/3]' : 'aspect-[3/4]'}`}>
                  {item.image ? (
                      <img src={item.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface dark:bg-surface-dark text-border"><Tag size={32} /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                      <div>
                          <p className="text-white/60 text-[10px] uppercase tracking-widest mb-1">{item.type}</p>
                          <p className="text-white font-serif text-lg">{item.name}</p>
                      </div>
                  </div>
                </div>
              ))}
            </div>
        </div>

        {/* Beauty & Tips Section */}
        <div className="px-6 space-y-4">
          <h3 className="font-bold text-secondary dark:text-secondary-dark text-xs uppercase tracking-[0.2em] pl-2 mb-4">Güzellik & Detaylar</h3>
          
          {[
            { icon: Sparkles, ...result.beauty.makeup, bg: 'bg-rose-50 dark:bg-rose-50', text: 'text-rose-900 dark:text-rose-900' },
            { icon: Scissors, ...result.beauty.hair, bg: 'bg-orange-50 dark:bg-orange-50', text: 'text-orange-900 dark:text-orange-900' },
            { icon: Droplet, ...result.beauty.perfume, bg: 'bg-blue-50 dark:bg-blue-50', text: 'text-blue-900 dark:text-blue-900' },
            ...result.additionalTips.map(t => ({...t, bg: 'bg-surface dark:bg-surface-dark', text: 'text-primary dark:text-primary-dark', icon: Share2 }))
          ].map((item, idx) => (
            <div key={idx} className="bg-surface dark:bg-surface-dark p-6 rounded-[28px] border border-transparent dark:border-transparent shadow-sm flex items-start gap-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.bg} ${item.text}`}>
                <item.icon size={20} strokeWidth={1.5} />
              </div>
              <div>
                <div className="font-serif text-lg text-primary dark:text-primary-dark mb-1">{item.title}</div>
                <div className="text-sm text-secondary dark:text-secondary-dark font-light leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-page via-page to-transparent dark:from-page-dark dark:via-page-dark z-20 pointer-events-none">
          <div className="pointer-events-auto">
            <Button variant="primary" onClick={onClose} className="shadow-2xl">Kombini Tamamla</Button>
          </div>
      </div>
    </div>
  );
};