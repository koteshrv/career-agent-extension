import React, { useState, useEffect, useCallback } from 'react';
import {
  CandidateProfile,
  JobDetails,
  TrackedApplication,
  AuthUser,
  ExtensionView,
  ApplicationStatus,
} from '../../src/types';
import {
  getProfile,
  getApplications,
  addApplication,
  getAuth,
  getTheme,
  saveTheme,
  DEFAULT_PROFILE,
} from '../../src/lib/storage';
import { syncApplicationToServer } from '../../src/lib/api';
import { Header } from '../../src/components/Header';
import { JobDetectorCard } from '../../src/components/JobDetectorCard';
import { ProfileForm } from '../../src/components/ProfileForm';
import { ApplicationBoard } from '../../src/components/ApplicationBoard';
import { ManualAddModal } from '../../src/components/ManualAddModal';
import { extractJobDetails } from '../../src/lib/extractors';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ExtensionView>('detect');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<CandidateProfile>(DEFAULT_PROFILE);
  const [applications, setApplications] = useState<TrackedApplication[]>([]);
  const [detectedJob, setDetectedJob] = useState<JobDetails | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(true);
  const [isAutofilling, setIsAutofilling] = useState<boolean>(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
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
    async function loadInitialData() {
      const [storedProfile, storedApps, storedAuth, storedTheme] = await Promise.all([
        getProfile(),
        getApplications(),
        getAuth(),
        getTheme(),
      ]);

      setProfile(storedProfile);
      setApplications(storedApps);
      setAuthUser(storedAuth);
      setTheme(storedTheme);
    }

    loadInitialData();
  }, []);

  // Theme toggle
  const handleThemeToggle = async () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    await saveTheme(nextTheme);
  };

  // Safe message sender to active tab with fallback injection
  const sendMessageToTab = useCallback(async (tabId: number, message: any): Promise<any> => {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, message, async (response) => {
        if (chrome.runtime?.lastError) {
          // If content script was not yet loaded into the tab, attempt injection
          try {
            if (chrome.scripting) {
              await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content-scripts/content.js'],
              });
              // Retry sending message after slight delay
              setTimeout(() => {
                chrome.tabs.sendMessage(tabId, message, (retryRes) => {
                  if (chrome.runtime?.lastError) {
                    resolve(null);
                  } else {
                    resolve(retryRes);
                  }
                });
              }, 150);
              return;
            }
          } catch {
            // Ignore injection error (e.g. chrome:// tabs)
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
        // Mock fallback for browser dev environment
        setDetectedJob({
          title: 'Senior Software Engineer, Core Infrastructure',
          company: 'Stripe',
          location: 'San Francisco, CA / Remote',
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

      // Try sending message to content script
      const response = await sendMessageToTab(tab.id, { type: 'EXTRACT_JOB_DETAILS' });

      if (response && response.success && response.data) {
        setDetectedJob(response.data);
      } else {
        // Fallback: heuristic extraction from tab URL and title
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
    const newApp = await addApplication({
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      jobUrl: job.url,
      atsType: job.atsType,
      status,
    });

    const updated = await getApplications();
    setApplications(updated);

    // Sync to backend
    syncApplicationToServer(newApp).catch(() => {});
  };

  // Handle Trigger Autofill (Double Value Loop: Fill + Track with 3-Day Reminder)
  const handleTriggerAutofill = async () => {
    if (!activeTabId || !detectedJob) return;

    setIsAutofilling(true);
    setAutofillStatus({ message: null, type: 'idle' });

    try {
      const response = await sendMessageToTab(activeTabId, {
        type: 'AUTOFILL_APPLICATION',
        profile,
      });

      if (response && response.success && response.data?.success) {
        setAutofillStatus({
          message: response.data.message || 'Form autofilled successfully!',
          type: 'success',
        });

        // Double Value Loop: Auto-log application to tracker with APPLIED status and 3-day reminder!
        await handleSaveToTracker(detectedJob, 'APPLIED');
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

  // Calculate count of applications requiring follow-up
  const followUpDueCount = applications.filter((app) => {
    if (app.status === 'REJECTED' || app.status === 'OFFER') return false;
    if (!app.followUpDate) return false;
    return new Date(app.followUpDate) <= new Date();
  }).length;

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
    <div className="w-[380px] min-h-[520px] max-h-[580px] flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans select-none overflow-x-hidden">
      {/* Header with Brand + Auth + Tabs */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        authUser={authUser}
        onAuthChange={setAuthUser}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        followUpDueCount={followUpDueCount}
      />

      {/* Main Content Body */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {currentView === 'detect' && (
          <JobDetectorCard
            job={detectedJob}
            isLoading={isDetecting}
            onRefresh={scanActiveTab}
            onSaveToTracker={handleSaveToTracker}
            onTriggerAutofill={handleTriggerAutofill}
            isAutofilling={isAutofilling}
            autofillStatus={autofillStatus}
            isAlreadyTracked={isAlreadyTracked}
            profile={profile}
            onGoToProfile={() => setCurrentView('profile')}
          />
        )}

        {currentView === 'applications' && (
          <ApplicationBoard
            applications={applications}
            onRefreshApplications={async () => {
              const updated = await getApplications();
              setApplications(updated);
            }}
            onAddNewManual={() => setIsManualModalOpen(true)}
          />
        )}

        {currentView === 'profile' && (
          <ProfileForm
            initialProfile={profile}
            onProfileUpdated={(updated) => setProfile(updated)}
          />
        )}
      </main>

      {/* Manual Add Job Modal */}
      <ManualAddModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAdd={async (appData) => {
          await addApplication(appData);
          const updated = await getApplications();
          setApplications(updated);
        }}
      />
    </div>
  );
};
