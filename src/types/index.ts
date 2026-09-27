export type WorkAuthorizationStatus =
  | 'US_CITIZEN'
  | 'GREEN_CARD'
  | 'NEED_SPONSORSHIP'
  | 'OTHER';

export interface CandidateProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  workAuthorization: WorkAuthorizationStatus;
  requiresSponsorship: boolean;
  gender?: string;
  veteranStatus?: string;
  disabilityStatus?: string;
}

export type ATSType =
  | 'greenhouse'
  | 'lever'
  | 'ashby'
  | 'linkedin'
  | 'indeed'
  | 'generic';

export interface JobDetails {
  title: string;
  company: string;
  location: string;
  url: string;
  atsType: ATSType;
  salary?: string;
  description?: string;
  detectedAt?: string;
}

export type ApplicationStatus =
  | 'SAVED'
  | 'APPLIED'
  | 'INTERVIEWING'
  | 'OFFER'
  | 'REJECTED';

export interface TrackedApplication {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  jobUrl: string;
  atsType?: ATSType | string;
  status: ApplicationStatus;
  appliedAt: string; // ISO string
  followUpDate: string; // ISO string (+3 days by default)
  notes?: string;
  syncedWithServer?: boolean;
}

export interface AutofillResult {
  success: boolean;
  fieldsFilled: number;
  atsType: ATSType;
  message: string;
  details?: Record<string, string>;
}

export interface ExtensionSettings {
  apiKey: string;
  apiUrl: string;
  webAppUrl: string;
  autoTrackOnAutofill: boolean;
  notificationsEnabled: boolean;
  followUpDays: number;
}

export interface SyncedProfileSummary {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  lastSyncedAt: string;
  profile: CandidateProfile;
}

export type ExtensionView = 'main' | 'settings';
