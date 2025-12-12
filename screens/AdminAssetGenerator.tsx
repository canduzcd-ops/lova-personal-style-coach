import React, { useState, useEffect } from 'react';
import { X, Video, Loader2, Play, Check, AlertCircle, Save } from 'lucide-react';
import { Button, Input } from '../components/Shared';
import { generateFashionVideo } from '../services/aiService';

interface Props {
  onClose: () => void;
}

export const AdminAssetGenerator: React.FC<Props> = ({ onClose }) => {
  // Pre-filled with the user's specific request
  const [prompt, setPrompt] = useState("A premium, Vogue-style fashion abstract background. Modern, luxurious, stylish, and visually captivating. Elegant color palette, chic atmosphere, fashion-forward mood. Subtle movement, seamless loop.");
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    // @ts-ignore
    const has = await window.aistudio?.hasSelectedApiKey();
    setHasKey(!!has);
  };

  const handleSelectKey = async () => {
    try {
      // @ts-ignore
      await window.aistudio?.openSelectKey();
      // Assume success if no error, recheck logic in a real app might be more robust
      setHasKey(true);
    } catch (e) {
      console.error(e);
      alert("API Anahtarı seçimi başarısız.");
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    
    // Ensure key is selected before starting
    // @ts-ignore
    if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
        await handleSelectKey();
    }

    setLoading(true);
    setStatus('Yapay Zeka Hazırlanıyor...');
    setVideoUrl(null);

    try {
      setStatus('Video Oluşturuluyor (Bu işlem biraz sürebilir)...');
      const url = await generateFashionVideo(prompt);
      
      if (url) {
        setVideoUrl(url);
        setStatus('Tamamlandı!');
      } else {
        setStatus('Video oluşturulamadı.');
      }
    } catch (e: any) {
      console.error(e);
      setStatus(`Hata: ${e.message || 'Bilinmeyen hata'}`);
      // If entity not found, might need to re-select key
      if (e.message?.includes('Requested entity was not found')) {
          setHasKey(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetSplash = () => {
    if (videoUrl) {
      // Store as Data URL if possible, but for large videos Blob URL is temporary.
      // For this demo, we will try to persist it simply or mock the persistence.
      // Ideally, upload to storage. Here we just set it to local storage as a flag or blob if small enough.
      // Warning: Blob URLs are session specific. We need to convert to base64 for persistent localStorage demo.
      
      fetch(videoUrl)
        .then(r => r.blob())
        .then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                try {
                    localStorage.setItem('lova_splash_video', base64);
                    alert("Açılış videosu güncellendi!");
                    onClose();
                } catch (e) {
                    alert("Video çok büyük, tarayıcı hafızasına kaydedilemedi.");
                }
            };
            reader.readAsDataURL(blob);
        });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="px-6 py-6 border-b border-white/10 flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                <Video size={24} className="text-lova-accent"/> Splash Studio
            </h2>
            <p className="text-stone-400 text-xs mt-1">Gemini Veo ile özel açılış videosu üret.</p>
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"><X size={20}/></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 max-w-2xl mx-auto w-full">
         {!hasKey ? (
             <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-2xl text-center">
                 <AlertCircle size={32} className="mx-auto text-yellow-500 mb-4" />
                 <h3 className="text-white text-lg font-bold mb-2">Paid API Key Gerekli</h3>
                 <p className="text-stone-400 text-sm mb-6">Video üretimi için GCP projesine bağlı ücretli bir API anahtarı seçmelisiniz.</p>
                 <Button onClick={handleSelectKey} variant="gold" className="w-auto px-8 mx-auto">API Anahtarı Seç</Button>
                 <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="block mt-4 text-xs text-stone-500 hover:text-white underline">Faturalandırma hakkında bilgi al</a>
             </div>
         ) : (
             <div className="space-y-8">
                 <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                     <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Prompt (Komut)</label>
                     <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm h-32 focus:border-lova-accent outline-none leading-relaxed"
                     />
                     <div className="mt-4 flex justify-end">
                         <Button onClick={handleGenerate} disabled={loading} className="w-auto px-8">
                             {loading ? <Loader2 className="animate-spin" size={20}/> : <><Video size={18} /> Video Oluştur</>}
                         </Button>
                     </div>
                     {status && (
                         <div className="mt-4 text-center">
                             <p className={`text-sm ${status.includes('Hata') ? 'text-red-400' : 'text-stone-300'} animate-pulse`}>{status}</p>
                         </div>
                     )}
                 </div>

                 {videoUrl && (
                     <div className="animate-fade-in">
                         <div className="aspect-[9/16] w-full max-w-xs mx-auto bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative group">
                             <video 
                                src={videoUrl} 
                                autoPlay 
                                loop 
                                muted 
                                playsInline
                                className="w-full h-full object-cover"
                             />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <p className="text-white font-serif italic">Önizleme</p>
                             </div>
                         </div>
                         <div className="mt-6 flex justify-center gap-4">
                             <Button variant="secondary" onClick={() => setVideoUrl(null)} className="w-auto px-8">Vazgeç</Button>
                             <Button variant="gold" onClick={handleSetSplash} icon={Save} className="w-auto px-8">Uygula</Button>
                         </div>
                     </div>
                 )}
             </div>
         )}
      </div>
    </div>
  );
};
