import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './src/i18n'; // ensure i18n init runs before App
import { initTelemetry } from './services/telemetry';

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

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('id="root" olan kök element bulunamadı');
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
        <App />
      </Sentry.ErrorBoundary>
    </React.StrictMode>
  );
}
