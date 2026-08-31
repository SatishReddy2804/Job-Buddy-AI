export type WorkMode = 'remote' | 'hybrid' | 'onsite';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'principal';
export type ApplicationStage =
  | 'discovered'
  | 'matched'
  | 'applied'
  | 'viewed'
  | 'interview'
  | 'offer'
  | 'rejected';
export type ApplicationMethod = 'manual' | 'easy_apply' | 'company_site' | 'email';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  headline: string | null;
  location: string | null;
  phone: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  present_role: string | null;
  target_roles: string[];
  years_experience: number | null;
  industry_preferences: string[];
  work_mode: WorkMode | null;
  salary_min: number | null;
  salary_max: number | null;
  company_size_pref: string[];
  visa_sponsorship: boolean;
  relocation: boolean;
  tech_stack: string[];
  experience_level: ExperienceLevel | null;
  preferred_currency: string;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string | null;
}

export interface ProfileSkill extends Skill {
  proficiency: number;
}

export interface ResumeContent {
  summary?: string;
  experience?: Array<{
    company: string;
    role: string;
    start: string;
    end: string;
    description: string;
  }>;
  education?: Array<{
    school: string;
    degree: string;
    field: string;
    graduation: string;
  }>;
  skills?: string[];
  projects?: Array<{ name: string; description: string }>;
  certifications?: string[];
}

export interface Resume {
  id: string;
  user_id: string;
  label: string;
  content: ResumeContent;
  ats_score: number | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  source: string | null;
  source_job_id: string | null;
  title: string;
  company: string;
  company_logo_url: string | null;
  location: string | null;
  work_mode: WorkMode | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  experience_level: ExperienceLevel | null;
  description: string | null;
  requirements: string[];
  skills_required: string[];
  skills_preferred: string[];
  benefits: string[];
  company_size: string | null;
  industry: string | null;
  apply_url: string | null;
  is_remote: boolean | null;
  posted_at: string | null;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  resume_id: string | null;
  stage: ApplicationStage;
  status: string;
  match_score: number | null;
  ats_score: number | null;
  cover_letter: string | null;
  application_method: ApplicationMethod | null;
  applied_at: string | null;
  recruiter_name: string | null;
  recruiter_email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  job?: Job;
  resume?: Resume;
}

export interface ApplicationNote {
  id: string;
  application_id: string;
  content: string;
  created_at: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  query: Record<string, unknown>;
  alert_enabled: boolean;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
