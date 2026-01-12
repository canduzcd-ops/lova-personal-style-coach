import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { captureError, track } from './telemetry';
import * as engagementLocal from './engagementLocal';
import { upsertToken } from './pushTokenService';
export const pushService = {
    isSupported() {
        return Capacitor.isNativePlatform();
    },
    async register() {
        track('push_register_start', {});
        try {
            if (!this.isSupported()) {
                console.warn('Push not supported on this platform');
                track('push_register_failed', { reason: 'unsupported' });
                return;
            }
            const perm = await PushNotifications.requestPermissions();
            if (perm.receive !== 'granted') {
                console.warn('Push permission not granted');
                track('push_register_failed', { reason: 'permission_denied' });
                return;
            }
            PushNotifications.addListener('registration', (token) => {
                console.log('Push token', token.value);
                engagementLocal.setPushEnabled(true);
                // Persist token to Firestore
                const platform = Capacitor.getPlatform();
                if (platform === 'ios' || platform === 'android') {
                    upsertToken({ token: token.value, platform: platform })
                        .catch(err => {
                        console.warn('Failed to persist token to Firestore', err);
                        // Don't throw - allow push registration to succeed even if persistence fails
                    });
                }
                track('push_register_success', {});
            });
            PushNotifications.addListener('registrationError', (error) => {
                captureError('push_register_failed', { error });
                track('push_register_failed', { reason: String(error) });
            });
            await PushNotifications.register();
        }
        catch (err) {
            captureError('push_register_failed', { error: err });
            track('push_register_failed', { reason: String(err) });
        }
    },
};
