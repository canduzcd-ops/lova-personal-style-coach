import React from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  label?: string;
  tone?: 'default' | 'muted';
}

export const InlineLoader: React.FC<Props> = ({ label = 'Yükleniyor...', tone = 'default' }) => {
  const textClass =
    tone === 'muted'
      ? 'text-secondary dark:text-secondary-dark'
      : 'text-primary dark:text-primary-dark';

  return (
    <div className="flex items-center gap-3 justify-center py-6">
      <Loader2 className="animate-spin text-accent" size={22} />
      <span className={`text-sm font-medium ${textClass}`}>{label}</span>
    </div>
  );
};
