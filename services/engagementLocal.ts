/**
 * Local engagement preferences and tracking
 * Manages notification settings and rate limiting
 */

export interface EngagementPreferences {
  notifEnabled: boolean;
  pushEnabled: boolean;
  quietHours: {
    start: number; // 22 (10 PM)
    end: number;   // 9 (9 AM)
  };
  lastSent: Record<string, number>; // key -> timestamp
}

const KEY = 'lova_engagement_v1';

const DEFAULT_PREFS: EngagementPreferences = {
  notifEnabled: false,
  pushEnabled: false,
  quietHours: { start: 22, end: 9 },
  lastSent: {},
};

function safeParse(): EngagementPreferences {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return DEFAULT_PREFS;
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      notifEnabled: Boolean(parsed?.notifEnabled),
      pushEnabled: Boolean(parsed?.pushEnabled),
      quietHours: parsed?.quietHours ? {
        start: Number(parsed.quietHours.start) || 22,
        end: Number(parsed.quietHours.end) || 9,
      } : DEFAULT_PREFS.quietHours,
      lastSent: typeof parsed?.lastSent === 'object' ? parsed.lastSent : {},
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function save(prefs: EngagementPreferences): void {
  if (typeof window === 'undefined' || !('localStorage' in window)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Check if current time is within quiet hours
 * Quiet hours example: 22:00–09:00 (no notifications)
 */
export function isInQuietHours(date = new Date()): boolean {
  const prefs = safeParse();
  const currentHour = date.getHours();
  const { start, end } = prefs.quietHours;

  // If start < end (e.g., 9–17), simple range
  // If start > end (e.g., 22–9), it wraps midnight
  if (start < end) {
    return currentHour >= start && currentHour < end;
  }
  return currentHour >= start || currentHour < end;
}

/**
 * Check if enough time has passed since last send
 * @param key - Event identifier
 * @param cooldownHours - Minimum hours between sends
 */
export function canSend(key: string, cooldownHours: number): boolean {
  const prefs = safeParse();
  const lastTime = prefs.lastSent[key];
  if (!lastTime) return true;

  const now = Date.now();
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  return now - lastTime >= cooldownMs;
}

/**
 * Mark event as sent, updating lastSent
 */
export function markSent(key: string): void {
  const prefs = safeParse();
  prefs.lastSent[key] = Date.now();
  save(prefs);
}

/**
 * Set notification enabled status
 */
export function setNotifEnabled(enabled: boolean): void {
  const prefs = safeParse();
  prefs.notifEnabled = enabled;
  save(prefs);
}

/**
 * Get notification enabled status
 */
export function isNotifEnabled(): boolean {
  return safeParse().notifEnabled;
}

/**
 * Set push enabled status
 */
export function setPushEnabled(enabled: boolean): void {
  const prefs = safeParse();
  prefs.pushEnabled = enabled;
  save(prefs);
}

/**
 * Get push enabled status
 */
export function isPushEnabled(): boolean {
  return safeParse().pushEnabled;
}

/**
 * Get all preferences
 */
export function getPreferences(): EngagementPreferences {
  return safeParse();
}

/**
 * Get quiet hours
 */
export function getQuietHours() {
  return safeParse().quietHours;
}
