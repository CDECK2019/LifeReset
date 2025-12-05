import { useState, useEffect } from 'react';
import { X, Bell, BellOff, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    requestNotificationPermission,
    getNotificationPermission,
    scheduleNotifications,
    cancelScheduledNotifications,
    checkNotificationSupport,
    type NotificationSchedule,
} from '../lib/notificationService';
import { Database } from '../lib/database.types';

type NotificationSettings = Database['public']['Tables']['notification_settings']['Row'];

interface NotificationSettingsProps {
    onClose: () => void;
}

export function NotificationSettings({ onClose }: NotificationSettingsProps) {
    const { user } = useAuth();
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
    const [notificationSupported, setNotificationSupported] = useState(true);

    useEffect(() => {
        loadSettings();
        setNotificationSupported(checkNotificationSupport());
        setPermissionStatus(getNotificationPermission());
    }, []);

    const loadSettings = async () => {
        if (!user) return;

        try {
            const { data, error } = await (supabase
                .from('notification_settings')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle() as any);

            if (error && error.code !== 'PGRST116') {
                console.error('Error loading notification settings:', error);
                return;
            }

            if (data) {
                setSettings(data);
            } else {
                // Create default settings
                const defaultSettings: Database['public']['Tables']['notification_settings']['Insert'] = {
                    user_id: user.id,
                    notifications_enabled: true,
                    morning_notification_enabled: true,
                    morning_notification_time: '07:00:00',
                    evening_notification_enabled: true,
                    evening_notification_time: '20:00:00',
                };

                const { data: newSettings, error: insertError } = await (supabase
                    .from('notification_settings')
                    .insert(defaultSettings)
                    .select()
                    .single() as any);

                if (insertError) {
                    console.error('Error creating notification settings:', insertError);
                } else {
                    setSettings(newSettings);
                }
            }
        } catch (error) {
            console.error('Error in loadSettings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestPermission = async () => {
        const permission = await requestNotificationPermission();
        setPermissionStatus(permission);

        if (permission === 'granted' && settings?.notifications_enabled) {
            // Schedule notifications immediately after permission is granted
            scheduleNotifications({
                morningTime: settings.morning_notification_time.substring(0, 5),
                eveningTime: settings.evening_notification_time.substring(0, 5),
                morningEnabled: settings.morning_notification_enabled,
                eveningEnabled: settings.evening_notification_enabled,
            });
        }
    };

    const handleSave = async () => {
        if (!user || !settings) return;

        setSaving(true);
        try {
            const { error } = await (supabase
                .from('notification_settings')
                .update({
                    notifications_enabled: settings.notifications_enabled,
                    morning_notification_enabled: settings.morning_notification_enabled,
                    morning_notification_time: settings.morning_notification_time,
                    evening_notification_enabled: settings.evening_notification_enabled,
                    evening_notification_time: settings.evening_notification_time,
                })
                .eq('user_id', user.id) as any);

            if (error) {
                console.error('Error saving notification settings:', error);
                alert('Failed to save settings. Please try again.');
                return;
            }

            // Update notification schedule
            if (settings.notifications_enabled && permissionStatus === 'granted') {
                scheduleNotifications({
                    morningTime: settings.morning_notification_time.substring(0, 5),
                    eveningTime: settings.evening_notification_time.substring(0, 5),
                    morningEnabled: settings.morning_notification_enabled,
                    eveningEnabled: settings.evening_notification_enabled,
                });
            } else {
                cancelScheduledNotifications();
            }

            onClose();
        } catch (error) {
            console.error('Error in handleSave:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = <K extends keyof NotificationSettings>(
        key: K,
        value: NotificationSettings[K]
    ) => {
        if (!settings) return;
        setSettings({ ...settings, [key]: value });
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                    <div className="text-center text-slate-400">Loading...</div>
                </div>
            </div>
        );
    }

    if (!settings) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                            <Bell className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Notification Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Browser Support Warning */}
                    {!notificationSupported && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-sm text-amber-800">
                                Your browser doesn't support notifications. Please use a modern browser like Chrome, Firefox, or Safari.
                            </p>
                        </div>
                    )}

                    {/* Permission Status */}
                    <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">Permission Status</span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${permissionStatus === 'granted'
                                ? 'bg-green-100 text-green-700'
                                : permissionStatus === 'denied'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-slate-200 text-slate-700'
                                }`}>
                                {permissionStatus === 'granted' ? 'Granted' : permissionStatus === 'denied' ? 'Denied' : 'Not Requested'}
                            </span>
                        </div>
                        {permissionStatus !== 'granted' && (
                            <button
                                onClick={handleRequestPermission}
                                disabled={permissionStatus === 'denied' || !notificationSupported}
                                className="w-full mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                {permissionStatus === 'denied' ? 'Permission Denied (Check Browser Settings)' : 'Enable Notifications'}
                            </button>
                        )}
                    </div>

                    {/* Master Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {settings.notifications_enabled ? (
                                <Bell className="w-5 h-5 text-indigo-600" />
                            ) : (
                                <BellOff className="w-5 h-5 text-slate-400" />
                            )}
                            <div>
                                <div className="font-medium text-slate-900">All Notifications</div>
                                <div className="text-xs text-slate-500">Enable or disable all reminders</div>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.notifications_enabled}
                                onChange={(e) => updateSetting('notifications_enabled', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    <div className="border-t border-slate-100 pt-6 space-y-6">
                        {/* Morning Notification */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-amber-500" />
                                    <div>
                                        <div className="font-medium text-slate-900">Morning Reminder</div>
                                        <div className="text-xs text-slate-500">Start your day strong</div>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.morning_notification_enabled}
                                        onChange={(e) => updateSetting('morning_notification_enabled', e.target.checked)}
                                        disabled={!settings.notifications_enabled}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 peer-disabled:opacity-50"></div>
                                </label>
                            </div>
                            {settings.morning_notification_enabled && (
                                <input
                                    type="time"
                                    value={settings.morning_notification_time.substring(0, 5)}
                                    onChange={(e) => updateSetting('morning_notification_time', e.target.value + ':00')}
                                    disabled={!settings.notifications_enabled}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            )}
                        </div>

                        {/* Evening Notification */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-indigo-500" />
                                    <div>
                                        <div className="font-medium text-slate-900">Evening Reminder</div>
                                        <div className="text-xs text-slate-500">Reflect on your day</div>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.evening_notification_enabled}
                                        onChange={(e) => updateSetting('evening_notification_enabled', e.target.checked)}
                                        disabled={!settings.notifications_enabled}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-disabled:opacity-50"></div>
                                </label>
                            </div>
                            {settings.evening_notification_enabled && (
                                <input
                                    type="time"
                                    value={settings.evening_notification_time.substring(0, 5)}
                                    onChange={(e) => updateSetting('evening_notification_time', e.target.value + ':00')}
                                    disabled={!settings.notifications_enabled}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            )}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            💡 <strong>Tip:</strong> For best results, install this app on your home screen. Notifications work best when the app is installed as a PWA.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-indigo-400 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
