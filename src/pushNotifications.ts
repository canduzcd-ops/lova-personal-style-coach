// src/pushNotifications.ts
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';

export const registerPushNotifications = () => {
  // Request permission to use push notifications
  PushNotifications.requestPermissions().then(result => {
    if (result.receive === 'granted') {
      // Register with Apple / Google to receive push via APNs/FCM
      PushNotifications.register();
    } else {
      console.warn('Push notification permission not granted');
    }
  });

  // On success, we should be able to receive notifications
  PushNotifications.addListener('registration', (token: Token) => {
    console.log('Push registration success, token:', token.value);
    // TODO: Send token to backend for user association
  });

  // Some issue with registration
  PushNotifications.addListener('registrationError', (error: any) => {
    console.error('Push registration error:', error);
  });

  // Show notification when app is open
  PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
    console.log('Push received:', notification);
    // TODO: Show in-app notification UI if needed
  });

  // Action performed
  PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
    console.log('Push action performed:', action);
    // TODO: Handle notification tap
  });
};
