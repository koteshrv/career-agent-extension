import React, { useState, useEffect, useCallback } from 'react';
import { JobDetails, TrackedApplication, ExtensionView, ExtensionSettings, ApplicationStatus, CandidateProfile, StoredResume, CompanySignal, AutofillResult } from '../../src/types';
import { getSettings, getProfile, getApplications, getResume, addApplication, updateApplicationStatus, deleteApplication, saveApplications, getTheme, DEFAULT_SETTINGS, DEFAULT_PROFILE } from '../../src/lib/storage';
import { request, requestTab, BridgeError } from '../../src/lib/messages';
import { dueFollowUps } from '../../src/lib/followups';
import { Header } from '../../src/components/Header';
import { BottomTabs } from '../../src/components/BottomTabs';
import { JobView } from '../../src/components/JobView';
import { PipelineView } from '../../src/components/PipelineView';
import { ProfileView } from '../../src/components/ProfileView';
import { SettingsView } from '../../src/components/SettingsView';

export const App: React.FC = () => {
  const [view, setView] = useState<ExtensionView>('job');
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<CandidateProfile>(DEFAULT_PROFILE);
  const [resume, setResume] = useState<StoredResume | null>(null);
  const [apps, setApps] = useState<TrackedApplication[]>([]);
  const [job, setJob] = useState<JobDetails | null>(null);
  const [tabId, setTabId] = useState<number | null>(null);
  const [scanning, setScanning] = useState(true);
  const [skills, setSkills] = useState<{ matched: string[]; missing: string[] } | null>(null);
  const [signal, setSignal] = useState<CompanySignal | null>(null);
  const [autofill, setAutofill] = useState<{ busy: boolean; message: string | null; tone: 'success' | 'error' | 'idle' }>({ busy: false, message: null, tone: 'idle' });

  // Theme follows the stored preference, else the system, like the dashboard.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (t: 'light' | 'dark' | null) => document.documentElement.classList.toggle('dark', (t ?? (mq.matches ? 'dark' : 'light')) === 'dark');
    getTheme().then(apply);
    const onChange = () => getTheme().then(apply);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const refreshApps = useCallback(async () => setApps(await getApplications()), []);

  useEffect(() => {
    (async () => {
      const [s, p, a, r] = await Promise.all([getSettings(), getProfile(), getApplications(), getResume()]);
      setSettings(s);
      setProfile(p);
      setApps(a);
      setResume(r);
    })();
    const onChange = (changes: Record<string, unknown>, area: string) => {
      if (area === 'local' && 'careeragent_applications' in changes) refreshApps();
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, [refreshApps]);

  // Read the active tab once the profile is known (skills match needs it).
  const scan = useCallback(async () => {
    setScanning(true);
    setAutofill({ busy: false, message: null, tone: 'idle' });
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !tab.url || /^(chrome|edge|about|chrome-extension):/.test(tab.url)) {
        setJob(null);
        return;
      }
      setTabId(tab.id);
      const res = await requestTab<JobDetails | null>(tab.id, { type: 'EXTRACT_JOB_DETAILS' });
      const detected = res?.ok ? res.data : null;
      setJob(detected);
      if (detected) {
        const currentProfile = await getProfile();
        if (currentProfile.skills?.length) {
          const m = await requestTab<{ matched: string[]; missing: string[] }>(tab.id, { type: 'MATCH_SKILLS', skills: currentProfile.skills });
          setSkills(m?.ok ? m.data : null);
        } else setSkills(null);
        request<CompanySignal | null>({ type: 'COMPANY_SIGNAL', company: detected.company }, 5000).then(setSignal).catch(() => setSignal(null));
      } else {
        setSkills(null);
        setSignal(null);
      }
    } catch {
      setJob(null);
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    scan();
  }, [scan]);

  const tracked = job ? apps.find((a) => (job.url && a.url === job.url) || (a.company.toLowerCase() === job.company.toLowerCase() && a.title.toLowerCase() === job.title.toLowerCase())) ?? null : null;

  const save = async () => {
    if (!job) return;
    await addApplication({ title: job.title, company: job.company, location: job.location, url: job.url, atsProvider: job.atsType, status: 'SAVED', followUpDays: settings.followUpDays });
    await refreshApps();
  };

  const setStatus = async (id: string, status: ApplicationStatus) => {
    await updateApplicationStatus(id, status);
    await refreshApps();
  };

  const followedUp = async (id: string) => {
    const all = await getApplications();
    const now = new Date();
    await saveApplications(all.map((a) => (a.id === id ? { ...a, followedUp: true, followUpDate: new Date(now.getTime() + 4 * 86_400_000).toISOString(), updatedAt: now.toISOString() } : a)));
    await refreshApps();
  };

  const remove = async (id: string) => {
    await deleteApplication(id);
    await refreshApps();
  };

  const runAutofill = async () => {
    if (!tabId) return;
    setAutofill({ busy: true, message: null, tone: 'idle' });
    try {
      const r = await request<AutofillResult & { tracked?: boolean }>({ type: 'RUN_AUTOFILL_ON_ACTIVE_TAB' }, 30_000);
      setAutofill({ busy: false, message: r.success ? `${r.message}${r.tracked ? ' Added to your pipeline as Applied.' : ''}` : r.message, tone: r.success ? 'success' : 'error' });
      if (r.tracked) await refreshApps();
    } catch (e: unknown) {
      setAutofill({ busy: false, message: e instanceof BridgeError ? e.message : 'Autofill failed. Reload the page and try again.', tone: 'error' });
    }
  };

  const dueCount = dueFollowUps(apps).length;

  return (
    <div className="flex h-[560px] w-[380px] flex-col bg-background text-foreground">
      <Header settings={settings} onOpenSettings={() => setView('settings')} />
      <main className="flex-1 overflow-y-auto overscroll-contain p-3.5">
        {view === 'job' && (
          <JobView
            job={job}
            loading={scanning}
            onRescan={scan}
            tracked={tracked}
            onSave={save}
            onStatusChange={(s) => (tracked ? setStatus(tracked.id, s) : Promise.resolve())}
            onAutofill={runAutofill}
            autofill={autofill}
            skills={skills}
            signal={signal}
            settings={settings}
            onOpenSettings={() => setView('settings')}
          />
        )}
        {view === 'pipeline' && <PipelineView apps={apps} profile={profile} onStatusChange={setStatus} onFollowedUp={followedUp} onDelete={remove} />}
        {view === 'profile' && <ProfileView profile={profile} resume={resume} onChanged={setProfile} onResumeChanged={setResume} />}
        {view === 'settings' && <SettingsView settings={settings} onSettingsSaved={setSettings} onBack={() => setView('job')} />}
      </main>
      <BottomTabs view={view} onChange={setView} pipelineCount={dueCount} />
    </div>
  );
};
