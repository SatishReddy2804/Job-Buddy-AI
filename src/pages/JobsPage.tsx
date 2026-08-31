import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Briefcase, MapPin, DollarSign, X, Check, Plus, FileText, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApplications } from '@/hooks/useApplications';
import { fetchJobs, fetchProfileSkills, fetchResumes, createApplication, logActivity } from '@/lib/api';
import { PageHeader, EmptyState, Spinner, ScoreRing } from '@/components/ui';
import { computeMatchScore, formatConvertedSalary, timeAgo, classNames, WORK_MODE_LABELS } from '@/lib/utils';
import { useCurrencyRates } from '@/hooks/useCurrencyRates';
import type { Job, ProfileSkill, Resume, WorkMode } from '@/types';

export default function JobsPage() {
  const { profile } = useAuth();
  const { applications, setApplications } = useApplications();
  const rates = useCurrencyRates();
  const displayCurrency = profile?.preferred_currency ?? 'USD';
  const [jobs, setJobs] = useState<Job[]>([]);
  const [skills, setSkills] = useState<ProfileSkill[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [matchSource, setMatchSource] = useState<'profile' | 'resume'>('resume');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [workMode, setWorkMode] = useState<string>('all');
  const [experienceLevel, setExperienceLevel] = useState<string>('all');
  const [minScore, setMinScore] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobs({});
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
    if (profile) fetchProfileSkills(profile.id).then(setSkills).catch(() => {});
    fetchResumes().then((data) => {
      setResumes(data);
      const primary = data.find((r) => r.is_primary);
      if (!primary) setMatchSource('profile');
    }).catch(() => setMatchSource('profile'));
  }, [loadJobs, profile]);

  const primaryResume = useMemo(() => resumes.find((r) => r.is_primary) ?? resumes[0], [resumes]);
  const userSkillNames = useMemo(() => {
    if (matchSource === 'resume' && primaryResume) {
      return primaryResume.content.skills ?? [];
    }
    return skills.map((s) => s.name);
  }, [skills, matchSource, primaryResume]);

  const jobsWithScore = useMemo(() => {
    return jobs.map((job) => {
      const { score, missing } = computeMatchScore(job.skills_required, job.skills_preferred, userSkillNames);
      return { job, score, missing };
    });
  }, [jobs, userSkillNames]);

  const filtered = useMemo(() => {
    return jobsWithScore
      .filter(({ job }) => {
        if (search) {
          const q = search.toLowerCase();
          if (!job.title.toLowerCase().includes(q) && !job.company.toLowerCase().includes(q)) return false;
        }
        if (workMode !== 'all' && job.work_mode !== workMode) return false;
        if (experienceLevel !== 'all' && job.experience_level !== experienceLevel) return false;
        return true;
      })
      .filter(({ score }) => score >= minScore)
      .sort((a, b) => b.score - a.score);
  }, [jobsWithScore, search, workMode, experienceLevel, minScore]);

  const handleAddJob = async (job: Job, score: number) => {
    const existing = applications.find((a) => a.job_id === job.id);
    if (existing) return;
    try {
      const newApp = await createApplication(job.id, score >= 50 ? 'matched' : 'discovered', score);
      setApplications((prev) => [newApp, ...prev]);
      await logActivity('job_added', 'job', job.id, { match_score: score });
    } catch {
      // ignore
    }
  };

  const clearFilters = () => {
    setSearch('');
    setWorkMode('all');
    setExperienceLevel('all');
    setMinScore(0);
  };

  const hasFilters = search || workMode !== 'all' || experienceLevel !== 'all' || minScore > 0;

  return (
    <div>
      <PageHeader
        title="Find jobs"
        subtitle={`${filtered.length} opportunity${filtered.length !== 1 ? 'ies' : ''} matched to your ${matchSource === 'resume' && primaryResume ? 'resume' : 'profile'}`}
      />

      {/* Match source toggle */}
      {primaryResume && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-medium text-secondary-500 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Match by:</span>
          <button
            onClick={() => setMatchSource('resume')}
            className={classNames('rounded-lg px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5', matchSource === 'resume' ? 'bg-primary-600 text-white' : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200')}
          >
            <FileText className="h-3.5 w-3.5" /> {primaryResume.label}
          </button>
          <button
            onClick={() => setMatchSource('profile')}
            className={classNames('rounded-lg px-3 py-1.5 text-xs font-medium transition-all', matchSource === 'profile' ? 'bg-primary-600 text-white' : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200')}
          >
            Profile skills
          </button>
        </div>
      )}

      {/* Search + filter toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search by job title or company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-11"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={classNames('btn-secondary', showFilters && 'border-primary-300 text-primary-700')}
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
          {hasFilters && <span className="ml-1 h-2 w-2 rounded-full bg-primary-500" />}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-5 mb-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Work mode</label>
              <select className="input" value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
                <option value="all">All modes</option>
                {(Object.keys(WORK_MODE_LABELS) as WorkMode[]).map((m) => (
                  <option key={m} value={m}>{WORK_MODE_LABELS[m]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Experience level</label>
              <select className="input" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                <option value="all">All levels</option>
                <option value="entry">Entry level</option>
                <option value="mid">Mid level</option>
                <option value="senior">Senior level</option>
                <option value="lead">Lead</option>
                <option value="principal">Principal</option>
              </select>
            </div>
            <div>
              <label className="label">Minimum match score: {minScore}%</label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value, 10))}
                className="w-full mt-3 accent-primary-600"
              />
            </div>
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-4 inline-flex items-center gap-1.5 text-sm text-secondary-500 hover:text-secondary-900">
              <X className="h-3.5 w-3.5" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner className="h-7 w-7 text-primary-600" /></div>
      ) : error ? (
        <div className="card">
          <EmptyState icon={Briefcase} title="Could not load jobs" description={error} action={<button onClick={loadJobs} className="btn-secondary">Try again</button>} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Search}
            title="No jobs match your filters"
            description={hasFilters ? 'Try adjusting or clearing your filters.' : 'Check back soon — new jobs are added daily.'}
            action={hasFilters ? <button onClick={clearFilters} className="btn-secondary">Clear filters</button> : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(({ job, score, missing }) => {
            const added = applications.some((a) => a.job_id === job.id);
            return (
              <div key={job.id} className="card p-5 hover:shadow-cardhover transition-all flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-secondary-700 to-secondary-900 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {job.company.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/app/jobs/${job.id}`} className="block">
                      <h3 className="font-semibold text-secondary-900 hover:text-primary-700 transition-colors truncate">{job.title}</h3>
                      <p className="text-sm text-secondary-500 truncate">{job.company}</p>
                    </Link>
                  </div>
                  <ScoreRing score={score} size={44} />
                </div>

                <div className="flex items-center gap-3 text-xs text-secondary-500 mb-3 flex-wrap">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location || 'Remote'}</span>
                  {job.work_mode && <span className="badge bg-secondary-100 text-secondary-600">{WORK_MODE_LABELS[job.work_mode]}</span>}
                  {(job.salary_min || job.salary_max) && (
                    <span className="inline-flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> {formatConvertedSalary(job.salary_min, job.salary_max, job.salary_currency, displayCurrency, rates)}{job.salary_currency !== displayCurrency && rates[job.salary_currency] ? ` (${job.salary_currency})` : ''}</span>
                  )}
                  <span className="ml-auto">{timeAgo(job.posted_at)}</span>
                </div>

                <p className="text-sm text-secondary-600 line-clamp-2 mb-3 flex-1">{job.description}</p>

                {/* Skills */}
                {job.skills_required.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {job.skills_required.slice(0, 4).map((skill) => {
                      const has = userSkillNames.some((s) => s.toLowerCase() === skill.toLowerCase());
                      return (
                        <span key={skill} className={classNames(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
                          has ? 'bg-emerald-50 text-emerald-700' : 'bg-secondary-100 text-secondary-600'
                        )}>
                          {has && <Check className="h-3 w-3" />}
                          {skill}
                        </span>
                      );
                    })}
                    {job.skills_required.length > 4 && (
                      <span className="px-2 py-0.5 text-xs text-secondary-400">+{job.skills_required.length - 4} more</span>
                    )}
                  </div>
                )}

                {/* Missing skills gap */}
                {missing.length > 0 && score < 80 && (
                  <p className="text-xs text-amber-600 mb-3">
                    Missing: {missing.slice(0, 3).join(', ')}{missing.length > 3 ? '…' : ''}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-auto pt-1">
                  <Link to={`/app/jobs/${job.id}`} className="btn-secondary flex-1 justify-center">View details</Link>
                  {added ? (
                    <button disabled className="btn bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default">
                      <Check className="h-4 w-4" /> Added
                    </button>
                  ) : (
                    <button onClick={() => handleAddJob(job, score)} className="btn-primary">
                      <Plus className="h-4 w-4" /> Track
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
