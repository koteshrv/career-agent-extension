export type WorkAuthorizationStatus =
  | 'US_CITIZEN'
  | 'GREEN_CARD'
  | 'PERMANENT_RESIDENT'
  | 'NEED_SPONSORSHIP'
  | 'STUDENT_VISA'
  | 'OTHER';

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: string;
}

/**
 * Candidate profile. Contact + work-auth fields are required (the popup form edits them);
 * the rich fields are optional and arrive from the careeragent.fyi dashboard over the bridge.
 */
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
  headline?: string;
  summary?: string;
  skills?: string[];
  keyAccomplishments?: string[];
  experiences?: WorkExperience[];
  education?: Education[];
  resumeFileName?: string;
  resumeText?: string;
  updatedAt?: string;
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
  | 'ARCHIVED';

/** Same shape as the web dashboard's TrackedApplication so records pass through the bridge unchanged. */
export interface TrackedApplication {
  id: string;
  company: string;
  title: string;
  location?: string;
  url: string;
  salary?: string;
  status: ApplicationStatus;
  appliedDate: string; // ISO
  followUpDate?: string; // ISO
  followedUp?: boolean;
  notes?: string;
  contactName?: string;
  contactEmail?: string;
  atsProvider?: string;
  updatedAt: string; // ISO, last-write-wins clock for sync
}

export interface FillReport {
  /** Fields autofill set, with the label it read and the value it wrote. */
  filled: Array<{ label: string; value: string }>;
  /** Required fields that are still empty after the run. */
  empty: string[];
}

export interface AutofillResult {
  success: boolean;
  fieldsFilled: number;
  atsType: ATSType;
  message: string;
  details?: Record<string, string>;
  report?: FillReport;
}

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'groq';

export interface AIModelOption {
  id: string;
  name: string;
  description?: string;
}

export interface ExtensionSettings {
  aiProvider: AIProvider;
  aiApiKey: string;
  aiModel: string;
  autoTrackOnAutofill: boolean;
  /** Add the job to the pipeline as Applied when an application form is submitted on a known ATS. */
  autoTrackOnSubmit: boolean;
  notificationsEnabled: boolean;
  followUpDays: number;
}

/** An answer the user approved once; offered again when the same question appears. */
export interface SavedAnswer {
  question: string;
  answer: string;
  updatedAt: string;
}

/** The resume file the extension attaches to file inputs during autofill. */
export type ResumeKind = 'pdf' | 'tex' | 'md' | 'txt';

export interface StoredResume {
  id?: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64 for PDFs, empty for text formats
  text?: string; // the source for tex/md/txt resumes
  kind?: ResumeKind;
  /** The PDF autofill attaches when a form asks for a resume. At most one. */
  forUploads?: boolean;
  updatedAt: string;
}

export interface ResumeMeta {
  id: string;
  name: string;
  kind: ResumeKind;
  size: number;
  updatedAt: string;
  forUploads: boolean;
}

export interface CompanySignal {
  company_slug: string;
  total_applications: number;
  interview_rate: number;
  ghost_score: number;
  median_response_days: number | null;
}

export interface ResumeFilters {
  roles: string;
  keywords: string;
  excludes: string;
  location: string;
}

export type ExtensionView = 'job' | 'pipeline' | 'profile' | 'settings';
