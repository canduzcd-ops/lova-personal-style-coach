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
export function setUserContext(user) {
    if (!user) {
        Sentry.setUser(null);
        return;
    }
    Sentry.setUser({
        id: user.id,
        email: user.email,
    });
}
export function captureError(err, extra) {
    const normalizedError = err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Unknown error');
    Sentry.withScope((scope) => {
        if (extra)
            scope.setExtras(extra);
        scope.setFingerprint([normalizedError.message]);
        Sentry.captureException(normalizedError);
    });
}
/**
 * Track custom event for analytics
 * @param eventName - Event identifier (whitelisted)
 * @param props - Event properties (max 20 keys, no PII)
 */
export function track(eventName, props) {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (!dsn)
        return; // No-op if Sentry not configured
    // Validate props (max 20 keys)
    if (props && Object.keys(props).length > 20) {
        console.warn('[telemetry] Event props exceed 20 keys, truncating');
    }
    // Use Sentry.captureMessage with breadcrumb for tracking
    Sentry.withScope((scope) => {
        scope.setTag('event_name', eventName);
        // Add props as context
        const safeProps = props
            ? Object.fromEntries(Object.entries(props).slice(0, 20) // Limit to 20 keys
            )
            : {};
        scope.setContext('event_props', safeProps);
        scope.setLevel('info');
        Sentry.captureMessage(eventName, 'info');
    });
}
