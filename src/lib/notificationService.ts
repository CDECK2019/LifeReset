/**
 * Notification Service for LifeReset
 * 
 * Handles browser notification permissions, scheduling, and delivery
 * for daily reminders (morning and evening notifications)
 */

export interface NotificationSchedule {
    morningTime: string; // HH:MM format
    eveningTime: string; // HH:MM format
    morningEnabled: boolean;
    eveningEnabled: boolean;
}

/**
 * Check if the browser supports notifications
 */
export function checkNotificationSupport(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
    if (!checkNotificationSupport()) {
        return 'denied';
    }
    return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!checkNotificationSupport()) {
        console.warn('Notifications are not supported in this browser');
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission === 'denied') {
        return 'denied';
    }

    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return 'denied';
    }
}

/**
 * Register the service worker for notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers are not supported in this browser');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
        });
        console.log('Service Worker registered successfully:', registration);
        return registration;
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
    }
}

/**
 * Show an immediate notification (for testing)
 */
export async function showNotification(title: string, body: string, tag: string = 'lifereset'): Promise<void> {
    if (Notification.permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag,
            requireInteraction: false,
        });
    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

/**
 * Schedule daily notifications based on user preferences
 * Note: Web browsers don't support true scheduled notifications.
 * This function sets up timers that will trigger notifications when the app is open.
 * For true background notifications, you would need a push server.
 */
export function scheduleNotifications(schedule: NotificationSchedule): void {
    // Clear any existing scheduled notifications
    cancelScheduledNotifications();

    if (Notification.permission !== 'granted') {
        console.warn('Cannot schedule notifications: permission not granted');
        return;
    }

    // Schedule morning notification
    if (schedule.morningEnabled) {
        const morningTime = parseTimeString(schedule.morningTime);
        const morningDelay = calculateDelayUntilTime(morningTime);

        if (morningDelay > 0) {
            const timerId = setTimeout(() => {
                showNotification(
                    'Good Morning! 🌅',
                    "Time to start your day strong. Check in on today's tasks!",
                    'morning-notification'
                );
                // Reschedule for tomorrow
                scheduleNotifications(schedule);
            }, morningDelay);

            // Store timer ID for cleanup
            (window as any).__morningNotificationTimer = timerId;
            console.log(`Morning notification scheduled for ${schedule.morningTime} (in ${Math.round(morningDelay / 1000 / 60)} minutes)`);
        }
    }

    // Schedule evening notification
    if (schedule.eveningEnabled) {
        const eveningTime = parseTimeString(schedule.eveningTime);
        const eveningDelay = calculateDelayUntilTime(eveningTime);

        if (eveningDelay > 0) {
            const timerId = setTimeout(() => {
                showNotification(
                    'Evening Check-In 🌙',
                    "How did your day go? Complete today's reflection!",
                    'evening-notification'
                );
                // Reschedule for tomorrow
                scheduleNotifications(schedule);
            }, eveningDelay);

            // Store timer ID for cleanup
            (window as any).__eveningNotificationTimer = timerId;
            console.log(`Evening notification scheduled for ${schedule.eveningTime} (in ${Math.round(eveningDelay / 1000 / 60)} minutes)`);
        }
    }
}

/**
 * Cancel all scheduled notifications
 */
export function cancelScheduledNotifications(): void {
    if ((window as any).__morningNotificationTimer) {
        clearTimeout((window as any).__morningNotificationTimer);
        delete (window as any).__morningNotificationTimer;
    }

    if ((window as any).__eveningNotificationTimer) {
        clearTimeout((window as any).__eveningNotificationTimer);
        delete (window as any).__eveningNotificationTimer;
    }

    console.log('Scheduled notifications cancelled');
}

/**
 * Parse time string (HH:MM) into hours and minutes
 */
function parseTimeString(timeStr: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
}

/**
 * Calculate milliseconds until a specific time today (or tomorrow if time has passed)
 */
function calculateDelayUntilTime(time: { hours: number; minutes: number }): number {
    const now = new Date();
    const target = new Date();
    target.setHours(time.hours, time.minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (target <= now) {
        target.setDate(target.getDate() + 1);
    }

    return target.getTime() - now.getTime();
}

/**
 * Initialize notifications on app load
 */
export async function initializeNotifications(schedule: NotificationSchedule): Promise<void> {
    // Register service worker
    await registerServiceWorker();

    // If permission is already granted, schedule notifications
    if (Notification.permission === 'granted') {
        scheduleNotifications(schedule);
    }
}
