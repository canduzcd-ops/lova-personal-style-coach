
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, BodyMeasurements, MakeupAnalysis } from '../types';
import { Button, Input } from '../components/Shared';
import { Crown, BarChart2, Calendar, Mail, User, ArrowLeft, LogOut, Lock, Edit2, Save, Smile, Palette, Camera, Loader2, Sparkles, Eye, Sun, Heart, ImageIcon } from 'lucide-react';
import { authService } from '../services/authService';
import { analyzeFaceForMakeup } from '../services/aiService';

interface Props {
  user: UserProfile;
  onBack: () => void;
  onLogout: () => void;
  onOpenPremium?: () => void;
  updateUser?: (u: UserProfile) => void;
}

// Helper to compress image before AI analysis or Profile Upload
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

// Body Type Calculation Logic
const calculateBodyType = (m: BodyMeasurements): { type: 'elma' | 'armut' | 'kum_saati' | 'dikdortgen' | 'ters_ucgen', name: string, desc: string } => {
    const { bust, waist, hips } = m;
    
    // Simplistic Logic
    if (waist > bust && waist > hips) {
        return {
            type: 'elma',
            name: 'Elma',
            desc: 'İmparator kesim elbiseler ve dökümlü üstler ile zarif bir silüet oluşturabilirsin.'
        };
    } else if (hips > bust * 1.05) {
        return {
            type: 'armut',
            name: 'Armut',
            desc: 'A-kesim etekler ve omuzları geniş gösteren üstler ile denge sağlayabilirsin.'
        };
    } else if (bust > hips * 1.05) {
        return {
            type: 'ters_ucgen',
            name: 'Ters Üçgen',
            desc: 'V yakalı üstler ve hacimli etekler/pantolonlar ile alt vücudu dengeleyebilirsin.'
        };
    } else if ((bust - waist) > 15 && (hips - waist) > 15) {
        return {
            type: 'kum_saati',
            name: 'Kum Saati',
            desc: 'Bel vurgulu elbiseler, kısa ceketler ve yüksek bel pantolonlar vücut oranlarını en iyi şekilde öne çıkarır.'
        };
    } else {
        return {
            type: 'dikdortgen',
            name: 'Dikdörtgen',
            desc: 'Bel oyuntusu yaratan kemerli parçalar ve asimetrik kesimler sana çok yakışır.'
        };
    }
};

const BodyMeasurementsCard = ({ 
    user, 
    onOpenPremium,
    onSave 
}: { 
    user: UserProfile, 
    onOpenPremium?: () => void,
    onSave?: (m: BodyMeasurements, bodyType: string) => void 
}) => {
    const isPremium = user.isPremium;
    const savedM = user.bodyMeasurements;
    
    const [isEditing, setIsEditing] = useState(!savedM);
    const [form, setForm] = useState<BodyMeasurements>({
        height: savedM?.height || 0,
        weight: savedM?.weight || 0,
        bust: savedM?.bust || 0,
        waist: savedM?.waist || 0,
        hips: savedM?.hips || 0
    });

    const handleChange = (field: keyof BodyMeasurements, val: string) => {
        // Only allow numbers
        if (!/^\d*$/.test(val)) return;
        setForm(prev => ({ ...prev, [field]: Number(val) }));
    };

    const handleSave = () => {
        const result = calculateBodyType(form);
        if (onSave) onSave(form, result.type);
        setIsEditing(false);
    };

    const isValid = form.height > 0 && form.weight > 0 && form.bust > 0 && form.waist > 0 && form.hips > 0;

    if (!isPremium) {
        return (
            <div className="relative overflow-hidden rounded-2xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark mt-6">
                {/* Main Content (Locked Overlay) - Now dictates height */}
                <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center bg-page/60 dark:bg-black/60 backdrop-blur-sm min-h-[200px]">
                    <Lock size={32} className="text-secondary mb-3" />
                    <h3 className="font-serif font-bold text-lg text-primary dark:text-white mb-2">Vücut Ölçülerin</h3>
                    <p className="text-sm text-secondary dark:text-secondary-dark mb-6 max-w-[240px]">
                        Vücut ölçülerine göre kişisel stil önerileri almak için LOVA Premium’a geç.
                    </p>
                    <Button onClick={onOpenPremium} variant="gold" icon={Crown} className="!py-3 !px-6 !text-xs !w-auto shadow-lg">Premium'a Geç</Button>
                </div>
                
                {/* Dummy Content - Background Decoration */}
                <div className="absolute inset-0 opacity-30 pointer-events-none blur-sm select-none p-6 z-0">
                    <h3 className="text-sm font-bold mb-4">Vücut Ölçülerin</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-xl">Boy: 170</div>
                        <div className="bg-white p-3 rounded-xl">Kilo: 60</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isEditing && savedM && user.bodyType) {
        const typeInfo = calculateBodyType(savedM); // Recalculate just for display text consistency
        return (
            <div className="bg-surface dark:bg-surface-dark p-6 rounded-2xl border border-transparent mt-6 relative group">
                <button 
                    onClick={() => setIsEditing(true)} 
                    className="absolute top-4 right-4 p-2 bg-white dark:bg-white/10 rounded-full text-secondary hover:text-primary transition-colors"
                >
                    <Edit2 size={16} />
                </button>

                <h3 className="text-sm font-bold text-primary dark:text-primary-dark mb-4 px-1 flex items-center gap-2">
                    <User size={16} className="text-accent" /> Vücut Tipin
                </h3>
                
                <div className="mb-4">
                    <div className="text-3xl font-serif text-primary dark:text-white font-bold mb-2">{typeInfo.name}</div>
                    <p className="text-sm text-secondary dark:text-secondary-dark leading-relaxed font-medium">
                        {typeInfo.desc}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border dark:border-border-dark">
                    <div className="text-center">
                        <div className="text-[9px] uppercase tracking-wider text-secondary">Göğüs</div>
                        <div className="font-bold text-primary dark:text-white">{savedM.bust}</div>
                    </div>
                    <div className="text-center border-l border-r border-border dark:border-border-dark">
                        <div className="text-[9px] uppercase tracking-wider text-secondary">Bel</div>
                        <div className="font-bold text-primary dark:text-white">{savedM.waist}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[9px] uppercase tracking-wider text-secondary">Basen</div>
                        <div className="font-bold text-primary dark:text-white">{savedM.hips}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface dark:bg-surface-dark p-6 rounded-2xl border border-border dark:border-border-dark mt-6 animate-fade-in">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-sm font-bold text-primary dark:text-primary-dark px-1">Vücut Ölçülerin</h3>
                 {savedM && (
                     <button onClick={() => setIsEditing(false)} className="text-xs text-secondary hover:text-primary">İptal</button>
                 )}
             </div>

             <div className="grid grid-cols-2 gap-4 mb-4">
                 <Input label="Boy (cm)" value={form.height.toString()} onChange={(v) => handleChange('height', v)} placeholder="170" type="text" />
                 <Input label="Kilo (kg)" value={form.weight.toString()} onChange={(v) => handleChange('weight', v)} placeholder="60" type="text" />
             </div>
             
             <div className="grid grid-cols-3 gap-3 mb-6">
                 <Input label="Göğüs" value={form.bust.toString()} onChange={(v) => handleChange('bust', v)} placeholder="90" type="text" />
                 <Input label="Bel" value={form.waist.toString()} onChange={(v) => handleChange('waist', v)} placeholder="60" type="text" />
                 <Input label="Basen" value={form.hips.toString()} onChange={(v) => handleChange('hips', v)} placeholder="90" type="text" />
             </div>

             <Button onClick={handleSave} disabled={!isValid} icon={Save}>
                 Kaydet ve Analiz Et
             </Button>
        </div>
    );
};

const MakeupAnalysisCard = ({
    user,
    onOpenPremium,
    onSave
}: {
    user: UserProfile,
    onOpenPremium?: () => void,
    onSave?: (result: MakeupAnalysis) => void
}) => {
    const isPremium = user.isPremium;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isReset, setIsReset] = useState(false);

    // Sync state with user prop updates (e.g. when analysis is saved)
    useEffect(() => {
        if (user.makeupAnalysis) {
            setIsReset(false);
        }
    }, [user.makeupAnalysis]);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const base64 = ev.target?.result as string;
            const compressed = await compressImage(base64);
            setSelectedImage(compressed);
            setIsReset(false); // New image loaded, exit reset state
        };
        reader.readAsDataURL(file);
    };

    const runAnalysis = async () => {
        if (!selectedImage) return;
        setLoading(true);
        try {
            const result = await analyzeFaceForMakeup(selectedImage);
            if (result && onSave) {
                // Save analysis along with the image
                onSave({ 
                    ...result, 
                    lastAnalyzed: new Date().toISOString(),
                    userImage: selectedImage 
                });
                setSelectedImage(null); // Clear local image to rely on saved userImage
            } else {
                alert("Yüz analizi yapılamadı. Lütfen fotoğrafın net olduğundan emin olun.");
            }
        } catch (e) {
            alert("Bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleCameraClick = () => {
        setSelectedImage(null);
        setIsReset(true);
        // Reset file input value to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    if (!isPremium) {
        return (
            <div className="relative overflow-hidden rounded-2xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark mt-6">
                {/* Main Content (Locked Overlay) - Now dictates height */}
                <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center bg-page/60 dark:bg-black/60 backdrop-blur-sm min-h-[200px]">
                    <Lock size={32} className="text-secondary mb-3" />
                    <h3 className="font-serif font-bold text-lg text-primary dark:text-white mb-2">Yüzüne Göre Makyaj Önerin</h3>
                    <p className="text-sm text-secondary dark:text-secondary-dark mb-6 max-w-[240px]">
                        Makyajsız yüz fotoğrafına göre kişisel makyaj önerileri almak için LOVA Premium’a geç.
                    </p>
                    <Button onClick={onOpenPremium} variant="gold" icon={Crown} className="!py-3 !px-6 !text-xs !w-auto shadow-lg">Premium'a Geç</Button>
                </div>
                
                {/* Dummy Blurred Content */}
                <div className="absolute inset-0 opacity-30 pointer-events-none blur-sm select-none p-6 z-0">
                    <h3 className="text-sm font-bold mb-4">Makyaj Analizi</h3>
                    <div className="h-32 bg-white rounded-xl mb-4"></div>
                </div>
            </div>
        );
    }

    const analysis = user.makeupAnalysis;
    const showResult = analysis && !selectedImage && !isReset;

    if (showResult && analysis) {
        return (
            <div className="bg-surface dark:bg-surface-dark p-6 rounded-2xl border border-transparent mt-6 relative group">
                 {/* Camera Icon acting as RESET + UPLOAD */}
                 <button 
                    onClick={handleCameraClick}
                    className="absolute top-4 right-4 p-2 bg-white dark:bg-white/10 rounded-full text-secondary hover:text-primary transition-colors z-20 shadow-sm"
                    title="Yeni Fotoğraf Yükle"
                >
                    <Camera size={16} />
                </button>

                <h3 className="text-sm font-bold text-primary dark:text-primary-dark mb-4 px-1 flex items-center gap-2">
                    <Smile size={16} className="text-accent" /> Makyaj Önerin
                </h3>
                
                {/* Display Saved User Image if available */}
                {analysis.userImage && (
                    <div className="w-20 h-20 rounded-full border-2 border-page dark:border-page-dark overflow-hidden mx-auto mb-6 shadow-md">
                        <img src={analysis.userImage} className="w-full h-full object-cover" alt="User Face" />
                    </div>
                )}

                <div className="flex gap-4 mb-6">
                    <div className="flex-1 bg-white/50 dark:bg-white/5 p-3 rounded-xl border border-border dark:border-border-dark">
                        <div className="text-[9px] uppercase tracking-wider text-secondary">Cilt Tonu</div>
                        <div className="font-bold text-primary dark:text-white">{analysis.skinTone}</div>
                    </div>
                    <div className="flex-1 bg-white/50 dark:bg-white/5 p-3 rounded-xl border border-border dark:border-border-dark">
                        <div className="text-[9px] uppercase tracking-wider text-secondary">Göz Şekli</div>
                        <div className="font-bold text-primary dark:text-white">{analysis.eyeShape}</div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-page dark:bg-page-dark flex items-center justify-center shrink-0 text-accent">
                            <Eye size={16} />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-primary dark:text-white mb-1">Eyeliner</div>
                            <p className="text-sm text-secondary dark:text-secondary-dark leading-relaxed font-light">{analysis.eyeliner}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-page dark:bg-page-dark flex items-center justify-center shrink-0 text-accent">
                            <Palette size={16} />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-primary dark:text-white mb-1">Far</div>
                            <p className="text-sm text-secondary dark:text-secondary-dark leading-relaxed font-light">{analysis.eyeshadow}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-page dark:bg-page-dark flex items-center justify-center shrink-0 text-accent">
                            <Sun size={16} />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-primary dark:text-white mb-1">Allık</div>
                            <p className="text-sm text-secondary dark:text-secondary-dark leading-relaxed font-light">{analysis.blush}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-page dark:bg-page-dark flex items-center justify-center shrink-0 text-accent">
                            <Heart size={16} />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-primary dark:text-white mb-1">Ruj</div>
                            <p className="text-sm text-secondary dark:text-secondary-dark leading-relaxed font-light">{analysis.lipstick}</p>
                        </div>
                    </div>
                </div>
                
                {/* Hidden input for re-uploading via camera button logic */}
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFile} />
            </div>
        );
    }

    return (
        <div className="bg-surface dark:bg-surface-dark p-6 rounded-2xl border border-border dark:border-border-dark mt-6 animate-fade-in">
             <h3 className="text-sm font-bold text-primary dark:text-primary-dark mb-4 px-1 flex items-center gap-2">
                <Smile size={16} className="text-accent" /> Yüzüne Göre Makyaj Önerin
             </h3>

             {!selectedImage ? (
                 <div className="text-center py-6">
                     <p className="text-sm text-secondary dark:text-secondary-dark mb-4">
                         Yüz hatlarına en uygun makyaj tekniklerini öğrenmek için makyajsız ve aydınlık bir fotoğrafını yükle.
                     </p>
                     <button 
                        onClick={triggerUpload}
                        className="w-full py-8 border-2 border-dashed border-border dark:border-border-dark rounded-2xl hover:bg-page/50 dark:hover:bg-page-dark/20 transition-colors flex flex-col items-center gap-2"
                     >
                        <Camera size={32} className="text-secondary opacity-50" />
                        <span className="text-xs font-bold text-primary dark:text-white">Fotoğraf Seç</span>
                     </button>
                 </div>
             ) : (
                 <div className="space-y-4">
                     <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-page dark:border-page-dark shadow-lg relative">
                         <img src={selectedImage} className="w-full h-full object-cover" />
                     </div>
                     <div className="text-center">
                         {loading ? (
                             <div className="flex flex-col items-center gap-2 text-accent animate-pulse">
                                 <Sparkles size={24} />
                                 <p className="text-sm font-bold">Stil asistanın yüzünü inceliyor...</p>
                             </div>
                         ) : (
                             <div className="flex gap-2">
                                 <Button variant="secondary" onClick={() => setSelectedImage(null)}>Değiştir</Button>
                                 <Button onClick={runAnalysis} icon={Sparkles}>Analiz Et</Button>
                             </div>
                         )}
                     </div>
                 </div>
             )}
             
             <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFile} />
        </div>
    );
};

export const ProfileScreen: React.FC<Props> = ({ user, onBack, onLogout, onOpenPremium, updateUser }) => {
  const joinDate = new Date(user.joinedAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const subEndDate = user.subscriptionEndDate ? new Date(user.subscriptionEndDate).toLocaleDateString('tr-TR') : null;
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleSaveMeasurements = async (m: BodyMeasurements, type: string) => {
      if (updateUser) {
          const newUser = { ...user, bodyMeasurements: m, bodyType: type };
          updateUser(newUser);
          await authService.updateProfile(newUser);
      }
  };

  const handleSaveMakeupAnalysis = async (result: MakeupAnalysis) => {
      if (updateUser) {
          const newUser = { ...user, makeupAnalysis: result };
          updateUser(newUser);
          await authService.updateProfile(newUser);
      }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 1. Convert & Compress
      const reader = new FileReader();
      reader.onload = async (ev) => {
          const base64 = ev.target?.result as string;
          const compressed = await compressImage(base64);

          // 2. Optimistic Update
          if (updateUser) {
              const newUser = { ...user, avatar_url: compressed };
              updateUser(newUser);
              
              // 3. Persist
              await authService.updateProfile(newUser);
          }
      };
      reader.readAsDataURL(file);
  };

  return (
    <div className="h-full flex flex-col bg-page dark:bg-page-dark animate-slide-up overflow-y-auto pb-20">
      
      {/* Header */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between sticky top-0 bg-page/80 dark:bg-page-dark/80 backdrop-blur-xl z-10">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-surface dark:hover:bg-surface-dark rounded-full transition-colors">
          <ArrowLeft size={24} className="text-primary dark:text-primary-dark" />
        </button>
        <h2 className="text-xl font-serif font-bold text-primary dark:text-primary-dark">Profilim</h2>
        <div className="w-10"></div> {/* Spacer for balance */}
      </div>

      <div className="px-6 mt-4">
        {/* Profile Card */}
        <div className="flex flex-col items-center mb-8">
            {/* Clickable Avatar */}
            <input 
                type="file" 
                ref={avatarInputRef} 
                onChange={handleAvatarChange} 
                hidden 
                accept="image/*"
            />
            <button 
                onClick={() => avatarInputRef.current?.click()}
                className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-accent to-accent-soft mb-4 shadow-lg relative group active:scale-95 transition-transform"
            >
                <div className="w-full h-full rounded-full bg-page dark:bg-page-dark overflow-hidden border-4 border-page dark:border-page-dark relative">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface dark:bg-surface-dark text-4xl font-serif text-primary dark:text-primary-dark">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    
                    {/* Hover Overlay for Edit */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white drop-shadow-md" />
                    </div>
                </div>

                {user.isPremium && (
                    <div className="absolute bottom-0 right-0 bg-accent text-white p-2 rounded-full border-4 border-page dark:border-page-dark shadow-sm z-10">
                        <Crown size={14} fill="currentColor" />
                    </div>
                )}
            </button>
            
            <h1 className="text-2xl font-serif font-bold text-primary dark:text-primary-dark">{user.name}</h1>
            <p className="text-secondary dark:text-secondary-dark text-sm font-medium mt-1">{user.email}</p>
            <div className="mt-3 px-3 py-1 bg-surface dark:bg-surface-dark rounded-full text-[10px] font-bold uppercase tracking-widest text-secondary dark:text-secondary-dark">
                {joinDate} tarihinden beri üye
            </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-surface dark:bg-surface-dark p-5 rounded-2xl border border-transparent hover:border-border dark:border-border-dark transition-colors">
                <div className="flex items-center gap-2 mb-2 text-accent">
                    <BarChart2 size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Dolap</span>
                </div>
                <div className="text-2xl font-serif text-primary dark:text-white font-bold">{user.usage.wardrobeCount}</div>
                <div className="text-xs text-secondary dark:text-secondary-dark">Parça Eklendi</div>
            </div>
            <div className="bg-surface dark:bg-surface-dark p-5 rounded-2xl border border-transparent hover:border-border dark:border-border-dark transition-colors">
                <div className="flex items-center gap-2 mb-2 text-accent">
                    <Calendar size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Analiz</span>
                </div>
                <div className="text-2xl font-serif text-primary dark:text-white font-bold">{user.usage.dailyScanCount}</div>
                <div className="text-xs text-secondary dark:text-secondary-dark">Bugünkü Kullanım</div>
            </div>
        </div>

        {/* Premium Body Measurements Feature */}
        <BodyMeasurementsCard 
            user={user} 
            onOpenPremium={onOpenPremium} 
            onSave={handleSaveMeasurements}
        />

        {/* Premium Makeup Analysis Feature */}
        <MakeupAnalysisCard
            user={user}
            onOpenPremium={onOpenPremium}
            onSave={handleSaveMakeupAnalysis}
        />

        {/* Subscription Info */}
        <div className="mb-8 mt-8">
            <h3 className="text-sm font-bold text-primary dark:text-primary-dark mb-4 px-1">Üyelik Durumu</h3>
            <div className="bg-gradient-to-br from-primary to-[#2a1e1b] dark:from-surface-dark dark:to-black rounded-2xl p-6 text-page relative overflow-hidden shadow-soft">
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.2em] opacity-70 mb-1">Mevcut Plan</div>
                            <div className="text-2xl font-serif italic">{user.isPremium ? 'Lova Premium' : 'Lova Free'}</div>
                        </div>
                        {user.isPremium && <Crown size={24} className="text-accent" />}
                    </div>
                    
                    {user.isPremium ? (
                        <div className="text-sm opacity-80 font-light">
                            Üyeliğiniz <span className="font-bold text-accent">{subEndDate}</span> tarihine kadar aktiftir.
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm opacity-80 font-light mb-4">Daha fazla özellik için Premium'a geçin.</p>
                            <Button onClick={onOpenPremium} variant="gold" className="!py-3 !text-xs">Yükselt</Button>
                        </div>
                    )}
                </div>
                {/* Decoration */}
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-accent/10 rounded-full blur-2xl"></div>
            </div>
        </div>

        {/* Account Actions */}
        <div className="space-y-3">
             <h3 className="text-sm font-bold text-primary dark:text-primary-dark mb-2 px-1">Hesap</h3>
             
             <button className="w-full flex items-center gap-4 p-4 bg-white dark:bg-white/5 border border-border dark:border-border-dark rounded-xl text-left hover:bg-surface dark:hover:bg-surface-dark transition-colors">
                <div className="w-8 h-8 rounded-full bg-surface dark:bg-surface-dark flex items-center justify-center text-primary dark:text-white">
                    <User size={16} />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-bold text-primary dark:text-white">Kişisel Bilgiler</div>
                    <div className="text-xs text-secondary dark:text-secondary-dark">İsim ve stil tercihlerini düzenle</div>
                </div>
             </button>

             <button className="w-full flex items-center gap-4 p-4 bg-white dark:bg-white/5 border border-border dark:border-border-dark rounded-xl text-left hover:bg-surface dark:hover:bg-surface-dark transition-colors">
                <div className="w-8 h-8 rounded-full bg-surface dark:bg-surface-dark flex items-center justify-center text-primary dark:text-white">
                    <Mail size={16} />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-bold text-primary dark:text-white">E-posta Tercihleri</div>
                    <div className="text-xs text-secondary dark:text-secondary-dark">{user.email}</div>
                </div>
             </button>

             <button onClick={onLogout} className="w-full flex items-center gap-4 p-4 mt-6 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors">
                <LogOut size={18} />
                <span className="text-sm font-bold">Çıkış Yap</span>
             </button>
        </div>

      </div>
    </div>
  );
};
