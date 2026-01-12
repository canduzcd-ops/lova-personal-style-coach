
import React from 'react';
import { ArrowLeft, Check, Palette, Tag, Layers } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export const TrendDetailScreen: React.FC<Props> = ({ onBack }) => {
  const mustHaves = [
    "Kaşmir Kazak (Camel veya Bej)",
    "İpek Gömlek (Krem)",
    "Yüksek Bel Yün Pantolon",
    "Klasik Trenchcoat",
    "Deri Loafer veya Minimal Sneaker"
  ];

  const palette = [
    { color: '#D6C0B3', name: 'Camel' },
    { color: '#F5F5F0', name: 'Krem' },
    { color: '#1C1917', name: 'Siyah' },
    { color: '#4B5563', name: 'Gri' },
    { color: '#1E3A8A', name: 'Navy' }
  ];

  return (
    <div className="h-full flex flex-col bg-page dark:bg-page-dark animate-slide-up overflow-y-auto pb-20">
      
      {/* Sticky Header */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between sticky top-0 bg-page/80 dark:bg-page-dark/80 backdrop-blur-xl z-20">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-surface dark:hover:bg-surface-dark rounded-full transition-colors">
          <ArrowLeft size={24} className="text-primary dark:text-primary-dark" />
        </button>
        <h2 className="text-xs font-bold uppercase tracking-widest text-primary dark:text-primary-dark">Trend Raporu</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1">
          {/* Hero Section */}
          <div className="relative h-96 w-full">
              <img 
                  src="https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=1287&fm=jpg&fit=crop" 
                  className="w-full h-full object-cover"
                  alt="Quiet Luxury"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-page dark:from-page-dark via-transparent to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 right-0 p-8">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-lg mb-4 inline-block">
                      Sezon Trendi
                  </span>
                  <h1 className="text-5xl font-serif text-primary dark:text-white leading-none mb-4">
                      Sessiz<br/><span className="italic font-light">Lüks</span>
                  </h1>
                  <p className="text-sm text-primary/80 dark:text-white/80 font-medium max-w-xs leading-relaxed">
                      "Para bağırır, servet fısıldar." Logolardan arınmış, kumaş kalitesine odaklanan minimalist bir zarafet.
                  </p>
              </div>
          </div>

          <div className="px-8 py-8 space-y-10">
              
              {/* Must Haves */}
              <div>
                  <h3 className="flex items-center gap-2 font-serif text-xl text-primary dark:text-white mb-6">
                      <Tag size={18} className="text-accent"/> Dolabın Demirbaşları
                  </h3>
                  <ul className="space-y-4">
                      {mustHaves.map((item, i) => (
                          <li key={i} className="flex items-center gap-4 p-4 bg-surface dark:bg-surface-dark rounded-2xl border border-transparent hover:border-border transition-colors">
                              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                                  <Check size={14} strokeWidth={3} />
                              </div>
                              <span className="text-sm font-medium text-primary dark:text-white">{item}</span>
                          </li>
                      ))}
                  </ul>
              </div>

              {/* Color Palette */}
              <div>
                  <h3 className="flex items-center gap-2 font-serif text-xl text-primary dark:text-white mb-6">
                      <Palette size={18} className="text-accent"/> Renk Paleti
                  </h3>
                  <div className="bg-surface dark:bg-surface-dark p-6 rounded-3xl">
                      <p className="text-xs text-secondary dark:text-secondary-dark mb-6 leading-relaxed">
                          Doğal, nötr ve zamansız tonlar. Bu palet, parçaların birbiriyle zahmetsizce uyum sağlamasını garanti eder.
                      </p>
                      <div className="flex justify-between items-center px-2">
                          {palette.map((p, i) => (
                              <div key={i} className="flex flex-col items-center gap-2">
                                  <div 
                                    className="w-10 h-10 rounded-full shadow-md border border-white/20" 
                                    style={{ backgroundColor: p.color }}
                                  ></div>
                                  <span className="text-[9px] font-bold uppercase text-secondary dark:text-secondary-dark">{p.name}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              {/* Outfit Suggestion */}
              <div>
                  <h3 className="flex items-center gap-2 font-serif text-xl text-primary dark:text-white mb-6">
                      <Layers size={18} className="text-accent"/> Bugün İçin Öneri
                  </h3>
                  <div className="bg-primary dark:bg-white/5 p-8 rounded-[32px] text-page dark:text-white relative overflow-hidden">
                      <div className="relative z-10">
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Görünüm</p>
                          <p className="text-lg font-serif italic leading-relaxed">
                              "Krem rengi ipek gömleğini, camel yün pantolonunla eşleştir. Omuzlarına aynı tonlarda bir kazak atarak doku derinliği yarat."
                          </p>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -z-0"></div>
                  </div>
              </div>

              {/* Style Note */}
              <div className="pb-8">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-3">Stil Notu</p>
                  <p className="text-sm text-secondary dark:text-secondary-dark font-serif italic leading-loose pl-4 border-l-2 border-accent">
                      "Sessiz lüks, bir trendden ziyade bir duruştur. Kıyafetlerinin markası değil, kumaşının dokusu ve üzerindeki duruşu konuşmalı. Az, her zaman daha çoktur."
                  </p>
              </div>

          </div>
      </div>
    </div>
  );
};
