import type { ApplicationStage, ExperienceLevel, WorkMode } from '@/types';

export function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function initials(name: string | null | undefined): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

export const CURRENCY_OPTIONS = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'INR', label: 'Indian Rupee' },
  { code: 'JPY', label: 'Japanese Yen' },
  { code: 'CAD', label: 'Canadian Dollar' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'SGD', label: 'Singapore Dollar' },
  { code: 'BRL', label: 'Brazilian Real' },
  { code: 'CHF', label: 'Swiss Franc' },
] as const;

export function convertAmount(amount: number, sourceCurrency: string, targetCurrency: string, rates: Record<string, number>): number | null {
  if (sourceCurrency === targetCurrency) return amount;
  const sourceRate = rates[sourceCurrency];
  const targetRate = rates[targetCurrency];
  if (!sourceRate || !targetRate) return null;
  return (amount / sourceRate) * targetRate;
}

export function formatSalary(
  min: number | null,
  max: number | null,
  currency = 'USD',
  rates: Record<string, number> = { USD: 1 },
): string {
  const convertedMin = min === null ? null : convertAmount(min, currency, currency, rates) ?? min;
  const convertedMax = max === null ? null : convertAmount(max, currency, currency, rates) ?? max;
  const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 });
  if (convertedMin !== null && convertedMax !== null) return `${formatter.format(convertedMin)}–${formatter.format(convertedMax)}`;
  if (convertedMin !== null) return `${formatter.format(convertedMin)}+`;
  if (convertedMax !== null) return `up to ${formatter.format(convertedMax)}`;
  return 'Not disclosed';
}

export function formatConvertedSalary(
  min: number | null,
  max: number | null,
  sourceCurrency: string,
  targetCurrency: string,
  rates: Record<string, number>,
): string {
  const convertedMin = min === null ? null : convertAmount(min, sourceCurrency, targetCurrency, rates);
  const convertedMax = max === null ? null : convertAmount(max, sourceCurrency, targetCurrency, rates);
  if (sourceCurrency !== targetCurrency && convertedMin === null && convertedMax === null) {
    return formatSalary(min, max, sourceCurrency, rates);
  }
  const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: targetCurrency, maximumFractionDigits: 0 });
  if (convertedMin !== null && convertedMax !== null) return `${formatter.format(convertedMin)}–${formatter.format(convertedMax)}`;
  if (convertedMin !== null) return `${formatter.format(convertedMin)}+`;
  if (convertedMax !== null) return `up to ${formatter.format(convertedMax)}`;
  return 'Not disclosed';
}

export interface ProfileFormInput {
  full_name: string;
  headline: string;
  location: string;
  phone: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  present_role: string;
  target_roles: string;
  years_experience: string;
  salary_min: string;
  salary_max: string;
}

export type ProfileValidationErrors = Partial<Record<keyof ProfileFormInput, string>>;

function validOptionalUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.match(/^https?:\/\//i) ? value : `https://${value}`);
    return Boolean(url.hostname.includes('.') && !url.hostname.includes(' '));
  } catch {
    return false;
  }
}

function validOptionalPhone(value: string): boolean {
  if (!value.trim()) return true;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

function validOptionalInteger(value: string, min: number, max: number): boolean {
  if (!value.trim()) return true;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max;
}

export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function validateProfileForm(form: ProfileFormInput): ProfileValidationErrors {
  const errors: ProfileValidationErrors = {};
  if (form.full_name.trim().length < 2) errors.full_name = 'Enter your full name.';
  if (form.location.trim().length < 2) errors.location = 'Enter a valid city, region, or country.';
  if (!validOptionalPhone(form.phone)) errors.phone = 'Enter a valid phone number.';
  if (!validOptionalUrl(form.linkedin_url)) errors.linkedin_url = 'Enter a valid LinkedIn URL.';
  if (!validOptionalUrl(form.github_url)) errors.github_url = 'Enter a valid GitHub URL.';
  if (!validOptionalUrl(form.portfolio_url)) errors.portfolio_url = 'Enter a valid website URL.';
  if (!validOptionalInteger(form.years_experience, 0, 50)) errors.years_experience = 'Use a whole number from 0 to 50.';
  if (form.target_roles.trim().length < 2) errors.target_roles = 'Add at least one target role.';

  const min = form.salary_min.trim() ? Number(form.salary_min) : null;
  const max = form.salary_max.trim() ? Number(form.salary_max) : null;
  if (!validOptionalInteger(form.salary_min, 0, 100000000)) errors.salary_min = 'Enter a valid non-negative salary.';
  if (!validOptionalInteger(form.salary_max, 0, 100000000)) errors.salary_max = 'Enter a valid non-negative salary.';
  if (min !== null && max !== null && Number.isInteger(min) && Number.isInteger(max) && min > max) {
    errors.salary_max = 'Salary max must be greater than or equal to salary min.';
  }
  return errors;
}

export function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (days > 30) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (days >= 1) return `${days}d ago`;
  if (hours >= 1) return `${hours}h ago`;
  return 'just now';
}

export const STAGE_ORDER: ApplicationStage[] = ['discovered', 'matched', 'applied', 'viewed', 'interview', 'offer', 'rejected'];
export const STAGE_LABELS: Record<ApplicationStage, string> = { discovered: 'Discovered', matched: 'Matched', applied: 'Applied', viewed: 'Viewed', interview: 'Interview', offer: 'Offer', rejected: 'Rejected' };
export const STAGE_COLORS: Record<ApplicationStage, string> = { discovered: 'bg-secondary-100 text-secondary-700 border-secondary-200', matched: 'bg-primary-50 text-primary-700 border-primary-200', applied: 'bg-blue-50 text-blue-700 border-blue-200', viewed: 'bg-amber-50 text-amber-700 border-amber-200', interview: 'bg-violet-50 text-violet-700 border-violet-200', offer: 'bg-emerald-50 text-emerald-700 border-emerald-200', rejected: 'bg-rose-50 text-rose-700 border-rose-200' };
export const WORK_MODE_LABELS: Record<WorkMode, string> = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' };
export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = { entry: 'Entry level', mid: 'Mid level', senior: 'Senior level', lead: 'Lead', principal: 'Principal' };
export function matchScoreColor(score: number | null): string { if (score === null) return 'text-secondary-400'; if (score >= 80) return 'text-emerald-600'; if (score >= 60) return 'text-primary-600'; if (score >= 40) return 'text-amber-600'; return 'text-rose-600'; }
export function matchScoreBg(score: number | null): string { if (score === null) return 'bg-secondary-100'; if (score >= 80) return 'bg-emerald-500'; if (score >= 60) return 'bg-primary-500'; if (score >= 40) return 'bg-amber-500'; return 'bg-rose-500'; }
export function computeMatchScore(jobSkillsRequired: string[], jobSkillsPreferred: string[], userSkills: string[]): { score: number; matched: string[]; missing: string[] } {
  const normalize = (s: string) => s.toLowerCase().trim();
  const userSet = new Set(userSkills.map(normalize));
  const required = jobSkillsRequired.map(normalize);
  const preferred = jobSkillsPreferred.map(normalize);
  const matchedReq = required.filter((s) => userSet.has(s));
  const matchedPref = preferred.filter((s) => userSet.has(s));
  const missing = jobSkillsRequired.filter((s) => !userSet.has(normalize(s)));
  const reqWeight = required.length > 0 ? (matchedReq.length / required.length) * 60 : 40;
  const prefWeight = preferred.length > 0 ? (matchedPref.length / preferred.length) * 25 : 15;
  const score = Math.round(Math.min(100, reqWeight + prefWeight + 15));
  const matched = [...matchedReq, ...matchedPref].map((s) => jobSkillsRequired.concat(jobSkillsPreferred).find((orig) => normalize(orig) === s)).filter(Boolean) as string[];
  return { score, matched, missing };
}
