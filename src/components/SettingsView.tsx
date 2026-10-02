import React, { useEffect, useState } from 'react';
import { ExtensionSettings, AIProvider } from '../types';
import { saveSettings } from '../lib/storage';
import { AI_MODELS, AI_KEY_LINKS, testAIConnection, fetchAvailableModels } from '../lib/ai';
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
  // Ensure we don't start with deprecated model
  const initialSettings = {
    ...settings,
    aiModel:
      settings.aiProvider === 'gemini' &&
      (settings.aiModel === 'gemini-1.5-flash' ||
        settings.aiModel === 'gemini-2.5-flash' ||
        !settings.aiModel)
        ? 'gemini-3.5-flash-lite'
        : settings.aiModel || 'gemini-3.5-flash-lite',
  };

  const [formData, setFormData] = useState<ExtensionSettings>(initialSettings);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modelState, setModelState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  const [dynamicModels, setDynamicModels] = useState<Record<AIProvider, any[]>>({
    gemini: AI_MODELS.gemini,
    openai: AI_MODELS.openai,
    anthropic: AI_MODELS.anthropic,
    groq: AI_MODELS.groq,
  });
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });

  const handleProviderChange = (provider: AIProvider) => {
    const models = dynamicModels[provider] || AI_MODELS[provider];
    setFormData((prev) => ({
      ...prev,
      aiProvider: provider,
      aiModel: models[0]?.id || '',
    }));
    setFeedback({ type: null, message: null });
  };

  // Instant preference saving: checkboxes save immediately so preferences always persist
  const handleToggleAutoTrack = async (checked: boolean) => {
    const updated = { ...formData, autoTrackOnAutofill: checked };
    setFormData(updated);
    await saveSettings(updated);
    onSettingsSaved(updated);
    setFeedback({
      type: 'success',
      message: checked ? 'Auto-log on autofill enabled.' : 'Auto-log on autofill disabled.',
    });
  };

  const handleToggleAutoSubmit = async (checked: boolean) => {
    const updated = { ...formData, autoTrackOnSubmit: checked };
    setFormData(updated);
    await saveSettings(updated);
    onSettingsSaved(updated);
    setFeedback({ type: 'success', message: checked ? 'Submitted applications will be added to your pipeline.' : 'Submitted applications are no longer tracked automatically.' });
  };

  const handleToggleNotifications = async (checked: boolean) => {
    const updated = { ...formData, notificationsEnabled: checked };
    setFormData(updated);
    await saveSettings(updated);
    onSettingsSaved(updated);
    setFeedback({
      type: 'success',
      message: checked ? 'Follow-up badge reminders enabled.' : 'Badge reminders disabled.',
    });
  };

  // Models list themselves: once a key looks complete, ask the provider what it can run.
  const hasKey = formData.aiApiKey.trim().length >= 20;
  useEffect(() => {
    if (!hasKey) { setModelState('idle'); return; }
    const provider = formData.aiProvider;
    const key = formData.aiApiKey.trim();
    let cancelled = false;
    setModelState('loading');
    const t = setTimeout(async () => {
      try {
        const fetched = await fetchAvailableModels(provider, key);
        if (cancelled) return;
        const live = fetched.length > 0 && fetched !== AI_MODELS[provider];
        setDynamicModels((prev) => ({ ...prev, [provider]: fetched.length > 0 ? fetched : AI_MODELS[provider] }));
        setFormData((prev) => (fetched.some((m) => m.id === prev.aiModel) ? prev : { ...prev, aiModel: fetched[0]?.id || prev.aiModel }));
        setModelState(live ? 'ready' : 'failed');
      } catch {
        if (!cancelled) setModelState('failed');
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.aiProvider, formData.aiApiKey]);

  // Direct save without requiring a network call
  const handleDirectSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings(formData);
      onSettingsSaved(formData);
      setFeedback({
        type: 'success',
        message: 'Settings saved successfully!',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to save settings.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Test API key and save on success
  const handleTestAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsTesting(true);
    setFeedback({ type: null, message: null });

    try {
      if (formData.aiApiKey.trim()) {
        const testRes = await testAIConnection(
          formData.aiProvider,
          formData.aiApiKey,
          formData.aiModel
        );

        if (testRes.success) {
          await saveSettings(formData);
          onSettingsSaved(formData);
          setFeedback({
            type: 'success',
            message: `Key verified and saved! Connected to ${formData.aiModel}.`,
          });
        } else {
          setFeedback({
            type: 'error',
            message: testRes.message,
          });
        }
      } else {
        await saveSettings(formData);
        onSettingsSaved(formData);
        setFeedback({
          type: 'success',
          message: 'Settings saved. Enter an API key to enable AI assistant.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Error verifying connection.',
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

  const availableModels =
    dynamicModels[formData.aiProvider] || AI_MODELS[formData.aiProvider] || [];
  const keyLink = AI_KEY_LINKS[formData.aiProvider];

  return (
    <div className="space-y-3">
      {/* Title */}
      <div className="pb-1">
        <h2 className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>AI and tracking</span>
        </h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Your key stays in this browser. It is only used to draft answers to application questions and read your resume.
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
          <span className="font-medium leading-tight">{feedback.message}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleTestAndSave} className="space-y-3.5 p-3.5 rounded-lg border border-border bg-card">
        {/* 1. AI Provider Selection */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            AI Provider
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['gemini', 'openai', 'anthropic', 'groq'] as AIProvider[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleProviderChange(p)}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer  select-none ${
                  formData.aiProvider === p
                    ? 'border-primary/50 bg-primary/10 text-primary font-medium ring-1 ring-primary/40'
                    : 'border-border/80 bg-secondary hover:bg-secondary/80 text-foreground'
                }`}
              >
                {providerNames[p]}
              </button>
            ))}
          </div>
        </div>

        {/* 2. API Key Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-foreground flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-primary" />
              <span>{providerNames[formData.aiProvider]} API Key</span>
            </label>
            {keyLink && (
              <a
                href={keyLink.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline cursor-pointer"
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
              className="w-full pl-3 pr-8 py-2 rounded-lg text-xs font-mono border border-border/80 bg-background text-foreground  focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
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
            Stored only in this browser. Never sent to a CareerAgent server.
          </p>
        </div>

        {/* 3. Model: fills in from the provider once a key is present */}
        <div className={hasKey ? '' : 'opacity-40 pointer-events-none select-none'} aria-disabled={!hasKey}>
          <div className="flex items-center justify-between text-xs font-medium text-foreground mb-1">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span>Model</span>
            </span>
            <span className="text-[11px] font-normal text-muted-foreground">
              {!hasKey ? 'Add a key to choose' : modelState === 'loading' ? 'Loading models…' : modelState === 'ready' ? `${availableModels.length} available for this key` : modelState === 'failed' ? 'Showing defaults' : ''}
            </span>
          </div>

          <select
            value={formData.aiModel}
            onChange={(e) => setFormData({ ...formData, aiModel: e.target.value })}
            disabled={!hasKey || modelState === 'loading'}
            className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-border/80 bg-background text-foreground  focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary cursor-pointer disabled:cursor-default"
          >
            {availableModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <p className="text-[11px] text-muted-foreground pt-1">
            {availableModels.find((m) => m.id === formData.aiModel)?.description || ''}
          </p>
        </div>

        {/* 4. Tracking Preferences */}
        <div className="pt-2 border-t border-border/60 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-foreground">
                Add to pipeline when I submit an application
              </p>
              <p className="text-[11px] text-muted-foreground">
                On Greenhouse, Lever, Ashby and Workday the submit is detected and the job is marked Applied.
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.autoTrackOnSubmit}
              onChange={(e) => handleToggleAutoSubmit(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer accent-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-foreground">
                Mark Applied when I autofill
              </p>
              <p className="text-[11px] text-muted-foreground">
                Treats a successful autofill as an application.
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.autoTrackOnAutofill}
              onChange={(e) => handleToggleAutoTrack(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer accent-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-foreground">
                Follow-up badge reminder (3 days)
              </p>
              <p className="text-[11px] text-muted-foreground">
                Shows notification count when follow-up is due.
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.notificationsEnabled}
              onChange={(e) => handleToggleNotifications(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer accent-primary"
            />
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Keyboard: Alt+Shift+F autofills the current page. Change it at chrome://extensions/shortcuts.
        </p>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="h-8 px-3 rounded-lg text-xs font-medium border border-border/60 bg-secondary hover:bg-secondary/80 text-foreground transition-all cursor-pointer select-none "
          >
            Back
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDirectSave}
              disabled={isSaving || isTesting}
              className="h-8 px-3 rounded-lg text-xs font-medium border border-border/80 bg-card hover:bg-muted/50 text-foreground transition-all disabled:opacity-50 cursor-pointer select-none "
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>

            <button
              type="submit"
              disabled={isTesting || isSaving}
              className="h-8 flex items-center gap-1.5 px-3.5 rounded-lg text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground  transition-all disabled:opacity-50 cursor-pointer select-none"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isTesting ? 'Verifying...' : 'Verify & Save'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
