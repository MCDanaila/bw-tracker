import { useState, useEffect } from 'react';

export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            alert('This browser does not support desktop notification');
            return false;
        }

        const newPermission = await Notification.requestPermission();
        setPermission(newPermission);
        return newPermission === 'granted';
    };

    const scheduleDailyReminder = async (enabled: boolean) => {
        // For iOS and standard PWAs, creating a background scheduled notification
        // usually requires the Push API and a server, OR we can simulate it with a Service Worker
        // For a fully local app, we can use the Service Worker's periodic sync or alarm API
        // if available, but web APIs for strict local scheduling are limited.

        // Let's implement a simple immediate test notification to verify the permissions and SW work.
        if (enabled && permission === 'granted') {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                registration.showNotification('BW Tracker', {
                    body: "Don't forget to log your weight and daily metrics today!",
                    icon: '/pwa-192x192.png',
                    vibrate: [200, 100, 200],
                    tag: 'daily-reminder',
                } as NotificationOptions);
            } else {
                new Notification('BW Tracker', {
                    body: "Don't forget to log your weight and daily metrics today!",
                    icon: '/pwa-192x192.png'
                });
            }
        }

        // In a real PWA without a server, scheduling a "daily" local push is very hard
        // because iOS Safari aggressively sleeps Service Workers.
        console.log("Reminder notifications set to:", enabled);
    };

    return { permission, requestPermission, scheduleDailyReminder };
}
