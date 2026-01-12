/**
 * Engagement service: Smart notifications with quiet hours and cooldown
 */
import { Capacitor } from '@capacitor/core';
import { notificationService } from './notificationService';
import { track } from './telemetry';
import * as engagementLocal from './engagementLocal';
const NOTIFICATION_CONFIG = {
    outfit_generated_success: {
        cooldownHours: 6,
        payload: {
            title: 'Kombinin hazır ✅',
            body: 'Geçmişte kaydedildi.',
            delayMs: 2000,
        },
    },
    wardrobe_first_item_added: {
        cooldownHours: 24,
        payload: {
            title: 'Harika!',
            body: 'Şimdi 1 dokunuşla kombin üret.',
        },
    },
    dormant_nudge: {
        cooldownHours: 72,
        payload: {
            title: 'Seni özledik 😊',
            body: 'Dolabına göre yeni kombin önerelim mi?',
            delayMs: 3600000, // 1 hour
        },
    },
};
/**
 * Check if we should send a notification
 * Blocks if: quiet hours, cooldown active, disabled, or web platform
 */
function shouldNotify(key) {
    const isNative = Capacitor.isNativePlatform();
    if (!isNative) {
        return { allowed: false, reason: 'web' };
    }
    if (!engagementLocal.isNotifEnabled()) {
        return { allowed: false, reason: 'disabled' };
    }
    if (engagementLocal.isInQuietHours()) {
        return { allowed: false, reason: 'quiet' };
    }
    if (!engagementLocal.canSend(key, NOTIFICATION_CONFIG[key].cooldownHours)) {
        return { allowed: false, reason: 'cooldown' };
    }
    return { allowed: true };
}
/**
 * Maybe send a notification based on engagement rules
 * Returns true if notification was sent, false if blocked
 */
export async function maybeNotify(eventKey, _payload) {
    const { allowed, reason } = shouldNotify(eventKey);
    if (!allowed) {
        track('engagement_notif_blocked', { key: eventKey, reason: reason || 'unknown' });
        return false;
    }
    // Send local notification
    const config = NOTIFICATION_CONFIG[eventKey];
    const sendNotification = () => {
        notificationService.send(config.payload.title, config.payload.body);
    };
    if (config.payload.delayMs && config.payload.delayMs > 0) {
        setTimeout(sendNotification, config.payload.delayMs);
    }
    else {
        sendNotification();
    }
    engagementLocal.markSent(eventKey);
    track('engagement_notif_sent', { key: eventKey });
    return true;
}
/**
 * Check if user is dormant (hasn't opened app in 3 days)
 * Returns true if dormant, false otherwise
 */
function isDormant() {
    if (typeof window === 'undefined' || !('localStorage' in window)) {
        return false;
    }
    const LAST_ACTIVE_KEY = 'lova_last_active';
    const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
    if (!lastActive) {
        // First time, mark as active and not dormant
        localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
        return false;
    }
    const daysDiff = (Date.now() - Number(lastActive)) / (1000 * 60 * 60 * 24);
    return daysDiff >= 3;
}
/**
 * Update last active timestamp
 */
export function updateLastActive() {
    if (typeof window === 'undefined' || !('localStorage' in window))
        return;
    localStorage.setItem('lova_last_active', Date.now().toString());
}
/**
 * Check dormant status and schedule notification if needed
 * Call this on app startup
 */
export async function checkDormantAndNotify() {
    const isNative = Capacitor.isNativePlatform();
    if (!isNative)
        return; // Web doesn't need dormant check
    if (isDormant()) {
        await maybeNotify('dormant_nudge');
    }
    updateLastActive();
}
