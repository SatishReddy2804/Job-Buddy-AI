import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, Briefcase, MapPin, Code2, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { updateProfile, logActivity } from '@/lib/api';
import { Spinner } from '@/components/ui';
import { Logo as LogoBrand } from '@/components/Logo';
import type { ExperienceLevel, WorkMode } from '@/types';
import {
  CURRENCY_OPTIONS,
  EXPERIENCE_LABELS,
  normalizeUrl,
  validateProfileForm,
  WORK_MODE_LABELS,
} from '@/lib/utils';

const STEPS = ['Basic info', 'Career profile', 'Skills & stack', 'Preferences'];

const POPULAR_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'Go', 'Rust',
  'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'GraphQL', 'Tailwind CSS',
  'Machine Learning', 'PyTorch', 'TensorFlow', 'System Design', 'Redis', 'Kafka',
];

export default function OnboardingPage() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    headline: profile?.headline ?? '',
    location: profile?.location ?? '',
    phone: profile?.phone ?? '',
    linkedin_url: profile?.linkedin_url ?? '',
    github_url: profile?.github_url ?? '',
    portfolio_url: profile?.portfolio_url ?? '',
    present_role: profile?.present_role ?? '',
    target_roles: (profile?.target_roles ?? []).join(', '),
    years_experience: profile?.years_experience?.toString() ?? '',
    experience_level: (profile?.experience_level ?? 'mid') as ExperienceLevel,
    industry_preferences: (profile?.industry_preferences ?? []).join(', '),
    tech_stack: profile?.tech_stack ?? [],
    skills: [] as string[],
    work_mode: (profile?.work_mode ?? 'remote') as WorkMode,
    salary_min: profile?.salary_min?.toString() ?? '',
    salary_max: profile?.salary_max?.toString() ?? '',
    visa_sponsorship: profile?.visa_sponsorship ?? false,
    relocation: profile?.relocation ?? false,
    preferred_currency: profile?.preferred_currency ?? 'USD',
  });

  const validationErrors = validateProfileForm(form);

  const toggleSkill = (skill: string) => {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter((s) => s !== skill)
        : [...f.skills, skill],
    }));
  };

  const canProceed = () => {
    if (step === 0) return !validationErrors.full_name && !validationErrors.location && !validationErrors.phone && !validationErrors.linkedin_url && !validationErrors.github_url && !validationErrors.portfolio_url;
    if (step === 1) return !validationErrors.target_roles && !validationErrors.years_experience;
    if (step === 2) return form.skills.length > 0;
    return !validationErrors.salary_min && !validationErrors.salary_max;
  };

  const handleComplete = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      const targetRoles = form.target_roles.split(',').map((r) => r.trim()).filter(Boolean);
      const industries = form.industry_preferences.split(',').map((r) => r.trim()).filter(Boolean);
      await updateProfile(profile.id, {
        full_name: form.full_name,
        headline: form.headline,
        location: form.location,
        phone: form.phone,
        linkedin_url: normalizeUrl(form.linkedin_url),
        github_url: normalizeUrl(form.github_url),
        portfolio_url: normalizeUrl(form.portfolio_url),
        present_role: form.present_role,
        target_roles: targetRoles,
        years_experience: form.years_experience ? parseInt(form.years_experience, 10) : null,
        experience_level: form.experience_level,
        industry_preferences: industries,
        tech_stack: form.tech_stack,
        work_mode: form.work_mode,
        salary_min: form.salary_min ? parseInt(form.salary_min, 10) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max, 10) : null,
        visa_sponsorship: form.visa_sponsorship,
        relocation: form.relocation,
        preferred_currency: form.preferred_currency,
        onboarding_complete: true,
      });

      // Upsert skills into skills catalog and profile_skills
      if (form.skills.length > 0) {
        const skillRows = form.skills.map((name) => ({ name }));
        const { data: insertedSkills, error: skillErr } = await supabase
          .from('skills')
          .upsert(skillRows, { onConflict: 'name', ignoreDuplicates: true })
          .select('id, name');
        if (skillErr) throw skillErr;
        const skillIds = (insertedSkills ?? []).map((s) => s.id);
        // Fetch any missing (upsert with ignoreDuplicates may not return existing rows)
        if (skillIds.length < form.skills.length) {
          const { data: existing } = await supabase
            .from('skills')
            .select('id, name')
            .in('name', form.skills);
          const allIds = (existing ?? []).map((s) => s.id);
          const profileSkillRows = allIds.map((skill_id) => ({
            profile_id: profile.id,
            skill_id,
            proficiency: 3,
          }));
          await supabase
            .from('profile_skills')
            .upsert(profileSkillRows, { onConflict: 'profile_id,skill_id', ignoreDuplicates: true });
        } else {
          const profileSkillRows = skillIds.map((skill_id) => ({
            profile_id: profile.id,
            skill_id,
            proficiency: 3,
          }));
          await supabase
            .from('profile_skills')
            .upsert(profileSkillRows, { onConflict: 'profile_id,skill_id', ignoreDuplicates: true });
        }
      }

      await logActivity('onboarding_complete', 'profile', profile.id);
      await refreshProfile();
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (!canProceed()) {
      setError(step === 2 ? 'Select at least one skill.' : Object.values(validationErrors)[0] ?? 'Complete the required fields.');
      return;
    }
    setError(null);
    if (step < STEPS.length - 1) setStep(step + 1);
    else void handleComplete();
  };
  const back = () => setStep(Math.max(0, step - 1));

  return (
    <div className="min-h-screen bg-secondary-50 flex flex-col">
      <header className="border-b border-secondary-100 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <LogoBrand />
          <span className="text-sm text-secondary-400">Step {step + 1} of {STEPS.length}</span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 py-10">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  i < step ? 'bg-primary-600 text-white' : i === step ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-secondary-200 text-secondary-500'
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-secondary-900' : 'text-secondary-400'}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${i < step ? 'bg-primary-500' : 'bg-secondary-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card p-6 sm:p-8 animate-fade-in">
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-secondary-900">Basic info</h2>
                  <p className="text-sm text-secondary-500">Let's start with the essentials.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Full name *</label>
                  <input required minLength={2} className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Jane Doe" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Professional headline</label>
                  <input className="input" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Senior Software Engineer" />
                </div>
                <div>
                  <label className="label">Location *</label>
                  <input required minLength={2} className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="San Francisco, CA" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input type="tel" inputMode="tel" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 000 0000" />
                </div>
                <div>
                  <label className="label">LinkedIn URL</label>
                  <input type="url" className="input" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="linkedin.com/in/janedoe" />
                </div>
                <div>
                  <label className="label">GitHub URL</label>
                  <input type="url" className="input" value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} placeholder="github.com/janedoe" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Portfolio URL</label>
                  <input type="url" className="input" value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} placeholder="janedoe.dev" />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-secondary-900">Career profile</h2>
                  <p className="text-sm text-secondary-500">Tell us what you do and what you want.</p>
                </div>
              </div>
              <div>
                <label className="label">Current role</label>
                <input className="input" value={form.present_role} onChange={(e) => setForm({ ...form, present_role: e.target.value })} placeholder="Software Engineer at Acme Inc." />
              </div>
              <div>
                <label className="label">Target roles * <span className="text-secondary-400 font-normal">(comma-separated)</span></label>
                <input className="input" value={form.target_roles} onChange={(e) => setForm({ ...form, target_roles: e.target.value })} placeholder="Senior Software Engineer, Full-Stack Engineer" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Years of experience</label>
                  <input type="number" min="0" max="50" step="1" className="input" value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: e.target.value })} placeholder="5" />
                </div>
                <div>
                  <label className="label">Experience level</label>
                  <select className="input" value={form.experience_level} onChange={(e) => setForm({ ...form, experience_level: e.target.value as ExperienceLevel })}>
                    {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((lvl) => (
                      <option key={lvl} value={lvl}>{EXPERIENCE_LABELS[lvl]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Industry preferences <span className="text-secondary-400 font-normal">(comma-separated)</span></label>
                <input className="input" value={form.industry_preferences} onChange={(e) => setForm({ ...form, industry_preferences: e.target.value })} placeholder="Fintech, SaaS, AI/ML" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Code2 className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-secondary-900">Skills & tech stack</h2>
                  <p className="text-sm text-secondary-500">Select your skills — we'll use them to match you to jobs.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SKILLS.map((skill) => {
                  const selected = form.skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                        selected
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                      }`}
                    >
                      {selected && <Check className="inline h-3.5 w-3.5 mr-1" />}
                      {skill}
                    </button>
                  );
                })}
              </div>
              {form.skills.length > 0 && (
                <p className="text-sm text-secondary-500">{form.skills.length} skill{form.skills.length !== 1 ? 's' : ''} selected</p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-secondary-900">Preferences</h2>
                  <p className="text-sm text-secondary-500">Narrow down your ideal job.</p>
                </div>
              </div>
              <div>
                <label className="label">Work mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(WORK_MODE_LABELS) as WorkMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setForm({ ...form, work_mode: mode })}
                      className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        form.work_mode === mode ? 'bg-primary-600 text-white' : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                      }`}
                    >
                      {WORK_MODE_LABELS[mode]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Display currency</label>
                  <select className="input" value={form.preferred_currency} onChange={(e) => setForm({ ...form, preferred_currency: e.target.value })}>
                    {CURRENCY_OPTIONS.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} · {currency.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Salary min (USD)</label>
                  <input type="number" min="0" step="1" className="input" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} placeholder="80000" />
                </div>
                <div>
                  <label className="label">Salary max (USD)</label>
                  <input type="number" min="0" step="1" className="input" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} placeholder="160000" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.visa_sponsorship} onChange={(e) => setForm({ ...form, visa_sponsorship: e.target.checked })} className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm text-secondary-700">Require visa sponsorship</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.relocation} onChange={(e) => setForm({ ...form, relocation: e.target.checked })} className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm text-secondary-700">Open to relocation</span>
                </label>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
              {error}
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <div className="mt-6 flex items-center justify-between">
          <button onClick={back} disabled={step === 0} className="btn-ghost disabled:invisible">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button onClick={next} disabled={!canProceed() || saving} className="btn-primary">
            {saving ? <Spinner className="h-4 w-4" /> : (
              <>
                {step === STEPS.length - 1 ? 'Finish setup' : 'Continue'}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
