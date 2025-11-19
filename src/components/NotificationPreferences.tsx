'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Settings, Check, X } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { pushNotificationService } from '@/lib/services/push-notification-service';
import { toast } from 'sonner';

interface NotificationPreferences {
  email: {
    orderConfirmation: boolean;
    orderUpdates: boolean;
    promotions: boolean;
    newsletter: boolean;
  };
  sms: {
    orderConfirmation: boolean;
    orderUpdates: boolean;
    deliveryUpdates: boolean;
    promotions: boolean;
  };
  push: {
    enabled: boolean;
    orderUpdates: boolean;
    promotions: boolean;
    marketing: boolean;
  };
  general: {
    frequency: 'all' | 'important' | 'minimal';
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
}

const defaultPreferences: NotificationPreferences = {
  email: {
    orderConfirmation: true,
    orderUpdates: true,
    promotions: false,
    newsletter: false
  },
  sms: {
    orderConfirmation: true,
    orderUpdates: true,
    deliveryUpdates: true,
    promotions: false
  },
  push: {
    enabled: false,
    orderUpdates: true,
    promotions: false,
    marketing: false
  },
  general: {
    frequency: 'all',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  }
};

export default function NotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check push notification support
    setPushSupported(pushNotificationService.isSupported());
    setPushPermission(pushNotificationService.getPermissionStatus());

    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/user/notification-preferences', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences({ ...defaultPreferences, ...data.preferences });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ preferences })
      });

      if (response.ok) {
        toast.success('Notification preferences saved successfully');
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (!user) return;

    try {
      if (enabled) {
        // Request permission and subscribe
        await pushNotificationService.subscribeToPushNotifications(user.uid);
        setPushPermission('granted');
        setPreferences(prev => ({
          ...prev,
          push: { ...prev.push, enabled: true }
        }));
        toast.success('Push notifications enabled successfully');
      } else {
        // Unsubscribe
        await pushNotificationService.unsubscribeFromPushNotifications(user.uid);
        setPreferences(prev => ({
          ...prev,
          push: { ...prev.push, enabled: false }
        }));
        toast.success('Push notifications disabled');
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      toast.error('Failed to update push notification settings');
    }
  };

  const updatePreference = (section: keyof NotificationPreferences, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const updateNestedPreference = (section: keyof NotificationPreferences, parentKey: string, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parentKey]: {
          ...(prev[section] as any)[parentKey],
          [key]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-orange-500" />
        <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-8">
          {/* Email Notifications */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
            </div>
            <div className="space-y-3 ml-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Order Confirmations</p>
                  <p className="text-sm text-gray-500">Receive email when your order is confirmed</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email.orderConfirmation}
                    onChange={(e) => updatePreference('email', 'orderConfirmation', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Order Updates</p>
                  <p className="text-sm text-gray-500">Get notified about order status changes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email.orderUpdates}
                    onChange={(e) => updatePreference('email', 'orderUpdates', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Promotions &amp; Deals</p>
                  <p className="text-sm text-gray-500">Receive special offers and discounts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email.promotions}
                    onChange={(e) => updatePreference('email', 'promotions', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Newsletter</p>
                  <p className="text-sm text-gray-500">Monthly updates and news</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email.newsletter}
                    onChange={(e) => updatePreference('email', 'newsletter', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* SMS Notifications */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="h-5 w-5 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">SMS Notifications</h2>
            </div>
            <div className="space-y-3 ml-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Order Confirmations</p>
                  <p className="text-sm text-gray-500">SMS when your order is confirmed</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.sms.orderConfirmation}
                    onChange={(e) => updatePreference('sms', 'orderConfirmation', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Order Updates</p>
                  <p className="text-sm text-gray-500">SMS for order status changes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.sms.orderUpdates}
                    onChange={(e) => updatePreference('sms', 'orderUpdates', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Delivery Updates</p>
                  <p className="text-sm text-gray-500">SMS when your order is out for delivery</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.sms.deliveryUpdates}
                    onChange={(e) => updatePreference('sms', 'deliveryUpdates', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Push Notifications */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Smartphone className="h-5 w-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">Push Notifications</h2>
              {!pushSupported && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Not Supported</span>
              )}
            </div>
            
            {pushSupported ? (
              <div className="space-y-3 ml-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700">Enable Push Notifications</p>
                    <p className="text-sm text-gray-500">
                      {pushPermission === 'denied' 
                        ? 'Push notifications are blocked. Please enable them in your browser settings.'
                        : 'Get instant notifications on your device'
                      }
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.push.enabled && pushPermission === 'granted'}
                      onChange={(e) => handlePushToggle(e.target.checked)}
                      disabled={pushPermission === 'denied'}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 peer-disabled:opacity-50"></div>
                  </label>
                </div>

                {preferences.push.enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">Order Updates</p>
                        <p className="text-sm text-gray-500">Push notifications for order status</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.push.orderUpdates}
                          onChange={(e) => updatePreference('push', 'orderUpdates', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700">Promotions</p>
                        <p className="text-sm text-gray-500">Special offers and deals</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.push.promotions}
                          onChange={(e) => updatePreference('push', 'promotions', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="ml-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Push notifications are not supported in your current browser. 
                  Please use a modern browser like Chrome, Firefox, or Safari.
                </p>
              </div>
            )}
          </div>

          {/* General Settings */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
            </div>
            <div className="space-y-4 ml-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Frequency
                </label>
                <select
                  value={preferences.general.frequency}
                  onChange={(e) => updatePreference('general', 'frequency', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">All notifications</option>
                  <option value="important">Important only</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Quiet Hours
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.general.quietHours.enabled}
                      onChange={(e) => updateNestedPreference('general', 'quietHours', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                
                {preferences.general.quietHours.enabled && (
                  <div className="flex gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">From</label>
                      <input
                        type="time"
                        value={preferences.general.quietHours.start}
                        onChange={(e) => updateNestedPreference('general', 'quietHours', 'start', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">To</label>
                      <input
                        type="time"
                        value={preferences.general.quietHours.end}
                        onChange={(e) => updateNestedPreference('general', 'quietHours', 'end', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200 mt-8">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
