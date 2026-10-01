import React, { useState, useEffect, useCallback } from 'react';
import {
  JobDetails,
  TrackedApplication,
  ExtensionView,
  ExtensionSettings,
  ApplicationStatus,
  CandidateProfile,
  ATSType,
} from '../../src/types';
import {
  getSettings,
  getProfile,
  getApplications,
  addApplication,
  deleteApplication,
  clearApplications,
  getTheme,
  saveTheme,
  DEFAULT_SETTINGS,
  DEFAULT_PROFILE,
} from '../../src/lib/storage';
import type { Msg, Res } from '../../src/lib/messages';
import { Header } from '../../src/components/Header';
import { JobDetectorCard } from '../../src/components/JobDetectorCard';
import { ProfileSyncBar } from '../../src/components/ProfileSyncBar';
import { SettingsView } from '../../src/components/SettingsView';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ExtensionView>('main');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<CandidateProfile>(DEFAULT_PROFILE);
  const [applications, setApplications] = useState<TrackedApplication[]>([]);
  const [detectedJob, setDetectedJob] = useState<JobDetails | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(true);
  const [isAutofilling, setIsAutofilling] = useState<boolean>(false);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  const [autofillStatus, setAutofillStatus] = useState<{
    message: string | null;
    type: 'success' | 'error' | 'idle';
  }>({
    message: null,
    type: 'idle',
  });

  // Apply dark mode class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const [storedSettings, storedProfile, storedApps, storedTheme] = await Promise.all([
        getSettings(),
        getProfile(),
        getApplications(),
        getTheme(),
      ]);

      setSettings(storedSettings);
      setProfile(storedProfile);
      setApplications(storedApps);
      setTheme(storedTheme);
    }

    loadData();
  }, []);

  const handleThemeToggle = async () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    await saveTheme(nextTheme);
  };

  // Send a typed message to the active tab's content script, injecting it on demand (activeTab) if absent.
  const sendMessageToTab = useCallback(async <T,>(tabId: number, message: Msg): Promise<Res<T> | null> => {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, message, async (response: Res<T>) => {
        if (!chrome.runtime?.lastError) return resolve(response ?? null);
        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content-scripts/content.js'],
          });
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, message, (retryRes: Res<T>) => {
              resolve(chrome.runtime?.lastError ? null : retryRes ?? null);
            });
          }, 150);
        } catch {
          resolve(null);
        }
      });
    });
  }, []);

  // Scan active tab for job details
  const scanActiveTab = useCallback(async () => {
    setIsDetecting(true);
    setAutofillStatus({ message: null, type: 'idle' });

    try {
      if (typeof chrome === 'undefined' || !chrome.tabs) {
        setDetectedJob(null);
        setIsDetecting(false);
        return;
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id || !tab.url) {
        setDetectedJob(null);
        setIsDetecting(false);
        return;
      }

      setActiveTabId(tab.id);

      const response = await sendMessageToTab<JobDetails | null>(tab.id, { type: 'EXTRACT_JOB_DETAILS' });

      if (response?.ok && response.data) {
        setDetectedJob(response.data);
      } else {
        const url = tab.url || '';
        const isATS =
          url.includes('boards.greenhouse.io') ||
          url.includes('gh_jid') ||
          url.includes('jobs.lever.co') ||
          url.includes('jobs.ashbyhq.com') ||
          url.includes('linkedin.com/jobs');

        if (isATS) {
          let atsType: ATSType = 'generic';
          if (url.includes('boards.greenhouse.io') || url.includes('gh_jid')) atsType = 'greenhouse';
          else if (url.includes('jobs.lever.co')) atsType = 'lever';
          else if (url.includes('jobs.ashbyhq.com')) atsType = 'ashby';
          else if (url.includes('linkedin.com/jobs')) atsType = 'linkedin';

          const pageTitle = tab.title || '';
          const titleParts = pageTitle.split(/ - | \| | at /i);
          setDetectedJob({
            title: titleParts[0]?.trim() || 'Job Opportunity',
            company: titleParts[1]?.trim() || 'Company',
            location: 'See Job Details',
            url,
            atsType,
          });
        } else {
          setDetectedJob(null);
        }
      }
    } catch (err) {
      console.error('[CareerAgent Popup] Error scanning tab:', err);
      setDetectedJob(null);
    } finally {
      setIsDetecting(false);
    }
  }, [sendMessageToTab]);

  useEffect(() => {
    scanActiveTab();
  }, [scanActiveTab]);

  // Handle Save to Tracker
  const handleSaveToTracker = async (job: JobDetails, status: ApplicationStatus = 'SAVED') => {
    await addApplication({
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.url,
      atsProvider: job.atsType,
      status,
      followUpDays: settings.followUpDays,
    });

    setApplications(await getApplications());
  };

  // Handle deleting a single application
  const handleDeleteApplication = async (id: string) => {
    await deleteApplication(id);
    setApplications(await getApplications());
  };

  // Handle clearing all applications
  const handleClearApplications = async () => {
    await clearApplications();
    setApplications([]);
  };

  // Handle 1-Click Autofill Form
  const handleTriggerAutofill = async () => {
    if (!activeTabId || !detectedJob) return;

    setIsAutofilling(true);
    setAutofillStatus({ message: null, type: 'idle' });

    try {
      const response = await sendMessageToTab<{ success: boolean; message?: string }>(activeTabId, {
        type: 'AUTOFILL_APPLICATION',
        profile,
      });

      if (response?.ok && response.data?.success) {
        setAutofillStatus({
          message: response.data.message || 'Form autofilled successfully!',
          type: 'success',
        });

        // Only auto-track if explicitly enabled by user in settings
        if (settings.autoTrackOnAutofill) {
          await handleSaveToTracker(detectedJob, 'APPLIED');
        }
      } else {
        const errorMsg =
          (response?.ok ? response.data?.message : response?.message) ||
          'Could not find supported form inputs. Are you on the application form page?';
        setAutofillStatus({
          message: errorMsg,
          type: 'error',
        });
      }
    } catch (err: any) {
      setAutofillStatus({
        message: err?.message || 'Error occurred while autofilling form.',
        type: 'error',
      });
    } finally {
      setIsAutofilling(false);
    }
  };

  const isAlreadyTracked = Boolean(
    detectedJob &&
      applications.some(
        (a) =>
          (detectedJob.url && a.url === detectedJob.url) ||
          (a.company.toLowerCase() === detectedJob.company.toLowerCase() &&
            a.title.toLowerCase() === detectedJob.title.toLowerCase())
      )
  );

  // Kept for the (currently hidden) applications view.
  void handleDeleteApplication;
  void handleClearApplications;

  return (
    <div className="w-[380px] min-h-[480px] max-h-[580px] flex flex-col bg-background text-foreground font-sans select-none overflow-x-hidden">
      {/* Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        settings={settings}
        theme={theme}
        onThemeToggle={handleThemeToggle}
      />

      {/* Main Content */}
      <main className="flex-1 p-3.5 overflow-y-auto custom-scrollbar space-y-3">
        {currentView === 'settings' ? (
          <SettingsView
            settings={settings}
            onSettingsSaved={(updated) => setSettings(updated)}
            onBack={() => setCurrentView('main')}
          />
        ) : (
          <>
            {/* 1. Active Tab Job Detector Card */}
            <JobDetectorCard
              job={detectedJob}
              isLoading={isDetecting}
              onRefresh={scanActiveTab}
              onSaveToTracker={handleSaveToTracker}
              onTriggerAutofill={handleTriggerAutofill}
              isAutofilling={isAutofilling}
              autofillStatus={autofillStatus}
              isAlreadyTracked={isAlreadyTracked}
              settings={settings}
              onOpenSettings={() => setCurrentView('settings')}
            />

            {/* 2. AI Model Status & Web Links Bar */}
            <ProfileSyncBar
              settings={settings}
              profile={profile}
              onOpenSettings={() => setCurrentView('settings')}
            />
          </>
        )}
      </main>
    </div>
  );
};
