export const notificationService = {
    // Check if notifications are enabled in app prefs AND browser
    isEnabled: () => {
        if (typeof window === 'undefined')
            return false;
        return localStorage.getItem('lova_notifications_enabled') === 'true' && Notification.permission === 'granted';
    },
    // Request browser permission and save preference
    requestPermission: async () => {
        if (!('Notification' in window)) {
            console.warn('This browser does not support desktop notification');
            return false;
        }
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            localStorage.setItem('lova_notifications_enabled', 'true');
            return true;
        }
        return false;
    },
    // Disable locally without revoking browser permission (which is hard to do via JS)
    disable: () => {
        localStorage.setItem('lova_notifications_enabled', 'false');
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
                    icon: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=128&h=128&fit=crop', // Fashion placeholder icon
                    silent: false
                });
            }
            catch (e) {
                console.error("Notification sending failed", e);
            }
        }
    }
};
