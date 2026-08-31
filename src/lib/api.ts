import { supabase } from '@/lib/supabase';
import type {
  Application,
  ApplicationStage,
  Job,
  Profile,
  ProfileSkill,
  Resume,
  ResumeContent,
  Skill,
} from '@/types';

export async function fetchProfileSkills(profileId: string): Promise<ProfileSkill[]> {
  const { data, error } = await supabase
    .from('profile_skills')
    .select('proficiency, skill_id, skills(id, name, category)')
    .eq('profile_id', profileId);
  if (error) throw error;
  return (data as unknown as Array<{ proficiency: number; skill_id: string; skills: Skill }>).map(
    (row) => ({
      id: row.skill_id,
      name: row.skills.name,
      category: row.skills.category,
      proficiency: row.proficiency,
    })
  );
}

export async function updateProfile(profileId: string, updates: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', profileId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function fetchJobs(filters?: {
  search?: string;
  workMode?: string;
  experienceLevel?: string;
  company?: string;
  limit?: number;
}): Promise<Job[]> {
  let query = supabase.from('jobs').select('*').order('posted_at', { ascending: false });
  if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
  if (filters?.workMode && filters.workMode !== 'all') query = query.eq('work_mode', filters.workMode);
  if (filters?.experienceLevel && filters.experienceLevel !== 'all')
    query = query.eq('experience_level', filters.experienceLevel);
  if (filters?.company) query = query.ilike('company', `%${filters.company}%`);
  if (filters?.limit) query = query.limit(filters.limit);
  const { data, error } = await query;
  if (error) throw error;
  return data as Job[];
}

export async function fetchApplications(): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*, job:jobs(*), resume:resumes(*)')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data as Application[];
}

export async function createApplication(
  jobId: string,
  stage: ApplicationStage = 'discovered',
  matchScore?: number
): Promise<Application> {
  const { data, error } = await supabase
    .from('applications')
    .insert({ job_id: jobId, stage, match_score: matchScore ?? null })
    .select('*, job:jobs(*)')
    .single();
  if (error) throw error;
  return data as Application;
}

export async function updateApplicationStage(
  applicationId: string,
  stage: ApplicationStage,
  extra?: Partial<Application>
): Promise<Application> {
  const updates: Partial<Application> = { stage, ...extra };
  if (stage === 'applied' && !extra?.applied_at) updates.applied_at = new Date().toISOString();
  const { data, error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', applicationId)
    .select('*, job:jobs(*)')
    .single();
  if (error) throw error;
  return data as Application;
}

export async function deleteApplication(applicationId: string): Promise<void> {
  const { error } = await supabase.from('applications').delete().eq('id', applicationId);
  if (error) throw error;
}

export async function fetchResumes(): Promise<Resume[]> {
  const { data, error } = await supabase.from('resumes').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Resume[];
}

export async function createResume(label: string, content: ResumeContent): Promise<Resume> {
  const { data, error } = await supabase
    .from('resumes')
    .insert({ label, content })
    .select()
    .single();
  if (error) throw error;
  return data as Resume;
}

export async function updateResume(resumeId: string, updates: Partial<Resume>): Promise<Resume> {
  const { data, error } = await supabase
    .from('resumes')
    .update(updates)
    .eq('id', resumeId)
    .select()
    .single();
  if (error) throw error;
  return data as Resume;
}

export async function deleteResume(resumeId: string): Promise<void> {
  const { error } = await supabase.from('resumes').delete().eq('id', resumeId);
  if (error) throw error;
}

export async function logActivity(
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await supabase.from('activity_log').insert({
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata ?? {},
  });
}
