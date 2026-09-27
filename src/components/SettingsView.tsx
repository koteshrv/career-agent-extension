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
    <div className="space-y-3.5">
      {/* Title */}
      <div>
        <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <KeyRound className="w-4 h-4 text-primary" />
          <span>Extension Settings</span>
        </h2>
        <p className="text-[11px] text-muted-foreground">
          Connect to your CareerAgent web account to sync candidate profiles.
        </p>
      </div>

      {feedback.message && (
        <div
          className={`flex items-center gap-2 p-2.5 rounded-lg text-xs border animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* API Key Box */}
      <form onSubmit={handleTestAndSave} className="space-y-3.5 p-3.5 rounded-xl border border-border bg-card shadow-2xs">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-foreground">
              Personal API Key
            </label>
            <button
              type="button"
              onClick={() => openPlatformUrl('/settings/api-keys')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:opacity-90 cursor-pointer"
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
              className="w-full pl-3 pr-8 py-2 rounded-lg text-xs font-mono border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground pt-1 leading-tight">
            Used to securely fetch your candidate profile and log tracked applications.
          </p>
        </div>

        {/* Preferences */}
        <div className="pt-2 border-t border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-foreground">
                Auto-log on 1-click autofill
              </p>
              <p className="text-[10px] text-muted-foreground">
                Immediately records job to your CareerAgent tracker.
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.autoTrackOnAutofill}
              onChange={(e) =>
                setFormData({ ...formData, autoTrackOnAutofill: e.target.checked })
              }
              className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-foreground">
                Follow-up badge reminder
              </p>
              <p className="text-[10px] text-muted-foreground">
                Shows notification count when follow-up is due (3 days).
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.notificationsEnabled}
              onChange={(e) =>
                setFormData({ ...formData, notificationsEnabled: e.target.checked })
              }
              className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-border flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isTesting ? 'Connecting...' : 'Save & Sync'}</span>
          </button>
        </div>
      </form>

      {/* Advanced / Developer options */}
      <details className="text-xs group">
        <summary className="cursor-pointer text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
          Advanced Server Endpoints
        </summary>
        <div className="p-3 mt-2 rounded-xl border border-border bg-card space-y-2">
          <div>
            <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">
              API Base URL
            </label>
            <input
              type="url"
              value={formData.apiUrl}
              onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
              className="w-full px-2 py-1.5 rounded-md text-xs font-mono border border-input bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">
              Web App URL
            </label>
            <input
              type="url"
              value={formData.webAppUrl}
              onChange={(e) => setFormData({ ...formData, webAppUrl: e.target.value })}
              className="w-full px-2 py-1.5 rounded-md text-xs font-mono border border-input bg-background text-foreground"
            />
          </div>
        </div>
      </details>
    </div>
  );
};
