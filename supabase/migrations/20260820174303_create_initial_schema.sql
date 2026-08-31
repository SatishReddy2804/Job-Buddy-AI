/*
# Job Buddy initial schema

1. Overview
Core data model for Job Buddy, an AI job application agent SaaS.
Multi-tenant: each authenticated user owns their data. Owner columns default to auth.uid()
so frontend inserts that omit user_id still satisfy RLS.

2. New Tables
- `profiles` — extended user profile (career info, preferences) 1:1 to auth.users
- `skills` — shared catalog of skills (seeded) used for matching
- `profile_skills` — join table: which skills a user has
- `resumes` — user's resume versions with parsed content JSON
- `jobs` — shared job postings catalog with parsed structured data
- `saved_searches` — user's saved filter queries with alerts
- `applications` — user's application pipeline (stage, status, match score)
- `application_notes` — notes attached to an application
- `interview_prep` — generated interview question sets per application
- `activity_log` — user activity audit trail

3. Security
- RLS enabled on every table.
- Owner-scoped CRUD on user-owned tables.
- skills and jobs are shared read-only catalog: authenticated SELECT only.
*/

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  headline text,
  location text,
  phone text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  present_role text,
  target_roles text[] DEFAULT '{}',
  years_experience int,
  industry_preferences text[] DEFAULT '{}',
  work_mode text DEFAULT 'remote',
  salary_min int,
  salary_max int,
  company_size_pref text[] DEFAULT '{}',
  visa_sponsorship boolean DEFAULT false,
  relocation boolean DEFAULT false,
  tech_stack text[] DEFAULT '{}',
  experience_level text DEFAULT 'mid',
  onboarding_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- skills catalog (shared)
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_skills" ON skills;
CREATE POLICY "read_skills" ON skills FOR SELECT
  TO authenticated USING (true);

-- profile_skills
CREATE TABLE IF NOT EXISTS profile_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency int DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  UNIQUE (profile_id, skill_id)
);
ALTER TABLE profile_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_profile_skills" ON profile_skills;
CREATE POLICY "select_own_profile_skills" ON profile_skills FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_profile_skills" ON profile_skills;
CREATE POLICY "insert_own_profile_skills" ON profile_skills FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_profile_skills" ON profile_skills;
CREATE POLICY "update_own_profile_skills" ON profile_skills FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_profile_skills" ON profile_skills;
CREATE POLICY "delete_own_profile_skills" ON profile_skills FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_id AND p.user_id = auth.uid()));

-- resumes
CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'General',
  content jsonb NOT NULL DEFAULT '{}',
  ats_score int,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
DROP POLICY IF EXISTS "select_own_resumes" ON resumes;
CREATE POLICY "select_own_resumes" ON resumes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_resumes" ON resumes;
CREATE POLICY "insert_own_resumes" ON resumes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_resumes" ON resumes;
CREATE POLICY "update_own_resumes" ON resumes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_resumes" ON resumes;
CREATE POLICY "delete_own_resumes" ON resumes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- jobs (shared catalog)
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text,
  source_job_id text,
  title text NOT NULL,
  company text NOT NULL,
  company_logo_url text,
  location text,
  work_mode text,
  salary_min int,
  salary_max int,
  salary_currency text DEFAULT 'USD',
  experience_level text,
  description text,
  requirements text[] DEFAULT '{}',
  skills_required text[] DEFAULT '{}',
  skills_preferred text[] DEFAULT '{}',
  benefits text[] DEFAULT '{}',
  company_size text,
  industry text,
  apply_url text,
  is_remote boolean,
  posted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (source, source_job_id)
);
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_work_mode ON jobs(work_mode);
DROP POLICY IF EXISTS "read_jobs" ON jobs;
CREATE POLICY "read_jobs" ON jobs FOR SELECT
  TO authenticated USING (true);

-- saved_searches
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  query jsonb NOT NULL DEFAULT '{}',
  alert_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
DROP POLICY IF EXISTS "select_own_saved_searches" ON saved_searches;
CREATE POLICY "select_own_saved_searches" ON saved_searches FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_saved_searches" ON saved_searches;
CREATE POLICY "insert_own_saved_searches" ON saved_searches FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_saved_searches" ON saved_searches;
CREATE POLICY "update_own_saved_searches" ON saved_searches FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_saved_searches" ON saved_searches;
CREATE POLICY "delete_own_saved_searches" ON saved_searches FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- applications
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  resume_id uuid REFERENCES resumes(id) ON DELETE SET NULL,
  stage text NOT NULL DEFAULT 'discovered',
  status text DEFAULT 'pending',
  match_score int,
  ats_score int,
  cover_letter text,
  application_method text DEFAULT 'manual',
  applied_at timestamptz,
  recruiter_name text,
  recruiter_email text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, job_id)
);
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_applications_user_stage ON applications(user_id, stage);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
DROP POLICY IF EXISTS "select_own_applications" ON applications;
CREATE POLICY "select_own_applications" ON applications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_applications" ON applications;
CREATE POLICY "insert_own_applications" ON applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_applications" ON applications;
CREATE POLICY "update_own_applications" ON applications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_applications" ON applications;
CREATE POLICY "delete_own_applications" ON applications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- application_notes
CREATE TABLE IF NOT EXISTS application_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE application_notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_app_notes_application_id ON application_notes(application_id);
DROP POLICY IF EXISTS "select_own_app_notes" ON application_notes;
CREATE POLICY "select_own_app_notes" ON application_notes FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM applications a WHERE a.id = application_id AND a.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_app_notes" ON application_notes;
CREATE POLICY "insert_own_app_notes" ON application_notes FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM applications a WHERE a.id = application_id AND a.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_app_notes" ON application_notes;
CREATE POLICY "delete_own_app_notes" ON application_notes FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM applications a WHERE a.id = application_id AND a.user_id = auth.uid()));

-- interview_prep
CREATE TABLE IF NOT EXISTS interview_prep (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  questions jsonb NOT NULL DEFAULT '[]',
  company_research jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE interview_prep ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_interview_prep_app_id ON interview_prep(application_id);
DROP POLICY IF EXISTS "select_own_interview_prep" ON interview_prep;
CREATE POLICY "select_own_interview_prep" ON interview_prep FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM applications a WHERE a.id = application_id AND a.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_interview_prep" ON interview_prep;
CREATE POLICY "insert_own_interview_prep" ON interview_prep FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM applications a WHERE a.id = application_id AND a.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_interview_prep" ON interview_prep;
CREATE POLICY "delete_own_interview_prep" ON interview_prep FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM applications a WHERE a.id = application_id AND a.user_id = auth.uid()));

-- activity_log
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_activity_log_user_created ON activity_log(user_id, created_at DESC);
DROP POLICY IF EXISTS "select_own_activity" ON activity_log;
CREATE POLICY "select_own_activity" ON activity_log FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_activity" ON activity_log;
CREATE POLICY "insert_own_activity" ON activity_log FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_activity" ON activity_log;
CREATE POLICY "delete_own_activity" ON activity_log FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS resumes_updated_at ON resumes;
CREATE TRIGGER resumes_updated_at BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS applications_updated_at ON applications;
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
