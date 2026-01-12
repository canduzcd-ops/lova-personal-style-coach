import * as Sentry from '@sentry/react';

// Event name whitelist - all trackable events
export type EventName = 
  // Auth
  | 'auth_login_success'
  | 'auth_login_failed'
  | 'auth_register_success'
  | 'auth_register_failed'
  // Onboarding
  | 'onboarding_shown'
  | 'onboarding_step_done'
  // Wardrobe
  | 'wardrobe_add_start'
  | 'wardrobe_add_success'
  | 'wardrobe_add_failed'
  // AI
  | 'ai_analyze_start'
  | 'ai_analyze_success'
  | 'ai_analyze_failed'
  | 'ai_generate_start'
  | 'ai_generate_success'
  | 'ai_generate_failed'
  // Monetization
  | 'premium_opened'
  | 'premium_purchase_start'
  | 'premium_purchase_success'
  | 'premium_purchase_failed'
  | 'premium_restore_start'
  | 'premium_restore_success'
  | 'premium_restore_failed'
  // Push/Notifications
  | 'push_register_start'
  | 'push_register_success'
  | 'push_register_failed'
  | 'notif_enable_start'
  | 'notif_enable_success'
  | 'notif_enable_failed'
  // Push Tokens (Firestore persistence)
  | 'push_token_upsert_success'
  | 'push_token_upsert_failed'
  | 'push_token_disable_success'
  | 'push_token_disable_failed'
  // Engagement
  | 'engagement_notif_sent'
  | 'engagement_notif_blocked';

export interface EventProps {
  // Auth
  hasUser?: boolean;
  error?: string;
  errorCode?: string;
  
  // Onboarding
  step?: string; // 'add-item' | 'analyze' | 'generate' | 'wardrobe'
  
  // Wardrobe
  hasImage?: boolean;
  reason?: string;
  
  // AI
  modelVersion?: string;
  durationMs?: number;
  
  // Monetization
  source?: string;
  plan?: 'monthly' | 'yearly' | 'lifetime';
  
  // Generic
  [key: string]: string | number | boolean | undefined;
}

export function initTelemetry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    tracesSampleRate: 0.0,
  });
}

export function setUserContext(user?: { id?: string; email?: string }): void {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
  });
}

export function captureError(err: unknown, extra?: Record<string, any>): void {
  const normalizedError = err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Unknown error');

  Sentry.withScope((scope) => {
    if (extra) scope.setExtras(extra);
    scope.setFingerprint([normalizedError.message]);
    Sentry.captureException(normalizedError);
  });
}

/**
 * Track custom event for analytics
 * @param eventName - Event identifier (whitelisted)
 * @param props - Event properties (max 20 keys, no PII)
 */
export function track(eventName: EventName, props?: EventProps): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return; // No-op if Sentry not configured

  // Validate props (max 20 keys)
  if (props && Object.keys(props).length > 20) {
    console.warn('[telemetry] Event props exceed 20 keys, truncating');
  }

  // Use Sentry.captureMessage with breadcrumb for tracking
  Sentry.withScope((scope) => {
    scope.setTag('event_name', eventName);
    
    // Add props as context
    const safeProps = props
      ? Object.fromEntries(
          Object.entries(props).slice(0, 20) // Limit to 20 keys
        )
      : {};
    
    scope.setContext('event_props', safeProps);
    scope.setLevel('info');
    
    Sentry.captureMessage(eventName, 'info');
  });
}
