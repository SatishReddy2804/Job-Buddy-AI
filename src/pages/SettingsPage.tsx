import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Trash2,
  Save,
  Loader2,
  Check,
  MapPin,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { updateProfile, fetchProfileSkills } from '@/lib/api';
import { PageHeader, Spinner } from '@/components/ui';
import {
  classNames,
  CURRENCY_OPTIONS,
  EXPERIENCE_LABELS,
  normalizeUrl,
  validateProfileForm,
  WORK_MODE_LABELS,
} from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { ExperienceLevel, ProfileSkill, WorkMode } from '@/types';

export default function SettingsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState<ProfileSkill[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    headline: '',
    location: '',
    phone: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    present_role: '',
    target_roles: '',
    years_experience: '',
    experience_level: 'mid' as ExperienceLevel,
    work_mode: 'remote' as WorkMode,
    salary_min: '',
    salary_max: '',
    visa_sponsorship: false,
    relocation: false,
    preferred_currency: 'USD',
  });

  const validationErrors = validateProfileForm(form);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        headline: profile.headline ?? '',
        location: profile.location ?? '',
        phone: profile.phone ?? '',
        linkedin_url: profile.linkedin_url ?? '',
        github_url: profile.github_url ?? '',
        portfolio_url: profile.portfolio_url ?? '',
        present_role: profile.present_role ?? '',
        target_roles: profile.target_roles.join(', '),
        years_experience: profile.years_experience?.toString() ?? '',
        experience_level: profile.experience_level ?? 'mid',
        work_mode: profile.work_mode ?? 'remote',
        salary_min: profile.salary_min?.toString() ?? '',
        salary_max: profile.salary_max?.toString() ?? '',
        visa_sponsorship: profile.visa_sponsorship,
        relocation: profile.relocation,
        preferred_currency: profile.preferred_currency ?? 'USD',
      });
    }
    if (profile) fetchProfileSkills(profile.id).then(setSkills).catch(() => {});
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    const errors = validateProfileForm(form);
    const firstError = Object.values(errors)[0];
    if (firstError) {
      setError(firstError);
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateProfile(profile.id, {
        full_name: form.full_name,
        headline: form.headline,
        location: form.location,
        phone: form.phone,
        linkedin_url: normalizeUrl(form.linkedin_url),
        github_url: normalizeUrl(form.github_url),
        portfolio_url: normalizeUrl(form.portfolio_url),
        present_role: form.present_role,
        target_roles: form.target_roles.split(',').map((r) => r.trim()).filter(Boolean),
        years_experience: form.years_experience ? parseInt(form.years_experience, 10) : null,
        experience_level: form.experience_level,
        work_mode: form.work_mode,
        salary_min: form.salary_min ? parseInt(form.salary_min, 10) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max, 10) : null,
        visa_sponsorship: form.visa_sponsorship,
        relocation: form.relocation,
        preferred_currency: form.preferred_currency,
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await supabase.from('profiles').delete().eq('user_id', user.id);
      await supabase.auth.signOut();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    }
  };

  if (!profile) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-7 w-7 text-primary-600" /></div>;
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" subtitle="Manage your profile, preferences, and account" />

      {error && (
        <div className="mb-4 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}

      {/* Profile section */}
      <section className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <User className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-secondary-900">Profile</h2>
            <p className="text-sm text-secondary-500">Your personal and contact information</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Full name</label>
            <input className={classNames('input', validationErrors.full_name && 'border-error-400')} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            {validationErrors.full_name && <p className="mt-1 text-xs text-error-600">{validationErrors.full_name}</p>}
          </div>
          <div>
            <label className="label">Headline</label>
            <input className="input" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className={classNames('input', validationErrors.location && 'border-error-400')} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            {validationErrors.location && <p className="mt-1 text-xs text-error-600">{validationErrors.location}</p>}
          </div>
          <div>
            <label className="label">Phone</label>
            <input className={classNames('input', validationErrors.phone && 'border-error-400')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            {validationErrors.phone && <p className="mt-1 text-xs text-error-600">{validationErrors.phone}</p>}
          </div>
          <div>
            <label className="label">LinkedIn URL</label>
            <input className={classNames('input', validationErrors.linkedin_url && 'border-error-400')} value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
            {validationErrors.linkedin_url && <p className="mt-1 text-xs text-error-600">{validationErrors.linkedin_url}</p>}
          </div>
          <div>
            <label className="label">GitHub URL</label>
            <input className={classNames('input', validationErrors.github_url && 'border-error-400')} value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} />
            {validationErrors.github_url && <p className="mt-1 text-xs text-error-600">{validationErrors.github_url}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Portfolio URL</label>
            <input className={classNames('input', validationErrors.portfolio_url && 'border-error-400')} value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} />
            {validationErrors.portfolio_url && <p className="mt-1 text-xs text-error-600">{validationErrors.portfolio_url}</p>}
          </div>
        </div>
      </section>

      {/* Career section */}
      <section className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-secondary-900">Career</h2>
            <p className="text-sm text-secondary-500">Target roles and experience</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Current role</label>
            <input className="input" value={form.present_role} onChange={(e) => setForm({ ...form, present_role: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Target roles <span className="text-secondary-400 font-normal">(comma-separated)</span></label>
            <input className={classNames('input', validationErrors.target_roles && 'border-error-400')} value={form.target_roles} onChange={(e) => setForm({ ...form, target_roles: e.target.value })} />
            {validationErrors.target_roles && <p className="mt-1 text-xs text-error-600">{validationErrors.target_roles}</p>}
          </div>
          <div>
            <label className="label">Years of experience</label>
            <input type="number" min="0" max="50" step="1" className={classNames('input', validationErrors.years_experience && 'border-error-400')} value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: e.target.value })} />
            {validationErrors.years_experience && <p className="mt-1 text-xs text-error-600">{validationErrors.years_experience}</p>}
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

        {/* Skills display */}
        {skills.length > 0 && (
          <div className="mt-4">
            <label className="label">Your skills</label>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span key={skill.id} className="badge bg-primary-50 text-primary-700">{skill.name}</span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Preferences section */}
      <section className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-secondary-900">Job preferences</h2>
            <p className="text-sm text-secondary-500">What you are looking for</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Work mode</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(WORK_MODE_LABELS) as WorkMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setForm({ ...form, work_mode: mode })}
                  className={classNames('rounded-xl px-3 py-2.5 text-sm font-medium transition-all', form.work_mode === mode ? 'bg-primary-600 text-white' : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200')}
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
              <input type="number" min="0" step="1" className={classNames('input', validationErrors.salary_min && 'border-error-400')} value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} />
              {validationErrors.salary_min && <p className="mt-1 text-xs text-error-600">{validationErrors.salary_min}</p>}
            </div>
            <div>
              <label className="label">Salary max (USD)</label>
              <input type="number" min="0" step="1" className={classNames('input', validationErrors.salary_max && 'border-error-400')} value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} />
              {validationErrors.salary_max && <p className="mt-1 text-xs text-error-600">{validationErrors.salary_max}</p>}
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
      </section>

      {/* Account section */}
      <section className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-secondary-100 flex items-center justify-center">
            <Shield className="h-5 w-5 text-secondary-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-secondary-900">Account</h2>
            <p className="text-sm text-secondary-500">Email and account security</p>
          </div>
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-secondary-700">Email address</p>
            <p className="text-sm text-secondary-500">{user?.email}</p>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="card p-6 border-error-200 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-error-50 flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-error-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-error-900">Danger zone</h2>
            <p className="text-sm text-error-600">Irreversible actions</p>
          </div>
        </div>
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)} className="btn-danger">
            <Trash2 className="h-4 w-4" /> Delete account
          </button>
        ) : (
          <div className="rounded-xl border border-error-200 bg-error-50 p-4">
            <p className="text-sm text-error-800 mb-3">
              This will permanently delete your account, profile, applications, and all associated data. This action cannot be undone.
            </p>
            <div className="flex items-center gap-2">
              <button onClick={handleDeleteAccount} className="btn-danger">Yes, delete everything</button>
              <button onClick={() => setDeleteConfirm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}
      </section>

      {/* Save bar */}
      <div className="sticky bottom-4 flex items-center justify-end gap-2">
        <div className="card px-4 py-2.5 flex items-center gap-3 shadow-cardhover">
          {saved && <span className="text-sm font-medium text-emerald-600 flex items-center gap-1"><Check className="h-4 w-4" /> Saved</span>}
          <button onClick={handleSave} disabled={saving || Object.keys(validationErrors).length > 0} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
