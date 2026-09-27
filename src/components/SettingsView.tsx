import React, { useState } from 'react';
import { ExtensionSettings, SyncedProfileSummary } from '../types';
import { saveSettings } from '../lib/storage';
import { syncProfileFromPlatform, openPlatformUrl } from '../lib/api';
import {
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  Globe,
  Bell,
  Sparkles,
} from 'lucide-react';

interface SettingsViewProps {
  settings: ExtensionSettings;
  onSettingsSaved: (settings: ExtensionSettings) => void;
  onProfileSynced: (profile: SyncedProfileSummary) => void;
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSettingsSaved,
  onProfileSynced,
  onBack,
}) => {
  const [formData, setFormData] = useState<ExtensionSettings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });

  const handleTestAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsTesting(true);
    setFeedback({ type: null, message: null });

    try {
      await saveSettings(formData);
      onSettingsSaved(formData);

      if (formData.apiKey.trim()) {
        const res = await syncProfileFromPlatform(formData.apiKey, formData.apiUrl);
        if (res.success && res.data) {
          onProfileSynced(res.data);
          setFeedback({
            type: 'success',
            message: `Connected successfully! Synced as ${res.data.name}.`,
          });
        } else {
          setFeedback({
            type: 'error',
            message: res.error || 'Connection failed. Check your API key.',
          });
        }
      } else {
        setFeedback({
          type: 'success',
          message: 'Settings saved.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Error saving settings.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
          <KeyRound className="w-4 h-4 text-brand-600" />
          <span>Extension Settings</span>
        </h2>
        <p className="text-[11px] text-stone-500 dark:text-stone-400">
          Connect to your CareerAgent web account.
        </p>
      </div>

      {feedback.message && (
        <div
          className={`flex items-center gap-2 p-2.5 rounded-lg text-xs border animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* API Key Box */}
      <form onSubmit={handleTestAndSave} className="space-y-3 p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-stone-800 dark:text-stone-200">
              Personal API Key
            </label>
            <button
              type="button"
              onClick={() => openPlatformUrl('/settings/api-keys')}
              className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-brand-600 hover:text-brand-500"
            >
              <span>Get API Key</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="ca_live_xxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full pl-3 pr-8 py-2 rounded-lg text-xs font-mono border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[10px] text-stone-400 pt-1">
            Used to securely fetch your synced profile and log tracked applications.
          </p>
        </div>

        {/* Preferences */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-stone-800 dark:text-stone-200">
                Auto-log on 1-click autofill
              </p>
              <p className="text-[10px] text-stone-400">
                Immediately records job to your CareerAgent tracker.
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.autoTrackOnAutofill}
              onChange={(e) =>
                setFormData({ ...formData, autoTrackOnAutofill: e.target.checked })
              }
              className="rounded border-stone-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-stone-800 dark:text-stone-200">
                Follow-up badge reminder
              </p>
              <p className="text-[10px] text-stone-400">
                Shows notification count when follow-up is due (3 days).
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.notificationsEnabled}
              onChange={(e) =>
                setFormData({ ...formData, notificationsEnabled: e.target.checked })
              }
              className="rounded border-stone-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isTesting ? 'Connecting...' : 'Save & Sync'}</span>
          </button>
        </div>
      </form>

      {/* Advanced / Developer options */}
      <details className="text-xs group">
        <summary className="cursor-pointer text-[11px] font-semibold text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors">
          Advanced Server Endpoints
        </summary>
        <div className="p-3 mt-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-2">
          <div>
            <label className="block text-[10px] font-medium text-stone-500 mb-0.5">
              API Base URL
            </label>
            <input
              type="url"
              value={formData.apiUrl}
              onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
              className="w-full px-2 py-1 rounded text-[11px] font-mono border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-stone-500 mb-0.5">
              Web App URL
            </label>
            <input
              type="url"
              value={formData.webAppUrl}
              onChange={(e) => setFormData({ ...formData, webAppUrl: e.target.value })}
              className="w-full px-2 py-1 rounded text-[11px] font-mono border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
            />
          </div>
        </div>
      </details>
    </div>
  );
};
