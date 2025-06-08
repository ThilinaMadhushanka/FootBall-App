import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

interface UserSettings {
  id: number;
  email_notifications: boolean;
  match_reminders: boolean;
  dark_mode: boolean;
  language: string;
  timezone: string;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiService.get('/api/settings');
        setSettings(response.data);
      } catch (err) {
        setError('Failed to load settings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleToggle = async (setting: keyof UserSettings) => {
    if (!settings) return;

    setSaving(true);
    try {
      const updatedSettings = {
        ...settings,
        [setting]: !settings[setting]
      };
      await apiService.put('/api/settings', updatedSettings);
      setSettings(updatedSettings);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = async (setting: keyof UserSettings, value: string) => {
    if (!settings) return;

    setSaving(true);
    try {
      const updatedSettings = {
        ...settings,
        [setting]: value
      };
      await apiService.put('/api/settings', updatedSettings);
      setSettings(updatedSettings);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Notifications Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Receive updates about your teams and matches</p>
                </div>
                <button
                  onClick={() => handleToggle('email_notifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    settings.email_notifications ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.email_notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">Match Reminders</h3>
                  <p className="text-sm text-gray-500">Get notified before your team's matches</p>
                </div>
                <button
                  onClick={() => handleToggle('match_reminders')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    settings.match_reminders ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.match_reminders ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Appearance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">Dark Mode</h3>
                  <p className="text-sm text-gray-500">Switch between light and dark themes</p>
                </div>
                <button
                  onClick={() => handleToggle('dark_mode')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    settings.dark_mode ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.dark_mode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSelect('language', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleSelect('timezone', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="CST">Central Time</option>
                  <option value="PST">Pacific Time</option>
                  <option value="GMT">Greenwich Mean Time</option>
                </select>
              </div>
            </div>
          </div>

          {saving && (
            <div className="text-sm text-gray-500 text-center">
              Saving changes...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 