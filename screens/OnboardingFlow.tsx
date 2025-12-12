import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Button, Input } from '../components/Shared';
import { STYLE_OPTIONS } from '../constants';

interface Props {
  onComplete: (data: { name: string; styles: string[] }) => void;
  initialName?: string;
}

export const OnboardingFlow: React.FC<Props> = ({ onComplete, initialName }) => {
  const [step, setStep] = useState<'intro' | 'details'>('intro');
  const [name, setName] = useState(initialName || '');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  const toggleStyle = (id: string) => {
    setSelectedStyles(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  if (step === 'intro') {
    return (
      <div className="fixed inset-0 bg-page text-primary flex flex-col items-center justify-end pb-12 px-8">
        <div className="absolute inset-0 z-0">
             <img 
                src="https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=1287&auto=format&fit=crop"
                className="w-full h-full object-cover opacity-90"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-page via-page/60 to-transparent"></div>
        </div>
        
        <div className="relative z-10 w-full mb-8">
           <h1 className="text-5xl font-serif mb-4 leading-[1.1] text-primary">Stilini<br/><span className="italic text-accent">Yönet.</span></h1>
           <p className="text-secondary text-sm font-medium leading-relaxed max-w-xs mb-8">
               Yapay zeka asistanın ile gardırobunu sadeleştir, her gün en iyi halinle görün.
           </p>
           <Button onClick={() => setStep('details')} icon={ArrowRight} className="shadow-soft">Başlayalım</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-page dark:bg-page-dark flex flex-col p-8 animate-in slide-in-from-bottom duration-500">
       <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
           <div className="w-12 h-1 bg-border mb-6 rounded-full"></div>
           <h2 className="text-3xl font-serif text-primary dark:text-primary-dark mb-2">Tanışalım</h2>
           <p className="text-secondary dark:text-secondary-dark text-sm mb-8">Sana özel öneriler sunabilmemiz için.</p>
           
           <div className="mb-10">
               <Input label="Adın Nedir?" value={name} onChange={setName} placeholder="İsim giriniz..." />
           </div>

           <h3 className="text-[10px] font-bold text-secondary dark:text-secondary-dark uppercase tracking-[0.2em] mb-4">Hangi stilleri seversin?</h3>
           <div className="grid grid-cols-2 gap-3">
               {STYLE_OPTIONS.map(style => (
                   <button 
                    key={style.id}
                    onClick={() => toggleStyle(style.id)}
                    className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                        selectedStyles.includes(style.id) 
                            ? 'bg-primary text-page border-primary dark:bg-primary-dark dark:text-page dark:border-primary-dark shadow-lg' 
                            : 'bg-surface border-transparent text-secondary dark:text-secondary-dark hover:border-border'
                    }`}
                   >
                       <span className="font-serif block text-lg">{style.label}</span>
                   </button>
               ))}
           </div>
       </div>

       <div className="pt-6 bg-page dark:bg-page-dark">
           <Button 
            onClick={() => onComplete({ name, styles: selectedStyles })} 
            disabled={!name || selectedStyles.length === 0}
            className="!py-4 shadow-xl"
           >
               Uygulamaya Gir
           </Button>
       </div>
    </div>
  );
};