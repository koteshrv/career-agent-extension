import React, { useState } from 'react';
import { FileUp, ExternalLink, Save, Check, Trash2 } from 'lucide-react';
import { CandidateProfile, StoredResume, WorkAuthorizationStatus } from '../types';
import { Button, Field, inputClass } from './ui';
import { saveProfile, saveResume } from '../lib/storage';
import { openPlatformUrl } from '../lib/api';

interface ProfileViewProps {
  profile: CandidateProfile;
  resume: StoredResume | null;
  onChanged: (profile: CandidateProfile) => void;
  onResumeChanged: (resume: StoredResume | null) => void;
}

const MAX_RESUME = 5 * 1024 * 1024;

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, resume, onChanged, onResumeChanged }) => {
  const [form, setForm] = useState<CandidateProfile>(profile);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof CandidateProfile>(k: K, v: CandidateProfile[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = { ...form, updatedAt: new Date().toISOString() };
    await saveProfile(next);
    onChanged(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const attach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf') return setError('Only PDF resumes can be attached to forms.');
    if (file.size > MAX_RESUME) return setError('Keep the resume under 5 MB.');
    const reader = new FileReader();
    reader.onload = async () => {
      const data = String(reader.result).split(',')[1] || '';
      const stored: StoredResume = { name: file.name, type: file.type, size: file.size, data, updatedAt: new Date().toISOString() };
      await saveResume(stored);
      onResumeChanged(stored);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <section className="rounded-lg border border-border bg-card p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground">Resume for file uploads</p>
            <p className="text-[11px] text-muted-foreground">{resume ? `${resume.name} · ${(resume.size / 1024).toFixed(0)} KB` : 'Attach a PDF and autofill will upload it where a form asks for one.'}</p>
          </div>
          {resume && (
            <Button size="sm" variant="ghost" onClick={async () => { await saveResume(null); onResumeChanged(null); }} aria-label="Remove resume">
              <Trash2 />
            </Button>
          )}
        </div>
        <label className="mt-2.5 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-sm border border-input bg-card px-2.5 text-[13px] font-medium text-foreground hover:bg-muted">
          <FileUp className="size-4" />
          {resume ? 'Replace PDF' : 'Attach PDF'}
          <input type="file" accept="application/pdf" onChange={attach} className="sr-only" />
        </label>
        {error && <p className="mt-2 text-[11px] text-destructive">{error}</p>}
      </section>

      <section className="space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="First name"><input className={inputClass} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} autoComplete="given-name" /></Field>
          <Field label="Last name"><input className={inputClass} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} autoComplete="family-name" /></Field>
        </div>
        <Field label="Email"><input type="email" className={inputClass} value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" /></Field>
        <Field label="Phone"><input type="tel" className={inputClass} value={form.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" /></Field>
        <Field label="Location"><input className={inputClass} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="City, Country" /></Field>
        <Field label="LinkedIn"><input type="url" className={inputClass} value={form.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/…" /></Field>
        <Field label="GitHub"><input type="url" className={inputClass} value={form.githubUrl} onChange={(e) => set('githubUrl', e.target.value)} placeholder="https://github.com/…" /></Field>
        <Field label="Portfolio"><input type="url" className={inputClass} value={form.portfolioUrl} onChange={(e) => set('portfolioUrl', e.target.value)} placeholder="https://" /></Field>
        <Field label="Work authorization">
          <select className={inputClass} value={form.workAuthorization} onChange={(e) => set('workAuthorization', e.target.value as WorkAuthorizationStatus)}>
            <option value="US_CITIZEN">US citizen</option>
            <option value="PERMANENT_RESIDENT">Permanent resident</option>
            <option value="STUDENT_VISA">Student visa (F-1 / OPT)</option>
            <option value="NEED_SPONSORSHIP">Need sponsorship</option>
            <option value="OTHER">Other</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 text-[13px] text-foreground cursor-pointer">
          <input type="checkbox" checked={form.requiresSponsorship} onChange={(e) => set('requiresSponsorship', e.target.checked)} className="size-4 accent-primary" />
          I will need visa sponsorship
        </label>
      </section>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <button type="button" onClick={() => openPlatformUrl('/profile')} className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline cursor-pointer">
          Experience, skills and summary on the dashboard
          <ExternalLink className="size-3" />
        </button>
        <Button type="submit" variant="primary" size="sm">
          {saved ? <Check /> : <Save />}
          {saved ? 'Saved' : 'Save'}
        </Button>
      </div>
    </form>
  );
};
