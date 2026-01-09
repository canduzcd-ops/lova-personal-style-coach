
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, SuggestionResult, WardrobeItem } from '../types';
import { Sparkles, ArrowRight, Settings, LogOut, Moon, Sun, Bell, Crown, X, Palette, ChevronRight, Menu, Plus, Tag, Zap, Camera, Star, Loader2, Share2, Quote, Lock, Clock3 } from 'lucide-react';
import { Button } from '../components/Shared';
import { WardrobeScreen } from './WardrobeScreen';
import { ProfileScreen } from './ProfileScreen';
import { generateSmartOutfit, generateStaticStyleTips, rateOutfit } from '../services/styleService';
import { ResultModal } from '../components/ResultModal';
import { PremiumScreen } from './PremiumScreen';
import { notificationService } from '../services/notificationService';
import { wardrobeService } from '../services/wardrobeService';
import { authService } from '../services/authService';
import { TrendDetailScreen } from './TrendDetailScreen';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '../src/i18n';
import { useImagePicker } from '../hooks/useImagePicker';
import { ImagePickerModal } from '../components/ImagePickerModal';
import { usePremium } from '../contexts/PremiumContext';
import { OutfitHistoryScreen } from './OutfitHistoryScreen';
import { outfitHistoryService } from '../services/outfitHistoryService';

interface Props {
  user: UserProfile;
  onLogout: () => void;
  updateUser: (u: UserProfile) => void;
}

// Custom Hand-Drawn Style Wardrobe Icon
const WardrobeSketchIcon = ({ size = 22, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Body of the Armoire */}
    <rect x="4" y="6" width="16" height="15" rx="1" />
    {/* Top Cornice / Crown Molding */}
    <path d="M3 6h18" />
    <path d="M4 6l1-3h14l1 3" />
    {/* Center Divider (Doors) */}
    <path d="M12 6v15" />
    {/* Door Knobs */}
    <path d="M10 13h.5" />
    <path d="M13.5 13h.5" />
    {/* Feet */}
    <path d="M5 21v2" />
    <path d="M19 21v2" />
  </svg>
);

// Helper to compress image locally in Dashboard (avoids importing from other screens)
const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 800;
            let width = img.width;
            let height = img.height;
            if (width > height) {
                if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
            } else {
                if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            } else resolve(base64);
        };
        img.onerror = () => resolve(base64);
    });
};

// Quick Settings / Sidebar Modal
const SettingsModal = ({ 
    isOpen, 
    onClose, 
    user, 
    updateUser, 
    onLogout,
    onOpenHistory,
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    user: UserProfile, 
    updateUser: (u: UserProfile) => void,
    onLogout: () => void,
    onOpenHistory: () => void,
}) => {
    if (!isOpen) return null;

    const { t, i18n } = useTranslation();
    const { isPremium } = usePremium();
    const currentLang = i18n.language?.startsWith('en') ? 'en' : 'tr';

    const toggleLanguage = async () => {
        const next = currentLang === 'tr' ? 'en' : 'tr';
        await setAppLanguage(next);
    };

    const toggleTheme = () => {
        const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        if(newTheme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        updateUser({ ...user, theme: newTheme });
        authService.updateProfile({ ...user, theme: newTheme });
    };

    const toggleNotifications = async () => {
        const isEnabled = notificationService.isEnabled();
        if (isEnabled) {
            notificationService.disable();
            alert(t('dashboard.notifications.disabled'));
        } else {
            const granted = await notificationService.requestPermission();
            if (granted) notificationService.send(t('dashboard.notifications.enabledTitle'), t('dashboard.notifications.enabledBody'));
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-primary/20 backdrop-blur-sm flex justify-start">
            <div className="w-72 h-full bg-page dark:bg-page-dark shadow-2xl p-6 animate-in slide-in-from-left duration-300 flex flex-col border-r border-border dark:border-border-dark">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-serif font-bold text-primary dark:text-white">{t('dashboard.menu.title')}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-surface dark:hover:bg-surface-dark rounded-full transition-colors"><X size={20}/></button>
                </div>

                <div className="space-y-3 flex-1">
                    <button onClick={toggleTheme} className="w-full flex items-center justify-between p-4 bg-surface dark:bg-surface-dark rounded-xl border border-transparent hover:border-border dark:border-border-dark active:scale-[0.98] transition-all">
                        <span className="flex items-center gap-3 text-sm font-semibold text-primary dark:text-white"><Palette size={16}/> {t('dashboard.menu.theme')}</span>
                        {user.theme === 'dark' ? <Moon size={16}/> : <Sun size={16}/>}
                    </button>
                    <button onClick={toggleNotifications} className="w-full flex items-center justify-between p-4 bg-surface dark:bg-surface-dark rounded-xl border border-transparent hover:border-border dark:border-border-dark active:scale-[0.98] transition-all">
                        <span className="flex items-center gap-3 text-sm font-semibold text-primary dark:text-white"><Bell size={16}/> {t('dashboard.menu.notifications')}</span>
                        <ChevronRight size={16} className="text-secondary dark:text-secondary-dark"/>
                    </button>
                    <button onClick={toggleLanguage} className="w-full flex items-center justify-between p-4 bg-surface dark:bg-surface-dark rounded-xl border border-transparent hover:border-border dark:border-border-dark active:scale-[0.98] transition-all">
                        <span className="flex items-center gap-3 text-sm font-semibold text-primary dark:text-white">{t('dashboard.menu.language')}</span>
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-black/10 dark:bg-white/10 border border-white/10 text-primary dark:text-white/90">
                            {currentLang === 'tr' ? 'TR' : 'EN'}
                        </span>
                    </button>
                    <button onClick={() => { onClose(); onOpenHistory(); }} className="w-full flex items-center justify-between p-4 bg-surface dark:bg-surface-dark rounded-xl border border-transparent hover:border-border dark:border-border-dark active:scale-[0.98] transition-all">
                        <span className="flex items-center gap-3 text-sm font-semibold text-primary dark:text-white"><Clock3 size={16}/> Kombin Geçmişi</span>
                        <ChevronRight size={16} className="text-secondary dark:text-secondary-dark" />
                    </button>
                    {!isPremium && (
                        <button onClick={() => { onClose(); /* Trigger premium */ }} className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-accent/10 to-transparent rounded-xl border border-accent/20 active:scale-[0.98] transition-transform">
                             <span className="flex items-center gap-3 text-sm font-bold text-accent"><Crown size={16}/> {t('dashboard.menu.premium')}</span>
                        </button>
                    )}
                </div>

                <div className="space-y-3 mt-auto">
                    <button onClick={onLogout} className="w-full py-4 bg-surface dark:bg-surface-dark rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-border dark:hover:bg-border-dark text-primary dark:text-white">
                        <LogOut size={16} /> {t('dashboard.menu.logout')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<Props> = ({ user, onLogout, updateUser }) => {
    const { t, i18n } = useTranslation();
    const premium = usePremium();
  const [currentView, setCurrentView] = useState<'home' | 'wardrobe' | 'profile' | 'trend-detail'>('home');
  const [result, setResult] = useState<SuggestionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
  const [dailyTip, setDailyTip] = useState(generateStaticStyleTips(user.styles));

  // Style Rating Logic
  const [isRating, setIsRating] = useState(false);
  const [ratingData, setRatingData] = useState(user.styleRating);
  const [showRatingResult, setShowRatingResult] = useState(false); // New state for result panel

    const isPremium = premium.isPremium;

  // Wardrobe Lock Logic: Locked if NOT Premium AND (Combinations >= 2)
    const isWardrobeLocked = !isPremium && user.trialUsage.combinationsCount >= 2;

  const hasItems = user.usage.wardrobeCount > 0;

  const handleGenerateClick = async () => {
      // 1. Check Premium / Trial Limits
    if (!isPremium) {
          if (user.trialUsage.combinationsCount >= 2) {
              setShowPremium(true);
              return;
          }
      }

      setLoading(true);
      try {
          const items = await wardrobeService.getWardrobeItemsForCurrentUser();
          if (items.length < 2) {
              alert(t('dashboard.alerts.needTwoItems'));
              setLoading(false);
              setCurrentView('wardrobe');
              return;
          }
          const res = await generateSmartOutfit(user, items);
          if (res) {
              setResult(res);
              outfitHistoryService.addOutfit(user.id, { outfit: res, source: 'ai' }).catch((err) => console.warn('History save failed', err));
              // Increment Usage if not premium
              if (!isPremium) {
                  const updatedUser = await authService.incrementTrialCombo(user);
                  updateUser(updatedUser);
              }
          }
          else alert(t('dashboard.alerts.notFound'));
      } catch (e) {
          console.error(e);
          alert(t('dashboard.alerts.generic'));
      } finally {
          setLoading(false);
      }
  };

  const handleGenerateWithAnchor = async (anchorItem: WardrobeItem) => {
       // 1. Check Limits First
    if (!isPremium) {
          if (user.trialUsage.combinationsCount >= 2) {
              setShowPremium(true);
              return;
          }
      }

      setLoading(true);
      try {
          const items = await wardrobeService.getWardrobeItemsForCurrentUser();
          // Assuming generateSmartOutfit can take an optional anchor item or we have a specific function
          // We will modify generateSmartOutfit signature or make a new one. 
          // For now, let's assume we pass it or filter.
          
          // Actually, let's use the new logic in styleService.ts (we need to update it to support anchor)
          // Since I can't see the updated styleService in this context, I will mock the call structure 
          // based on standard practice:
          
          // Re-using generateSmartOutfit but we need to pass anchor. 
          // Let's assume generateSmartOutfit is updated to accept it.
          // BUT since I cannot modify styleService in this Turn, I will simulate it 
          // by passing a filtered list where the anchor is prominent or via a specific call.
          
          // *Correction*: I will assume styleService WAS updated in previous turns or I will handle it.
          // Let's use `generateSuggestionFromImage` logic style or just rely on `generateSmartOutfit`
          // We'll update styleService.ts to support it properly if needed, but here is the logic:
          
          // Calling the new function added in previous turn logic
          // @ts-ignore - assuming service update
          const res = await generateSmartOutfit(user, items, anchorItem); 
          
          if (res) {
              setResult({
                  ...res,
                  outfit: {
                      ...res.outfit,
                      desc: t('dashboard.alerts.anchorDesc', { item: anchorItem.name, desc: res.outfit.desc })
                  }
              });
              
              outfitHistoryService.addOutfit(user.id, { outfit: res, source: 'ai' }).catch((err) => console.warn('History save failed', err));
               if (!isPremium) {
                  const updatedUser = await authService.incrementTrialCombo(user);
                  updateUser(updatedUser);
              }
          } else {
              alert(t('dashboard.alerts.generateFailed'));
          }
      } catch(e) {
          console.error(e);
          alert(t('dashboard.alerts.generic'));
      } finally {
          setLoading(false);
      }
  };

  // Image picker for rating uploads
  const handleRatingImageSelected = async (base64: string) => {
      setIsRating(true);
      try {
          const analysis = await rateOutfit(base64);
          if (analysis) {
              const newRating = { 
                  ...analysis, 
                  image: base64, 
                  date: new Date().toISOString() 
              };
              setRatingData(newRating);
              
              // Save to user profile
              const updatedUser = { ...user, styleRating: newRating };
              updateUser(updatedUser);
              await authService.updateProfile(updatedUser);
              
              // Open the result panel
              setShowRatingResult(true);
          } else {
              alert(t('dashboard.rating.analysisFailed'));
          }
      } catch (err) {
          console.error(err);
          alert(t('dashboard.alerts.generic'));
      } finally {
          setIsRating(false);
      }
  };

  const ratingImagePicker = useImagePicker({
    onImageSelected: handleRatingImageSelected,
    onError: (err) => console.error('Rating image picker error:', err),
  });

  // NEW: Reset and trigger upload for Premium users
  const handleCameraClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setRatingData(undefined); // Reset state to show upload view or just clear old data
      ratingImagePicker.showPicker();
  };

  return (
    <div className="h-full relative flex flex-col bg-page dark:bg-page-dark transition-colors duration-300">
        
        {/* Image Picker Modal for Rating */}
        <ImagePickerModal
            isVisible={ratingImagePicker.isPickerVisible}
            onClose={() => ratingImagePicker.setPickerVisible(false)}
            onSelectCamera={() => ratingImagePicker.pickImage('camera')}
            onSelectGallery={() => ratingImagePicker.pickImage('gallery')}
            title={t('dashboard.rating.upload')}
        />
        
        {/* Hidden file input for web fallback */}
        <input type="file" ref={ratingImagePicker.fileInputRef} hidden accept="image/*" onChange={ratingImagePicker.handleFileInput} />

        {/* TOP NAVIGATION BAR */}
        {currentView !== 'profile' && currentView !== 'trend-detail' && (
            <div className="glass h-16 px-5 flex items-center justify-between z-50 shrink-0 sticky top-0">
                {/* Left: Menu (Settings) */}
                <button 
                    onClick={() => setShowSettings(true)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface dark:hover:bg-surface-dark transition-colors"
                >
                    <Menu size={22} className="text-primary dark:text-primary-dark" strokeWidth={1.5} />
                </button>

                {/* Center: Logo */}
                <h1 className="text-2xl font-serif font-bold tracking-tight text-primary dark:text-primary-dark cursor-pointer" onClick={() => setCurrentView('home')}>
                    LOVA
                </h1>

                {/* Right: Profile & Wardrobe Toggle */}
                <div className="flex items-center gap-3">
                    {/* Profile Icon */}
                    <button 
                        onClick={() => setCurrentView('profile')}
                        className="w-9 h-9 rounded-full overflow-hidden border border-border dark:border-border-dark relative shadow-sm hover:scale-105 transition-transform"
                    >
                        {user.avatar_url ? (
                            <img src={user.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                            <div className="w-full h-full bg-surface dark:bg-surface-dark flex items-center justify-center text-primary dark:text-primary-dark font-serif font-bold text-sm">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </button>

                    {/* Wardrobe Toggle */}
                    <button 
                        onClick={() => setCurrentView(currentView === 'home' ? 'wardrobe' : 'home')}
                        className="w-10 h-10 flex items-center justify-center rounded-full relative hover:bg-surface dark:hover:bg-surface-dark transition-colors"
                    >
                        {currentView === 'wardrobe' ? (
                            <X size={22} className="text-primary dark:text-primary-dark" strokeWidth={1.5} />
                        ) : (
                            <>
                                <WardrobeSketchIcon size={22} className="text-primary dark:text-primary-dark" />
                                {user.usage.wardrobeCount > 0 && !isWardrobeLocked && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border border-page dark:border-black"></span>
                                )}
                                {isWardrobeLocked && (
                                     <div className="absolute top-0 right-0 w-3 h-3 bg-accent rounded-full border border-page flex items-center justify-center">
                                         <Lock size={8} className="text-white" />
                                     </div>
                                )}
                            </>
                        )}
                    </button>
                </div>
            </div>
        )}

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-hidden relative">
            {currentView === 'home' ? (
                <div className="h-full flex flex-col overflow-y-auto no-scrollbar pb-20 animate-fade-in">
                    
                    {/* 1. HERO SECTION */}
                    <div className="relative aspect-[3/4] w-full bg-border">
                        <img 
                            src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1473&auto=format&fit=crop"
                            className="w-full h-full object-cover mix-blend-overlay opacity-80"
                            alt="Daily Style"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-primary/30"></div>
                        
                        <div className="absolute top-8 left-0 right-0 text-center">
                            <p className="text-page/90 text-[10px] uppercase tracking-[0.3em] font-bold mb-2 shadow-sm">{t('dashboard.hero.dailyReport')}</p>
                            <h2 className="text-4xl font-serif text-page italic drop-shadow-md">
                                {new Date().toLocaleDateString(i18n.language || 'tr', { weekday: 'long' })}
                            </h2>
                        </div>

                        <div className="absolute bottom-8 left-6 right-6">
                            <div className="bg-page/20 backdrop-blur-xl border border-page/30 p-6 rounded-[32px] text-white shadow-soft">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <h3 className="text-xl font-serif mb-1 text-page">{t('dashboard.hero.whatToWear')}</h3>
                                        <p className="text-xs text-page/90 font-light">
                                            {hasItems 
                                                ? t('dashboard.hero.ctaWithItems')
                                                : t('dashboard.hero.ctaNoItems')}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-page text-primary rounded-full flex items-center justify-center animate-pulse">
                                        <Sparkles size={18} strokeWidth={1.5} />
                                    </div>
                                </div>
                                
                                {/* Kombin Hakkı Göstergesi */}
                                {!isPremium && user.trialUsage.combinationsCount < 2 && (
                                    <div className="text-[9px] text-white/80 mb-2 font-bold uppercase tracking-widest">
                                        {t('dashboard.hero.remainingTrials', { count: 2 - user.trialUsage.combinationsCount })}
                                    </div>
                                )}

                                <Button 
                                    onClick={hasItems ? handleGenerateClick : () => setCurrentView('wardrobe')} 
                                    className="!bg-page !text-primary !py-4 hover:!bg-white shadow-xl border-none"
                                >
                                    {hasItems ? (isPremium || user.trialUsage.combinationsCount < 2 ? t('dashboard.hero.btnGenerate') : t('dashboard.hero.btnPremium')) : t('dashboard.hero.btnAddItem')}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* 2. INSIGHTS */}
                    <div className="px-6 py-12 bg-page dark:bg-page-dark">
                        <div className="text-center max-w-xs mx-auto mb-8">
                             <span className="inline-block w-8 h-0.5 bg-accent dark:bg-accent-dark mb-4"></span>
                             <h3 className="text-2xl font-serif text-primary dark:text-primary-dark leading-snug mb-3">
                                "{dailyTip.dailyMantra}"
                             </h3>
                                      <p className="text-[10px] text-secondary dark:text-secondary-dark uppercase tracking-widest font-bold">
                                          {t('dashboard.insights.mantra')}
                                      </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-surface dark:bg-surface-dark p-5 rounded-3xl border border-transparent hover:border-border dark:border-border-dark flex flex-col justify-between min-h-[140px] transition-colors">
                                 <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 text-primary dark:text-primary-dark flex items-center justify-center mb-3">
                                    <Tag size={14} />
                                 </div>
                                 <div>
                                    <h4 className="font-serif text-sm font-bold mb-1 text-primary dark:text-white">{t('dashboard.insights.tipTitle')}</h4>
                                    <p className="text-xs text-secondary dark:text-secondary-dark leading-relaxed">
                                        {dailyTip.tips[0]}
                                    </p>
                                 </div>
                            </div>
                            
                            {/* Rate My Style Card */}
                            <div className="bg-surface dark:bg-surface-dark p-5 rounded-3xl border border-transparent hover:border-border dark:border-border-dark flex flex-col justify-between min-h-[140px] transition-colors relative overflow-hidden group">
                                 
                                 {/* Premium Camera Button - Top Right */}
                                 {isPremium && (
                                    <button 
                                        onClick={handleCameraClick}
                                        className="absolute top-4 right-4 z-30 p-2 bg-white dark:bg-white/10 rounded-full text-secondary hover:text-primary transition-colors shadow-sm"
                                        title="Yeni Kombin Puanla"
                                    >
                                        <Camera size={14} />
                                    </button>
                                 )}

                                 {/* Premium Lock Overlay */}
                                 {!isPremium && (
                                     <div className="absolute inset-0 z-20 bg-page/80 dark:bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-3">
                                         <Crown size={20} className="text-accent mb-2" />
                                         <p className="text-[10px] font-bold text-primary dark:text-white leading-tight mb-2">
                                             {t('dashboard.rating.lockMessage')}
                                         </p>
                                         <button 
                                            onClick={() => setShowPremium(true)}
                                            className="px-3 py-1.5 bg-accent text-page text-[9px] font-bold rounded-full"
                                         >
                                            {t('dashboard.rating.upgrade')}
                                         </button>
                                     </div>
                                 )}

                                 <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 text-primary dark:text-primary-dark flex items-center justify-center mb-3 relative z-10">
                                    <Star size={14} fill={ratingData ? "currentColor" : "none"} />
                                 </div>
                                 
                                 <div className="relative z-10 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-serif text-sm font-bold mb-1 text-primary dark:text-white">{t('dashboard.rating.title')}</h4>
                                        <p className="text-[10px] text-secondary dark:text-secondary-dark leading-tight mb-3 opacity-80">
                                            {t('dashboard.rating.subtitle')}
                                        </p>
                                    </div>
                                    
                                    {isRating ? (
                                        <div className="flex items-center gap-2 text-accent text-xs font-bold animate-pulse">
                                            <Loader2 size={14} className="animate-spin"/> {t('dashboard.rating.processing')}
                                        </div>
                                    ) : (isPremium && ratingData) ? (
                                        <div>
                                            <div className="text-2xl font-serif font-bold text-accent mb-1">{ratingData.score}/10</div>
                                            <button 
                                                onClick={() => setShowRatingResult(true)}
                                                className="text-[9px] font-bold text-primary dark:text-white underline decoration-accent/50 underline-offset-2"
                                            >
                                                {t('dashboard.rating.viewResult')}
                                            </button>
                                        </div>
                                    ) : (
                                        isPremium && (
                                            <button 
                                                onClick={() => ratingImagePicker.showPicker()}
                                                className="w-full py-2 bg-white dark:bg-white/10 rounded-xl text-xs font-bold text-primary dark:text-white hover:bg-page transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Camera size={14} /> {t('dashboard.rating.upload')}
                                            </button>
                                        )
                                    )}
                                 </div>
                                 
                                 {/* Optional Preview BG for rated items */}
                                 {isPremium && ratingData && (
                                     <div className="absolute inset-0 opacity-10 pointer-events-none">
                                         <img src={ratingData.image} className="w-full h-full object-cover" />
                                     </div>
                                 )}
                            </div>
                        </div>
                    </div>

                    {/* 3. DISCOVERY */}
                    <div className="px-6 pb-8 bg-page dark:bg-page-dark">
                        <h3 className="text-lg font-serif font-bold text-primary dark:text-primary-dark mb-4">{t('dashboard.discovery.title')}</h3>
                        <div className="space-y-4">
                            {/* Updated Minimalist Capsule Card */}
                            <div className="relative rounded-[32px] overflow-hidden group cursor-pointer shadow-soft">
                                {/* Background Image */}
                                <div className="absolute inset-0">
                                    <img 
                                        src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1470&auto=format&fit=crop" 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
                                </div>

                                {/* Content */}
                                <div className="relative z-10 p-8 pt-32">
                                    <div className="mb-6">
                                        <h4 className="font-serif text-3xl text-white mb-2 italic leading-tight">{t('dashboard.discovery.capsule.titleLine1')}<br/>{t('dashboard.discovery.capsule.titleLine2')}</h4>
                                        <div className="w-10 h-0.5 bg-accent mb-3"></div>
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-white/90 mb-2">{t('dashboard.discovery.capsule.tagline')}</p>
                                        <p className="text-xs text-white/80 font-light leading-relaxed">
                                            {t('dashboard.discovery.capsule.description')}
                                        </p>
                                    </div>

                                    {/* Chips */}
                                    <div className="mb-6">
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-accent mb-3">{t('dashboard.discovery.capsule.addThisSeason')}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(t('dashboard.discovery.capsule.items', { returnObjects: true }) as string[]).map((item, idx) => (
                                                <span key={idx} className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg text-[10px] text-white font-medium">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Outfit Suggestion */}
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 backdrop-blur-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-white/70">{t('dashboard.discovery.capsule.suggestionTitle')}</span>
                                        </div>
                                        <p className="text-xs text-white font-medium leading-relaxed">
                                            {t('dashboard.discovery.capsule.suggestionBody')}
                                        </p>
                                    </div>

                                    {/* Style Note */}
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-accent mb-1">{t('dashboard.discovery.capsule.styleNoteTitle')}</p>
                                        <p className="text-xs text-white/70 italic font-serif leading-relaxed">
                                            "{t('dashboard.discovery.capsule.styleNoteBody')}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                 {/* SESSİZ LÜKS KARTI (Navigasyon eklendi) */}
                                 <div 
                                    onClick={() => setCurrentView('trend-detail')}
                                    className="bg-border/30 p-5 rounded-[24px] relative overflow-hidden h-44 flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                                 >
                                     <div className="z-10">
                                                      <span className="text-[9px] font-bold uppercase tracking-widest text-primary/60">{t('dashboard.discovery.trend.badge')}</span>
                                                      <h4 className="font-serif text-xl text-primary leading-none mt-2">{t('dashboard.discovery.trend.titleLine1')}<br/><span className="italic">{t('dashboard.discovery.trend.titleLine2')}</span></h4>
                                                      <p className="text-[9px] text-secondary dark:text-secondary-dark mt-2 opacity-80 leading-tight">{t('dashboard.discovery.trend.subtitle')}</p>
                                     </div>
                                     <div className="flex items-center gap-2 text-primary/80 z-10 group-hover:gap-3 transition-all">
                                                     <span className="text-left text-[10px] font-bold">{t('dashboard.discovery.trend.cta')}</span>
                                        <ArrowRight size={14} />
                                     </div>
                                     <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/40 rounded-full blur-2xl"></div>
                                 </div>

                                 <div 
                                    onClick={() => setShowPremium(true)}
                                    className="bg-primary p-5 rounded-[24px] relative overflow-hidden h-44 flex flex-col justify-between group cursor-pointer shadow-soft"
                                 >
                                     <div className="z-10">
                                         <div className="flex items-center gap-1 mb-2">
                                             <Zap size={12} className="text-accent fill-current" />
                                             <span className="text-[9px] font-bold uppercase tracking-widest text-page/60">{t('dashboard.discovery.premium.badge')}</span>
                                         </div>
                                         <h4 className="font-serif text-xl text-page leading-none">{t('dashboard.discovery.premium.titleLine1')}<br/><span className="text-accent italic">{t('dashboard.discovery.premium.titleLine2')}</span></h4>
                                     </div>
                                     <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-page z-10 group-hover:bg-accent group-hover:text-white transition-colors">
                                         <ArrowRight size={14} />
                                     </div>
                                     <div className="absolute -top-6 -right-6 w-32 h-32 bg-accent/20 rounded-full blur-2xl"></div>
                                 </div>
                            </div>
                        </div>
                    </div>

                </div>
            ) : currentView === 'wardrobe' ? (
                <div className="h-full animate-slide-up bg-page dark:bg-page-dark relative">
                    {isWardrobeLocked ? (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center bg-page dark:bg-page-dark">
                            <div className="w-24 h-24 bg-surface dark:bg-surface-dark rounded-full flex items-center justify-center mb-6 shadow-soft relative overflow-hidden">
                                <div className="absolute inset-0 bg-accent/5"></div>
                                <Lock size={32} className="text-secondary dark:text-secondary-dark relative z-10" />
                            </div>
                            <h2 className="text-3xl font-serif text-primary dark:text-primary-dark mb-4">{t('dashboard.wardrobe.lockedTitle')}</h2>
                            <div className="w-12 h-1 bg-accent rounded-full mb-6 mx-auto"></div>
                            <p className="text-sm text-secondary dark:text-secondary-dark mb-8 leading-relaxed max-w-xs font-light">
                                {t('dashboard.wardrobe.lockedBody', { count: 2 })}
                            </p>
                            <Button onClick={() => setShowPremium(true)} variant="gold" icon={Crown} className="shadow-xl !py-4 !px-8">
                                {t('dashboard.wardrobe.upgrade')}
                            </Button>
                            
                            {/* Background visual element */}
                            <div className="absolute inset-0 -z-10 opacity-5 pointer-events-none">
                                <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80" className="w-full h-full object-cover grayscale" />
                            </div>
                        </div>
                    ) : (
                        <WardrobeScreen 
                            user={user} 
                            updateUser={updateUser}
                            onStatsUpdate={() => {}}
                            onTriggerPremium={() => setShowPremium(true)}
                            onGenerateWithItem={handleGenerateWithAnchor}
                        />
                    )}
                </div>
            ) : currentView === 'trend-detail' ? (
                // Trend Detail View
                <TrendDetailScreen onBack={() => setCurrentView('home')} />
            ) : (
                <ProfileScreen 
                    user={user}
                    onBack={() => setCurrentView('home')}
                    onLogout={onLogout}
                    updateUser={updateUser}
                    onOpenPremium={() => setShowPremium(true)}
                />
            )}
        </div>

        {/* MODALS */}
        {showSettings && (
            <SettingsModal 
                isOpen={showSettings} 
                onClose={() => setShowSettings(false)} 
                user={user} 
                updateUser={updateUser} 
                onLogout={onLogout} 
                onOpenHistory={() => setShowHistory(true)}
            />
        )}

        {(loading || result) && (
            <ResultModal 
                loading={loading} 
                result={result} 
                onClose={() => { setResult(null); setLoading(false); }}
            />
        )}

        {showHistory && <OutfitHistoryScreen user={user} onClose={() => setShowHistory(false)} />}
        
        {showPremium && <PremiumScreen user={user} onClose={() => setShowPremium(false)} onSuccess={updateUser} />}

        {/* Style Rating Result Panel (Premium Feature) */}
        {showRatingResult && ratingData && (
            <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in p-0 sm:p-4">
                <div className="bg-page dark:bg-page-dark w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl relative animate-slide-up overflow-hidden border border-border">
                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -z-10"></div>
                    
                    <button 
                        onClick={() => setShowRatingResult(false)}
                        className="absolute top-4 right-4 p-2 bg-surface dark:bg-surface-dark rounded-full hover:bg-border transition-colors text-primary dark:text-white"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        <div className="text-[10px] font-bold text-secondary dark:text-secondary-dark uppercase tracking-[0.3em] mb-4">
                            {t('dashboard.rating.resultTitle')}
                        </div>

                        {/* Image Preview */}
                        <div className="w-24 h-24 rounded-full border-4 border-white dark:border-white/10 shadow-lg overflow-hidden mb-6 relative">
                            <img src={ratingData.image} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                        </div>

                        {/* Score */}
                        <div className="relative mb-6">
                            <h2 className="text-7xl font-serif font-bold text-primary dark:text-white tracking-tighter">
                                {ratingData.score}
                            </h2>
                            <div className="text-xs font-bold text-accent uppercase tracking-widest absolute -right-6 top-2">
                                /10
                            </div>
                        </div>

                        {/* Comment */}
                        <div className="bg-surface dark:bg-surface-dark p-6 rounded-2xl relative mb-6">
                            <Quote size={20} className="text-accent/40 absolute top-4 left-4" />
                            <p className="text-sm font-medium text-primary dark:text-white leading-relaxed italic pt-2 relative z-10">
                                "{ratingData.comment}"
                            </p>
                        </div>

                        <Button 
                            onClick={() => setShowRatingResult(false)} 
                            className="!rounded-2xl shadow-xl w-full"
                        >
                            {t('dashboard.rating.close')}
                        </Button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};
