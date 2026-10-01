import React, { useState } from 'react';
import { CandidateProfile, WorkAuthorizationStatus } from '../types';
import { saveProfile } from '../lib/storage';
import {
  Save,
  CheckCircle2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './Icons';

interface ProfileFormProps {
  initialProfile: CandidateProfile;
  onProfileUpdated: (profile: CandidateProfile) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialProfile,
  onProfileUpdated,
}) => {
  const [formData, setFormData] = useState<CandidateProfile>(initialProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (
    field: keyof CandidateProfile,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaveSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveProfile(formData);
      onProfileUpdated(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Candidate Profile
          </h2>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Used to autofill 1-click ATS applications.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <span>Saving...</span>
          ) : saveSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </>
          )}
        </button>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-2.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile saved and synced successfully!</span>
        </div>
      )}

      {/* Section 1: Personal Info */}
      <div className="space-y-3 p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 pb-1 border-b border-stone-100 dark:border-stone-800">
          <User className="w-3.5 h-3.5 text-brand-600" />
          <span>Personal Information</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1">
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="e.g. Alex"
              className="w-full px-2.5 py-1.5 rounded-md text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="e.g. Chen"
              className="w-full px-2.5 py-1.5 rounded-md text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="alex.chen@example.com"
              className="w-full pl-8 pr-2.5 py-1.5 rounded-md text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full pl-8 pr-2.5 py-1.5 rounded-md text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1">
              Location / City
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="San Francisco, CA"
                className="w-full pl-8 pr-2.5 py-1.5 rounded-md text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Online Profiles & Links */}
      <div className="space-y-3 p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 pb-1 border-b border-stone-100 dark:border-stone-800">
          <Globe className="w-3.5 h-3.5 text-brand-600" />
          <span>Professional Links</span>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1">
            LinkedIn Profile URL
          </label>
          <div className="relative">
            <LinkedinIcon className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-2.5" />
            <input
              type="url"
              value={formData.linkedinUrl}
              onChange={(e) => handleChange('linkedinUrl', e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full pl-8 pr-2.5 py-1.5 rounded-md text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1">
            GitHub Profile URL
          </label>
          <div className="relative">
            <GithubIcon className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300 absolute left-2.5 top-2.5" />
            <input
              type="url"
              value={formData.githubUrl}
              onChange={(e) => handleChange('githubUrl', e.target.value)}
              placeholder="https://github.com/username"
              className="w-full pl-8 pr-2.5 py-1.5 rounded-md text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1">
            Portfolio / Personal Website
          </label>
          <div className="relative">
            <Globe className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            <input
              type="url"
              value={formData.portfolioUrl}
              onChange={(e) => handleChange('portfolioUrl', e.target.value)}
              placeholder="https://yourportfolio.com"
              className="w-full pl-8 pr-2.5 py-1.5 rounded-md text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Work Authorization & Sponsorship */}
      <div className="space-y-3 p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 pb-1 border-b border-stone-100 dark:border-stone-800">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
          <span>Work Authorization & Compliance</span>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1">
            Work Authorization Status
          </label>
          <select
            value={formData.workAuthorization}
            onChange={(e) =>
              handleChange('workAuthorization', e.target.value as WorkAuthorizationStatus)
            }
            className="w-full px-2.5 py-1.5 rounded-md text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="US_CITIZEN">US Citizen</option>
            <option value="GREEN_CARD">Permanent Resident (Green Card)</option>
            <option value="NEED_SPONSORSHIP">Requires Sponsorship (H-1B, F-1 OPT, etc.)</option>
            <option value="OTHER">Other Authorization</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <label className="text-xs font-medium text-stone-800 dark:text-stone-200 block">
              Will you require visa sponsorship?
            </label>
            <span className="text-[10px] text-stone-500 dark:text-stone-400">
              Autofills sponsorship questions on ATS forms.
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.requiresSponsorship}
              onChange={(e) => handleChange('requiresSponsorship', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
          </label>
        </div>
      </div>
    </form>
  );
};
