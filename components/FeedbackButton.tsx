// components/FeedbackButton.tsx
import React, { useState } from 'react';
import { Toast } from './Toast';

export const FeedbackButton: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleSend = async () => {
    setSending(true);
    // TODO: Replace with real feedback sending logic (e.g. API, email, etc.)
    setTimeout(() => {
      setSending(false);
      setShowToast(true);
      setFeedback('');
    }, 1200);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <button
        className="bg-accent text-white rounded-full px-4 py-2 shadow-lg hover:bg-accent-dark transition"
        onClick={() => setShowToast(false)}
        style={{ marginBottom: 8 }}
      >
        Geri Bildirim
      </button>
      <div className="bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-2xl p-4 shadow-xl mt-2 w-72">
        <textarea
          className="w-full rounded-lg border border-border dark:border-border-dark p-2 text-sm mb-2"
          rows={3}
          placeholder="Sorun, öneri veya hata bildir..."
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
        />
        <button
          className="bg-accent text-white rounded-lg px-4 py-2 w-full disabled:opacity-50"
          disabled={sending || !feedback.trim()}
          onClick={handleSend}
        >
          {sending ? 'Gönderiliyor...' : 'Gönder'}
        </button>
      </div>
      {showToast && (
        <Toast
          type="success"
          title="Teşekkürler!"
          desc="Geri bildiriminiz alındı."
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};
