import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './src/styles/tailwind.css';
import './src/i18n'; // ensure i18n init runs before App
import { initTelemetry } from './services/telemetry';

// Early boot diagnostics to catch blank screen
console.log('[BOOT] index.tsx loaded');
window.addEventListener('error', (e) => {
  console.error('[BOOT][window.onerror]', (e as any)?.error || e?.message || e);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[BOOT][unhandledrejection]', (e as any)?.reason || e);
});

initTelemetry();

const ErrorFallback = () => (
  <div
    style={{
      margin: '2rem auto',
      maxWidth: '480px',
      padding: '1.5rem',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
      background: '#fff',
      color: '#111827',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}
  >
    <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
      Bir şeyler ters gitti
    </h2>
    <p style={{ margin: 0, lineHeight: 1.5 }}>
      Sayfayı yenilemeyi deneyin. Sorun devam ederse lütfen daha sonra tekrar gelin.
    </p>
  </div>
);

function showFatalScreen(title: string, err: any) {
  try {
    const root = document.getElementById('root');
    if (!root) return;

    const message =
      err?.message ||
      (typeof err === 'string' ? err : '') ||
      JSON.stringify(err, null, 2) ||
      'Unknown error';

    const stack = err?.stack ? String(err.stack) : '';

    root.innerHTML = `
      <div style="min-height:100vh;background:#b00020;color:#fff;padding:16px;font-family:monospace;white-space:pre-wrap;">
        <div style="font-weight:800;font-size:16px;margin-bottom:10px;">FATAL (index.tsx)</div>
        <div style="opacity:.9;margin-bottom:8px;">${title}</div>
        <div>${message}</div>
        ${stack ? `<hr style="margin:12px 0;opacity:.4;" /><div style="opacity:.9;">${stack}</div>` : ''}
      </div>
    `;
  } catch {
    // swallow
  }
}

// 1) Render öncesi global hataları yakala (React daha başlamadan patlayabilir)
window.addEventListener('error', (event) => {
  console.error('[window.onerror]', event.error || event.message);
  showFatalScreen('window.onerror', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  console.error('[unhandledrejection]', event.reason);
  showFatalScreen('unhandledrejection', event.reason);
});

// 2) Telemetry init (render’dan önce patlarsa beyaz ekran olurdu → artık yakalayacağız)
try {
  console.log('[BOOT] initTelemetry() start');
  initTelemetry();
  console.log('[BOOT] initTelemetry() ok');
} catch (e) {
  console.error('[BOOT] initTelemetry() failed', e);
}

// 3) Mobile viewport height fix (klavye açılınca layout bozulmasını önler)
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setViewportHeight();
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', () => {
  setTimeout(setViewportHeight, 100);
});

// 4) React mount
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('id="root" olan kök element bulunamadı');
  showFatalScreen('root element not found', new Error('Missing #root element'));
} else {
  console.log('[BOOT] ReactDOM.createRoot');
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
        <App />
      </Sentry.ErrorBoundary>
    </React.StrictMode>
  );

  console.log('[BOOT] root.render called');
}
