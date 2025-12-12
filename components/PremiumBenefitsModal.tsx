import React from 'react';
import { X, Check, Minus } from 'lucide-react';
import { Button } from './Shared';

interface Props {
  onClose: () => void;
  onUpgrade?: () => void;
  isPremium: boolean;
}

export const PremiumBenefitsModal: React.FC<Props> = ({ onClose, onUpgrade, isPremium }) => {
  const benefits = [
    { name: "Gardırop Kapasitesi", free: "20 Parça", premium: "Sınırsız" },
    { name: "Günlük AI Analiz", free: "3 Adet", premium: "Sınırsız" },
    { name: "Kombin Önerileri", free: "Temel", premium: "Gelişmiş" },
    { name: "Stil İpuçları", free: "Standart", premium: "Kişiselleştirilmiş" },
    { name: "Reklamsız Deneyim", free: false, premium: true },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-white dark:bg-[#09090b] flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-[#09090b]">
            <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white">Üyelik Özellikleri</h2>
            <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X size={20} className="text-gray-900 dark:text-white" />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
            <div className="bg-gray-50 dark:bg-[#1E1E1E] rounded-3xl p-1 mb-6 flex text-sm font-bold text-gray-500 dark:text-gray-400">
                 <div className="flex-1 py-2 text-center">Özellik</div>
                 <div className="w-20 py-2 text-center">Free</div>
                 <div className="w-24 py-2 text-center text-lova-black dark:text-white">Premium</div>
            </div>

            <div className="space-y-6">
                {benefits.map((item, i) => (
                    <div key={i} className="flex items-center text-sm border-b border-gray-50 dark:border-gray-800 pb-4 last:border-0">
                        <div className="flex-1 font-medium text-gray-800 dark:text-gray-200">{item.name}</div>
                        <div className="w-20 text-center text-gray-500 dark:text-gray-500 text-xs">
                            {typeof item.free === 'boolean' ? (item.free ? <Check size={16} className="mx-auto"/> : <Minus size={16} className="mx-auto"/>) : item.free}
                        </div>
                        <div className="w-24 text-center font-bold text-lova-nude text-xs">
                             {typeof item.premium === 'boolean' ? (item.premium ? <Check size={16} className="mx-auto"/> : <Minus size={16} className="mx-auto"/>) : item.premium}
                        </div>
                    </div>
                ))}
            </div>
            
            {!isPremium && onUpgrade && (
                 <div className="mt-8">
                    <Button onClick={onUpgrade}>Premium'a Yükselt</Button>
                 </div>
            )}
        </div>
    </div>
  );
};