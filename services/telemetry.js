import * as Sentry from '@sentry/react';
export function initTelemetry() {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (!dsn)
        return;
    Sentry.init({
        dsn,
        tracesSampleRate: 0.0,
    });
}
