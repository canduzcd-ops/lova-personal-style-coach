import React from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { Button } from './Shared';

type StateType = 'loading' | 'empty' | 'error';

interface Props {
  type: StateType;
  title: string;
  desc?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const StateCard: React.FC<Props> = ({ type, title, desc, actionLabel, onAction }) => {
  const isLoading = type === 'loading';
  const icon = isLoading ? (
    <Loader2 size={28} className="animate-spin text-accent" />
  ) : type === 'empty' ? (
    <Inbox size={28} className="text-secondary dark:text-secondary-dark" />
  ) : (
    <AlertCircle size={28} className="text-red-500" />
  );

  const toneClasses =
    type === 'error'
      ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20'
      : 'bg-surface dark:bg-surface-dark border-border/60 dark:border-border-dark/60';

  return (
    <div className={`w-full text-center rounded-2xl border p-5 flex flex-col items-center gap-3 ${toneClasses}`}>
      <div className="w-12 h-12 rounded-full bg-page dark:bg-page-dark flex items-center justify-center shadow-inner">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-serif font-bold text-primary dark:text-primary-dark">{title}</h3>
        {desc && <p className="text-sm text-secondary dark:text-secondary-dark mt-1 max-w-sm">{desc}</p>}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} fullWidth={false} className="!py-2 !px-5 !text-[11px]">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
