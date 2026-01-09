import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './src/i18n'; // ensure i18n init runs before App
import { initTelemetry } from './services/telemetry';
initTelemetry();
const ErrorFallback = () => (_jsxs("div", { style: {
        margin: '2rem auto',
        maxWidth: '480px',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
        background: '#fff',
        color: '#111827',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }, children: [_jsx("h2", { style: { margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 700 }, children: "Bir \u015Feyler ters gitti" }), _jsx("p", { style: { margin: 0, lineHeight: 1.5 }, children: "Sayfay\u0131 yenilemeyi deneyin. Sorun devam ederse l\u00FCtfen daha sonra tekrar gelin." })] }));
const rootElement = document.getElementById('root');
if (!rootElement) {
    console.error('id="root" olan kök element bulunamadı');
}
else {
    const root = ReactDOM.createRoot(rootElement);
    root.render(_jsx(React.StrictMode, { children: _jsx(Sentry.ErrorBoundary, { fallback: _jsx(ErrorFallback, {}), children: _jsx(App, {}) }) }));
}
