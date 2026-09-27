import React, { useState, useEffect, useCallback } from 'react';
import {
  JobDetails,
  TrackedApplication,
  ExtensionView,
  ExtensionSettings,
  SyncedProfileSummary,
  ApplicationStatus,
  CandidateProfile,
} from '../../src/types';
import {
  getSettings,
  getSyncedProfile,
  getProfile,
  getApplications,
  addApplication,
  getTheme,
  saveTheme,
  DEFAULT_SETTINGS,
  DEFAULT_PROFILE,
} from '../../src/lib/storage';
import { Header } from '../../src/components/Header';
import { JobDetectorCard } from '../../src/components/JobDetectorCard';
import { ProfileSyncBar } from '../../src/components/ProfileSyncBar';
import { RecentApplicationsWidget } from '../../src/components/RecentApplicationsWidget';
import { SettingsView } from '../../src/components/SettingsView';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ExtensionView>('main');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [syncedProfile, setSyncedProfile] = useState<SyncedProfileSummary | null>(null);
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
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const [storedSettings, storedSynced, storedProfile, storedApps, storedTheme] =
        await Promise.all([
          getSettings(),
          getSyncedProfile(),
          getProfile(),
          getApplications(),
          getTheme(),
        ]);

      setSettings(storedSettings);
      setSyncedProfile(storedSynced);
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

  // Safe message sender to active tab
  const sendMessageToTab = useCallback(async (tabId: number, message: any): Promise<any> => {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, message, async (response) => {
        if (chrome.runtime?.lastError) {
          try {
            if (chrome.scripting) {
              await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content-scripts/content.js'],
              });
              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, message, (retryRes) => {
                  resolve(chrome.runtime?.lastError ? null : retryRes);
                });
              }, 150);
              return;
            }
          } catch {
            // Handled
          }
          resolve(null);
        } else {
          resolve(response);
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
        // Mock fallback for browser preview
        setDetectedJob({
          title: 'Senior Software Engineer, Core Infrastructure',
          company: 'Stripe',
          location: 'San Francisco, CA (Hybrid)',
          url: 'https://boards.greenhouse.io/stripe/jobs/demo',
          atsType: 'greenhouse',
        });
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

      const response = await sendMessageToTab(tab.id, { type: 'EXTRACT_JOB_DETAILS' });

      if (response && response.success && response.data) {
        setDetectedJob(response.data);
      } else {
        const url = tab.url;
        const pageTitle = tab.title || '';
        let atsType: import('../../src/types').ATSType = 'generic';

        if (url.includes('boards.greenhouse.io') || url.includes('gh_jid')) {
          atsType = 'greenhouse';
        } else if (url.includes('jobs.lever.co')) {
          atsType = 'lever';
        } else if (url.includes('jobs.ashbyhq.com')) {
          atsType = 'ashby';
        } else if (url.includes('linkedin.com/jobs')) {
          atsType = 'linkedin';
        }

        const titleParts = pageTitle.split(/ - | \| | at /i);
        const title = titleParts[0]?.trim() || 'Job Opportunity';
        const company = titleParts[1]?.trim() || 'Hiring Company';

        setDetectedJob({
          title,
          company,
          location: 'See Job Description',
          url,
          atsType,
        });
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
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      jobUrl: job.url,
      atsType: job.atsType,
      status,
      followUpDays: settings.followUpDays,
    });

    const updated = await getApplications();
    setApplications(updated);
  };

  // Handle 1-Click Autofill Form
  const handleTriggerAutofill = async () => {
    if (!activeTabId || !detectedJob) return;

    setIsAutofilling(true);
    setAutofillStatus({ message: null, type: 'idle' });

    try {
      const activeProfile = syncedProfile?.profile || profile;

      const response = await sendMessageToTab(activeTabId, {
        type: 'AUTOFILL_APPLICATION',
        profile: activeProfile,
      });

      if (response && response.success && response.data?.success) {
        setAutofillStatus({
          message: response.data.message || 'Form autofilled successfully!',
          type: 'success',
        });

        if (settings.autoTrackOnAutofill) {
          await handleSaveToTracker(detectedJob, 'APPLIED');
        }
      } else {
        const errorMsg =
          response?.data?.message ||
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
          (detectedJob.url && a.jobUrl === detectedJob.url) ||
          (a.company.toLowerCase() === detectedJob.company.toLowerCase() &&
            a.jobTitle.toLowerCase() === detectedJob.title.toLowerCase())
      )
  );

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
              syncedProfile={syncedProfile}
              onOpenSettings={() => setCurrentView('settings')}
            />

            {/* 3. Recent Tracked Applications Widget */}
            <RecentApplicationsWidget applications={applications} />
          </>
        )}
      </main>
    </div>
  );
};
