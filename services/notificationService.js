import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { track } from './telemetry';
import * as engagementLocal from './engagementLocal';
export const notificationService = {
    // Check if notifications are enabled in app prefs AND browser
    isEnabled: () => {
        if (typeof window === 'undefined')
            return false;
        return localStorage.getItem('lova_notifications_enabled') === 'true' && Notification.permission === 'granted';
    },
    // Request browser permission and save preference
    requestPermission: async () => {
        track('notif_enable_start', {});
        if (!('Notification' in window)) {
            console.warn('This browser does not support desktop notification');
            track('notif_enable_failed', { reason: 'unsupported' });
            return false;
        }
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                localStorage.setItem('lova_notifications_enabled', 'true');
                engagementLocal.setNotifEnabled(true);
                track('notif_enable_success', {});
                return true;
            }
            track('notif_enable_failed', { reason: 'permission_denied' });
            return false;
        }
        catch (error) {
            track('notif_enable_failed', { reason: String(error) });
            throw error;
        }
    },
    // Disable locally without revoking browser permission (which is hard to do via JS)
    disable: () => {
        localStorage.setItem('lova_notifications_enabled', 'false');
        engagementLocal.setNotifEnabled(false);
    },
    // Send a notification if allowed
    send: (title, body) => {
        if (typeof window === 'undefined' || !('Notification' in window))
            return;
        // Check internal preference AND browser permission
        if (localStorage.getItem('lova_notifications_enabled') === 'true' && Notification.permission === 'granted') {
            try {
                new Notification(title, {
                    body,
                    icon: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=128&h=128&fit=crop&fm=jpg', // Fashion placeholder icon
                    silent: false
                });
            }
            catch (e) {
                console.error("Notification sending failed", e);
            }
        }
    }
};
export function isSupported() {
    return Capacitor.isNativePlatform();
}
async function ensurePermission() {
    const current = await LocalNotifications.checkPermissions();
    if (current.display === 'granted')
        return true;
    const requested = await LocalNotifications.requestPermissions();
    return requested.display === 'granted';
}
export async function enable() {
    if (!isSupported())
        return;
    const granted = await ensurePermission();
    if (!granted)
        return;
    const now = Date.now();
    await LocalNotifications.schedule({
        notifications: [
            {
                id: Math.floor(now % 2147483647),
                title: 'LOVA bildirim testi',
                body: 'Bildirimler açıldı. Bu yalnızca bir testtir.',
                schedule: { at: new Date(now + 5000) },
            },
        ],
    });
}
export async function cancelAll() {
    if (!isSupported())
        return;
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
    }
    await LocalNotifications.removeAllDeliveredNotifications();
}
