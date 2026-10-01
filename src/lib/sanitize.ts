import { BridgeError } from './messages';
import type { ApplicationStatus, CandidateProfile, Education, TrackedApplication, WorkAuthorizationStatus, WorkExperience } from '../types';

const MAX_STR = 20_000; // resumeText / summary

/** Deep-clamps a JSON value: strings, arrays and depth capped; functions and prototypes dropped. */
export function clamp(v: unknown, depth = 0): unknown {
  if (depth > 4) return undefined;
  if (typeof v === 'string') return v.slice(0, MAX_STR);
  if (typeof v === 'number' || typeof v === 'boolean' || v === null) return v;
  if (Array.isArray(v)) {
    return v.slice(0, 200).map((x) => clamp(x, depth + 1)).filter((x) => x !== undefined);
  }
  if (typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>).slice(0, 64)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      const c = clamp(x, depth + 1);
      if (c !== undefined) out[k] = c;
    }
    return out;
  }
  return undefined;
}

export const str = (v: unknown, max = 512): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const strArr = (v: unknown, max = 100): string[] | undefined =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim().slice(0, 200)).slice(0, max) : undefined;
const isoOr = (v: unknown, fallback?: string): string | undefined =>
  typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : fallback;

const WORK_AUTH: ReadonlySet<string> = new Set<WorkAuthorizationStatus>(['US_CITIZEN', 'GREEN_CARD', 'PERMANENT_RESIDENT', 'NEED_SPONSORSHIP', 'STUDENT_VISA', 'OTHER']);
const STATUSES: ReadonlySet<string> = new Set<ApplicationStatus>(['SAVED', 'APPLIED', 'INTERVIEWING', 'OFFER', 'ARCHIVED']);

function experience(v: unknown, i: number): WorkExperience | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const company = str(o.company, 200);
  const role = str(o.role, 200);
  if (!company && !role) return null;
  return {
    id: str(o.id, 64) || `exp_${Date.now()}_${i}`,
    company,
    role,
    startDate: str(o.startDate, 10),
    endDate: str(o.endDate, 10),
    current: o.current === true,
    description: str(o.description, 2000),
  };
}

function education(v: unknown, i: number): Education | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const institution = str(o.institution, 200);
  if (!institution) return null;
  return {
    id: str(o.id, 64) || `edu_${Date.now()}_${i}`,
    institution,
    degree: str(o.degree, 120),
    fieldOfStudy: str(o.fieldOfStudy, 120),
    graduationYear: str(o.graduationYear, 10),
  };
}

const objArr = <T>(v: unknown, fn: (x: unknown, i: number) => T | null, max: number): T[] | undefined =>
  Array.isArray(v) ? v.slice(0, max).map(fn).filter((x): x is T => x !== null) : undefined;

export function sanitizeProfile(input: unknown): CandidateProfile {
  const p = clamp(input) as Record<string, unknown> | undefined;
  if (!p || typeof p !== 'object') throw new BridgeError('BAD_PAYLOAD', 'profile must be an object');
  const auth = str(p.workAuthorization, 32);
  return {
    firstName: str(p.firstName),
    lastName: str(p.lastName),
    email: str(p.email),
    phone: str(p.phone, 64),
    location: str(p.location),
    linkedinUrl: str(p.linkedinUrl, 2048),
    githubUrl: str(p.githubUrl, 2048),
    portfolioUrl: str(p.portfolioUrl, 2048),
    workAuthorization: WORK_AUTH.has(auth) ? (auth as WorkAuthorizationStatus) : 'OTHER',
    requiresSponsorship: p.requiresSponsorship === true,
    gender: str(p.gender, 64) || undefined,
    veteranStatus: str(p.veteranStatus, 64) || undefined,
    disabilityStatus: str(p.disabilityStatus, 64) || undefined,
    headline: str(p.headline, 200) || undefined,
    summary: str(p.summary, MAX_STR) || undefined,
    skills: strArr(p.skills),
    keyAccomplishments: strArr(p.keyAccomplishments, 30),
    experiences: objArr(p.experiences, experience, 20),
    education: objArr(p.education, education, 10),
    resumeFileName: str(p.resumeFileName, 256) || undefined,
    resumeText: str(p.resumeText, MAX_STR) || undefined,
    updatedAt: isoOr(p.updatedAt, new Date().toISOString()),
  };
}

export function sanitizeApplication(input: unknown): TrackedApplication {
  const a = clamp(input) as Record<string, unknown> | undefined;
  if (!a || typeof a !== 'object') throw new BridgeError('BAD_PAYLOAD', 'application must be an object');
  const id = str(a.id, 64);
  const title = str(a.title);
  const company = str(a.company);
  const url = str(a.url, 2048);
  if (!id || !title || !company) throw new BridgeError('BAD_PAYLOAD', 'id, title and company are required');
  if (url && !/^https?:\/\//i.test(url)) throw new BridgeError('BAD_PAYLOAD', 'url must be http(s)');
  const status = str(a.status, 32);
  const now = new Date().toISOString();
  return {
    id,
    title,
    company,
    url,
    location: str(a.location) || undefined,
    salary: str(a.salary, 128) || undefined,
    status: STATUSES.has(status) ? (status as ApplicationStatus) : 'APPLIED',
    appliedDate: isoOr(a.appliedDate, now)!,
    followUpDate: isoOr(a.followUpDate),
    followedUp: a.followedUp === true,
    notes: str(a.notes, 5000) || undefined,
    contactName: str(a.contactName) || undefined,
    contactEmail: str(a.contactEmail) || undefined,
    atsProvider: str(a.atsProvider, 32) || undefined,
    updatedAt: isoOr(a.updatedAt, now)!,
  };
}
