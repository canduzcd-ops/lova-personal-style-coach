
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Trash2, X, Loader2, Shirt, ImageIcon, Camera, Check, Sparkles, ScanLine } from 'lucide-react';
import { Button, Input } from '../components/Shared';
import { UserProfile, WardrobeItem } from '../types';
import { WARDROBE_CATEGORIES } from '../constants';
import { analyzeImage } from '../services/aiService';
import { authService } from '../services/authService';
import { wardrobeService } from '../services/wardrobeService';
import { useTranslation } from 'react-i18next';
import { useImagePicker } from '../hooks/useImagePicker';
import { ImagePickerModal } from '../components/ImagePickerModal';
import { InlineLoader } from '../components/InlineLoader';
import { StateCard } from '../components/StateCard';
import { Toast, ToastType } from '../components/Toast';
import { maybeNotify } from '../services/engagementService';

const FastImage = React.memo(({ src, alt }: { src?: string, alt: string }) => {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className="w-full h-full bg-surface dark:bg-surface-dark relative overflow-hidden flex items-center justify-center">
            {src ? (
                <img 
                    src={src} 
                    alt={alt}
                    loading="lazy"
                    onLoad={() => setLoaded(true)}
                    className={`w-full h-full object-cover transition-opacity duration-500 ease-out ${loaded ? 'opacity-100' : 'opacity-0'}`}
                />
            ) : (
                <Shirt size={20} className="text-border dark:text-border-dark opacity-50"/>
            )}
        </div>
    );
});

const WardrobeGridItem = React.memo(({ item, onClick }: { item: WardrobeItem, onClick: (item: WardrobeItem) => void }) => {
    return (
        <button 
            onClick={() => onClick(item)} 
            className="w-full aspect-[3/4] outline-none active:scale-[0.97] transition-all duration-300 group relative"
        >
            <div className="w-full h-full rounded-2xl overflow-hidden relative border border-border/50 dark:border-border-dark bg-surface dark:bg-surface-dark shadow-sm">
                <FastImage src={item.image} alt={item.name} />
                
                {/* Modern Gradient Overlay */}
                <div className="absolute inset-x-0 bottom-0 pt-10 pb-3 px-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <p className="text-xs font-bold text-white truncate text-left drop-shadow-md">{item.name}</p>
                </div>
            </div>
            {/* Type Badge */}
            <div className="absolute top-2 right-2 bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-primary dark:text-white shadow-sm">
                {item.type}
            </div>
        </button>
    );
}, (prev, next) => prev.item.id === next.item.id);

interface Props {
    user: UserProfile;
    updateUser: (u: UserProfile) => void;
    onStatsUpdate: (stats: { count: number, uniqueCategories: number }) => void;
    onTriggerPremium?: (payload: { source: 'wardrobe'; reason?: string }) => void;
    onGenerateWithItem?: (item: WardrobeItem) => void;
}

export const WardrobeScreen: React.FC<Props> = ({ user, updateUser, onStatsUpdate, onTriggerPremium, onGenerateWithItem }) => {
    const { t } = useTranslation();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
    const [toast, setToast] = useState<{ type: ToastType; title: string; desc?: string } | null>(null);
    const wardrobeTrialLocked = !user.isPremium && user.trialUsage.wardrobeAccessUsed;
        const [uploadProgress, setUploadProgress] = useState<number | null>(null);
        const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Modal States
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Add Flow States
  const [addItemStep, setAddItemStep] = useState<'source' | 'preview'>('source');
  const [newItemImg, setNewItemImg] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState('ust');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Image Picker Hook
    const handleImageSelected = async (base64: string) => {
    setAddItemStep('preview');
    setIsAnalyzing(true);
    setNewItemImg(base64);
        setUploadProgress(null);
        setUploadError(null);
    
    // AI Analysis
    try {
        const res = await analyzeImage(base64);
        if(res) { 
            setNewItemName(res.name); 
            setNewItemType(res.type); 
        }
    } catch (err) {
        console.error("AI Analysis Failed", err);
        const message = err instanceof Error && err.message ? err.message : t('wardrobe.alerts.generic');
        setToast({ type: 'error', title: 'Analiz başarısız', desc: message });
    } finally {
        setIsAnalyzing(false);
    }
  };

  const imagePicker = useImagePicker({
    onImageSelected: handleImageSelected,
    onError: (err) => console.error('Image picker error:', err),
  });

  // Scroll Lock Effect
  useEffect(() => {
    if (isAdding || selectedItem) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isAdding, selectedItem]);

    useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
      setLoadingItems(true);
      setLoadError(null);
      try {
          const data = await wardrobeService.getWardrobeItemsForCurrentUser();
          setItems(data);
          onStatsUpdate({ count: data.length, uniqueCategories: new Set(data.map(i=>i.type)).size });
      } catch(e) {
          console.error(e);
          const message = e instanceof Error && e.message ? e.message : t('wardrobe.alerts.generic');
          setLoadError(message);
      }
      setLoadingItems(false);
  };

  const filteredItems = useMemo(() => filter === 'all' ? items : items.filter(i => i.type === filter), [items, filter]);

  const resetAddModal = () => {
      setIsAdding(false); 
      // Delay reset slightly for animation close
      setTimeout(() => {
        setAddItemStep('source'); 
        setNewItemImg(null); 
        setNewItemName(''); 
        setNewItemType('ust');
        setIsAnalyzing(false);
                setUploadProgress(null);
                setUploadError(null);
      }, 300);
  };

    const handleSave = async () => {
        if(!newItemName) {
            setToast({ type: 'error', title: t('wardrobe.alerts.nameRequired') });
            return;
        }
        setUploadError(null);
        setUploadProgress(0);
            setIsSaving(true);
            try {
             const isFirstItem = items.length === 0;
             const newItem = await wardrobeService.addWardrobeItem({
                 name: newItemName, type: newItemType, image: newItemImg || undefined, color: t('wardrobe.item.unknownColor'), aiTags: undefined
             }, {
                onUploadProgress: (pct) => setUploadProgress(pct),
             });
             setItems(prev => [newItem, ...prev]);
             updateUser(await authService.incrementUsage(user, 'wardrobe'));
         
             // Send first item notification
             if (isFirstItem) {
               maybeNotify('wardrobe_first_item_added').catch(err => console.warn('Engagement notif failed', err));
             }
             
             resetAddModal();

        } catch(e) {
            const message = e instanceof Error && e.message ? e.message : t('wardrobe.alerts.generic');
            setUploadError(message);
            setUploadProgress(null);
            setToast({ type: 'error', title: 'Kaydedilemedi', desc: message });
        }
            setIsSaving(false);
    };

  const handleDelete = async (id: string) => {
    if(!confirm(t('wardrobe.alerts.confirmDelete'))) return;
      await wardrobeService.deleteWardrobeItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setSelectedItem(null);
  };

  if (wardrobeTrialLocked) {
      return (
          <div className="h-full flex items-center justify-center p-6 bg-page dark:bg-page-dark">
              <StateCard
                  type="empty"
                  title="Deneme tamamlandı"
                  desc="Dolabın kilidi açmak için Premium'a geçebilirsin."
                  actionLabel="Premium'a geç"
                  onAction={() => onTriggerPremium?.({ source: 'wardrobe', reason: 'Dolap deneme hakkın bitti.' })}
              />
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col bg-page dark:bg-page-dark relative">
        
        {/* Header & Filter Bar */}
        <div className="pt-2 pb-2 px-4 bg-page/95 dark:bg-page-dark/95 backdrop-blur-sm sticky top-0 z-30 border-b border-border dark:border-border-dark transition-colors">
             <div className="flex justify-between items-center mb-4 mt-2">
                 <h2 className="text-xl font-serif font-bold text-primary dark:text-primary-dark">{t('wardrobe.title')}</h2>
                 <div className="flex gap-2">
                    <div className="px-3 py-1.5 bg-surface dark:bg-surface-dark rounded-full text-[10px] font-bold text-secondary border border-border dark:border-border-dark">
                        {items.length} {t('wardrobe.item.count')}
                    </div>
                 </div>
             </div>
             
             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                 <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${filter === 'all' ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-surface dark:bg-surface-dark text-secondary dark:text-secondary-dark border-transparent hover:bg-border/50'}`}>{t('wardrobe.filters.all')}</button>
                 {WARDROBE_CATEGORIES.map(cat => (
                     <button key={cat.id} onClick={() => setFilter(cat.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${filter === cat.id ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-surface dark:bg-surface-dark text-secondary dark:text-secondary-dark border-transparent hover:bg-border/50'}`}>
                         {t(`wardrobe.filters.${cat.id}`, cat.label)}
                     </button>
                 ))}
             </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
            {loadingItems ? (
                <InlineLoader label={t('wardrobe.loading')} />
            ) : loadError ? (
                <div className="py-12">
                    <StateCard
                        type="error"
                        title="Dolap yüklenemedi"
                        desc={loadError}
                        actionLabel="Tekrar dene"
                        onAction={loadItems}
                    />
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="py-12">
                    <StateCard
                        type="empty"
                        title={t('wardrobe.empty.title')}
                        desc={t('wardrobe.empty.body')}
                        actionLabel={t('wardrobe.modal.addButton')}
                        onAction={() => setIsAdding(true)}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in">
                    {filteredItems.map(item => (
                        <WardrobeGridItem key={item.id} item={item} onClick={setSelectedItem} />
                    ))}
                </div>
            )}
        </div>

        {/* Floating Action Button (FAB) */}
        <div className="absolute bottom-6 right-6 z-40">
            <button 
                onClick={() => setIsAdding(true)}
                className="w-14 h-14 bg-primary dark:bg-white text-white dark:text-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 group"
            >
                <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
        </div>

        {/* Hidden file input for web fallback */}
        <input type="file" ref={imagePicker.fileInputRef} hidden accept="image/*" onChange={imagePicker.handleFileInput} />

        {/* ADD ITEM BOTTOM SHEET */}
        {isAdding && (
            <div className="fixed inset-0 z-50 flex justify-end flex-col">
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
                    onClick={resetAddModal}
                ></div>
                
                {/* Sheet Content */}
                <div className="bg-page dark:bg-page-dark relative z-10 w-full rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-slide-up border-t border-white/10 max-h-[90vh] overflow-y-auto flex flex-col">
                    
                    <div className="w-12 h-1 bg-border dark:bg-border-dark rounded-full mx-auto mb-6 shrink-0"></div>

                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <h3 className="text-2xl font-serif font-bold text-primary dark:text-primary-dark">
                            {addItemStep === 'source' ? t('wardrobe.modal.addTitle') : t('wardrobe.modal.editTitle')}
                        </h3>
                        <button onClick={resetAddModal} className="p-2 bg-surface dark:bg-surface-dark rounded-full hover:bg-border transition-colors">
                            <X size={20} className="text-primary dark:text-primary-dark"/>
                        </button>
                    </div>

                    {addItemStep === 'source' ? (
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button 
                                onClick={() => imagePicker.pickImage('gallery')} 
                                className="flex flex-col items-center justify-center gap-3 p-8 bg-surface dark:bg-surface-dark border-2 border-dashed border-border dark:border-border-dark rounded-3xl hover:bg-page dark:hover:bg-page-dark/50 transition-colors group"
                            >
                                <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    <ImageIcon size={24} className="text-accent" />
                                </div>
                                <span className="font-bold text-sm text-primary dark:text-primary-dark">{t('wardrobe.modal.selectFromGallery')}</span>
                            </button>
                            
                            <button 
                                onClick={() => imagePicker.pickImage('camera')}
                                className="flex flex-col items-center justify-center gap-3 p-8 bg-surface dark:bg-surface-dark border-2 border-dashed border-border dark:border-border-dark rounded-3xl hover:bg-page dark:hover:bg-page-dark/50 transition-colors group"
                            >
                                <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    <Camera size={24} className="text-accent" />
                                </div>
                                <span className="font-bold text-sm text-primary dark:text-primary-dark">{t('wardrobe.modal.takePhoto')}</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 flex-1">
                            {/* Image Preview Area */}
                            <div className="relative w-full aspect-[4/5] max-h-[300px] mx-auto bg-surface dark:bg-surface-dark rounded-2xl overflow-hidden shadow-inner border border-border dark:border-border-dark group">
                                {newItemImg && <img src={newItemImg} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"/>}
                                
                                {isAnalyzing && (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-3 animate-in fade-in">
                                        <Loader2 size={32} className="animate-spin text-accent" />
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                                            <Sparkles size={14} className="text-accent"/>
                                            {t('wardrobe.modal.analyzing')}
                                        </div>
                                    </div>
                                )}

                                {uploadProgress !== null && (
                                    <div className="absolute inset-x-0 bottom-0 p-3 bg-black/60 backdrop-blur-sm text-white">
                                        <div className="flex items-center justify-between text-xs font-semibold mb-2">
                                            <span>{t('wardrobe.modal.uploading')}</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                    </div>
                                )}

                                {uploadError && (
                                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm text-white flex flex-col items-center justify-center gap-3 p-4">
                                        <p className="text-sm font-semibold text-center">{uploadError}</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => setUploadError(null)} className="px-3 py-1.5 bg-transparent border border-white/50 text-white rounded-lg text-xs font-bold hover:bg-white/10">{t('common.cancel')}</button>
                                            <button onClick={handleSave} className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-bold hover:shadow-md">{t('common.retry')}</button>
                                        </div>
                                    </div>
                                )}

                                <button 
                                    onClick={() => setAddItemStep('source')}
                                    className="absolute bottom-3 right-3 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <Input 
                                    label={t('wardrobe.modal.nameLabel')} 
                                    value={newItemName} 
                                    onChange={setNewItemName} 
                                    placeholder={isAnalyzing ? t('wardrobe.modal.namePlaceholderAnalyzing') : t('wardrobe.modal.namePlaceholder')}
                                />
                                
                                <div>
                                    <label className="block text-[10px] font-bold text-secondary dark:text-secondary-dark uppercase tracking-[0.2em] mb-3 ml-1">{t('wardrobe.modal.categoryLabel')}</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {WARDROBE_CATEGORIES.map(c => (
                                            <button 
                                                key={c.id} 
                                                onClick={() => setNewItemType(c.id)} 
                                                className={`py-3 text-[10px] font-bold uppercase rounded-xl border transition-all duration-200 ${newItemType === c.id ? 'bg-primary text-white border-primary shadow-md scale-[1.02]' : 'bg-surface dark:bg-surface-dark text-secondary dark:text-secondary-dark border-transparent hover:border-border'}`}
                                            >
                                                {c.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 space-y-2">
                                    <Button onClick={handleSave} disabled={isSaving || isAnalyzing} className="shadow-xl">
                                        {isSaving ? <Loader2 className="animate-spin" /> : t('wardrobe.modal.addButton')}
                                    </Button>
                                    <p className="text-[11px] text-secondary dark:text-secondary-dark text-center">
                                        {t('wardrobe.modal.uploadHint', 'Fotoğraflar en fazla 1080px ve sıkıştırılmış olarak yüklenir.')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
        
        {/* ITEM DETAIL MODAL (Full Screen Overlay) */}
        {selectedItem && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center">
                <div 
                    className="absolute inset-0 bg-page/90 dark:bg-black/90 backdrop-blur-xl animate-in fade-in duration-300"
                    onClick={() => setSelectedItem(null)}
                ></div>

                <div className="relative z-10 w-full max-w-md h-full sm:h-auto flex flex-col sm:block animate-scale-in p-4 sm:p-0">
                     {/* Close Button Mobile */}
                    <button 
                        onClick={() => setSelectedItem(null)} 
                        className="absolute top-4 right-4 z-20 p-3 bg-black/20 dark:bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors sm:hidden"
                    >
                        <X size={24} />
                    </button>

                    <div className="bg-transparent sm:bg-page sm:dark:bg-page-dark rounded-[40px] overflow-hidden shadow-2xl flex flex-col h-full sm:h-auto max-h-[90vh]">
                        {/* Image Area */}
                        <div className="relative flex-1 sm:aspect-[4/5] bg-surface dark:bg-surface-dark">
                            <img src={selectedItem.image} className="w-full h-full object-contain sm:object-cover"/>
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 sm:to-transparent pointer-events-none"></div>
                            
                            {/* Desktop Close */}
                            <button 
                                onClick={() => setSelectedItem(null)} 
                                className="absolute top-4 right-4 z-20 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors hidden sm:block"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Details Area */}
                        <div className="p-8 bg-page dark:bg-page-dark rounded-t-[32px] sm:rounded-none -mt-6 sm:mt-0 relative z-10 flex flex-col gap-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                            <div className="w-12 h-1.5 bg-border dark:bg-border-dark rounded-full mx-auto sm:hidden opacity-50 mb-2"></div>
                            
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-2">{selectedItem.type}</div>
                                    <h3 className="font-serif text-3xl font-bold text-primary dark:text-primary-dark leading-none">{selectedItem.name}</h3>
                                </div>
                                <button 
                                    onClick={() => handleDelete(selectedItem.id)} 
                                    className="p-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-full hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 size={20}/>
                                </button>
                            </div>
                            
                            {/* AI Tags */}
                            <div className="flex flex-wrap gap-2">
                                {selectedItem.aiTags?.season?.map(s => (
                                    <span key={s} className="px-3 py-1 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg text-[10px] font-bold text-secondary dark:text-secondary-dark uppercase tracking-wider">{s}</span>
                                ))}
                                {selectedItem.aiTags?.fabric && (
                                     <span className="px-3 py-1 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg text-[10px] font-bold text-secondary dark:text-secondary-dark uppercase tracking-wider">{selectedItem.aiTags.fabric}</span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="pt-4 mt-auto">
                                <Button 
                                    onClick={() => {
                                        if (onGenerateWithItem) {
                                            onGenerateWithItem(selectedItem);
                                            setSelectedItem(null);
                                        }
                                    }}
                                    variant="gold" 
                                    className="w-full shadow-xl !py-4"
                                    icon={Sparkles}
                                >
                                    {t('wardrobe.detail.combine')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        {toast && (
            <Toast
                type={toast.type}
                title={toast.title}
                desc={toast.desc}
                onClose={() => setToast(null)}
            />
        )}
    </div>
  );
};
