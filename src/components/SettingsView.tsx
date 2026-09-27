import React, { useState } from 'react';
import { ExtensionSettings, AIProvider } from '../types';
import { saveSettings } from '../lib/storage';
import { AI_MODELS, AI_KEY_LINKS, testAIConnection } from '../lib/ai';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  KeyRound,
  Cpu,
} from 'lucide-react';

interface SettingsViewProps {
  settings: ExtensionSettings;
  onSettingsSaved: (settings: ExtensionSettings) => void;
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSettingsSaved,
  onBack,
}) => {
  const [formData, setFormData] = useState<ExtensionSettings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });

  const handleProviderChange = (provider: AIProvider) => {
    const models = AI_MODELS[provider];
    setFormData((prev) => ({
      ...prev,
      aiProvider: provider,
      aiModel: models[0]?.id || '',
    }));
    setFeedback({ type: null, message: null });
  };

  const handleTestAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsTesting(true);
    setFeedback({ type: null, message: null });

    try {
      await saveSettings(formData);
      onSettingsSaved(formData);

      if (formData.aiApiKey.trim()) {
        const testRes = await testAIConnection(
          formData.aiProvider,
          formData.aiApiKey,
          formData.aiModel
        );

        if (testRes.success) {
          setFeedback({
            type: 'success',
            message: `Key verified! Connected to ${formData.aiModel}.`,
          });
        } else {
          setFeedback({
            type: 'error',
            message: testRes.message,
          });
        }
      } else {
        setFeedback({
          type: 'success',
          message: 'Settings saved. Enter an API key to enable AI autofill.',
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

  const providerNames: Record<AIProvider, string> = {
    gemini: 'Google Gemini',
    openai: 'OpenAI',
    anthropic: 'Claude (Anthropic)',
    groq: 'Groq',
  };

  const availableModels = AI_MODELS[formData.aiProvider] || [];
  const keyLink = AI_KEY_LINKS[formData.aiProvider];

  return (
    <div className="space-y-3.5">
      {/* Title */}
      <div>
        <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>AI Model & Key Settings</span>
        </h2>
        <p className="text-[11px] text-muted-foreground">
          Bring your own AI API key to power 1-click ATS application autofill.
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

      {/* Main Settings Form */}
      <form onSubmit={handleTestAndSave} className="space-y-3.5 p-3.5 rounded-xl border border-border bg-card shadow-2xs">
        {/* 1. AI Provider Selection */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            AI Provider
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['gemini', 'openai', 'anthropic', 'groq'] as AIProvider[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleProviderChange(p)}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                  formData.aiProvider === p
                    ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/30'
                    : 'border-border bg-secondary hover:bg-secondary/80 text-foreground'
                }`}
              >
                {providerNames[p]}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Model Selection Dropdown */}
        <div>
          <label className="flex items-center justify-between text-xs font-semibold text-foreground mb-1">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span>Model Selection</span>
            </span>
          </label>

          <select
            value={formData.aiModel}
            onChange={(e) => setFormData({ ...formData, aiModel: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
          >
            {availableModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-muted-foreground pt-1">
            {availableModels.find((m) => m.id === formData.aiModel)?.description || ''}
          </p>
        </div>

        {/* 3. API Key Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-primary" />
              <span>{providerNames[formData.aiProvider]} API Key</span>
            </label>
            {keyLink && (
              <a
                href={keyLink.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:opacity-90 cursor-pointer"
              >
                <span>Get Key</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={formData.aiApiKey}
              onChange={(e) => setFormData({ ...formData, aiApiKey: e.target.value })}
              placeholder={
                formData.aiProvider === 'gemini'
                  ? 'AIzaSy...'
                  : formData.aiProvider === 'openai'
                  ? 'sk-...'
                  : 'sk-ant-...'
              }
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
          <p className="text-[10px] text-muted-foreground pt-1 leading-tight">
            Stored locally on your machine via chrome.storage. Requests are sent directly to {providerNames[formData.aiProvider]}.
          </p>
        </div>

        {/* 4. Tracking Preferences */}
        <div className="pt-2 border-t border-border space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-foreground">
                Auto-log on 1-click autofill
              </p>
              <p className="text-[10px] text-muted-foreground">
                Immediately records job to your tracker.
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
                Follow-up badge reminder (3 days)
              </p>
              <p className="text-[10px] text-muted-foreground">
                Shows notification count when follow-up is due.
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
            <span>{isTesting ? 'Verifying Key...' : 'Test & Save Key'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
