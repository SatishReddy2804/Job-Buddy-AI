import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  KanbanSquare,
  Briefcase,
  TrendingUp,
  Calendar,
  ArrowRight,
  Inbox,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApplications } from '@/hooks/useApplications';
import { fetchProfileSkills, fetchJobs, createApplication, updateApplicationStage, logActivity } from '@/lib/api';
import { PageHeader, EmptyState, ScoreRing, Spinner } from '@/components/ui';
import {
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_COLORS,
  formatConvertedSalary,
  timeAgo,
  computeMatchScore,
  classNames,
} from '@/lib/utils';
import { useCurrencyRates } from '@/hooks/useCurrencyRates';
import type { Application, ApplicationStage, Job, ProfileSkill } from '@/types';

export default function DashboardPage() {
  const { profile } = useAuth();
  const { applications, loading, error, setApplications, reload } = useApplications();
  const rates = useCurrencyRates();
  const displayCurrency = profile?.preferred_currency ?? 'USD';
  const [skills, setSkills] = useState<ProfileSkill[]>([]);
  const [topJobs, setTopJobs] = useState<Job[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    fetchProfileSkills(profile.id).then(setSkills).catch(() => {});
    fetchJobs({ limit: 6 }).then(setTopJobs).catch(() => {});
  }, [profile]);

  const userSkillNames = useMemo(() => skills.map((s) => s.name), [skills]);

  const stats = useMemo(() => {
    const byStage = (stage: ApplicationStage) => applications.filter((a) => a.stage === stage).length;
    return {
      total: applications.length,
      matched: byStage('matched'),
      applied: byStage('applied'),
      interviews: byStage('interview'),
      offers: byStage('offer'),
    };
  }, [applications]);

  const grouped = useMemo(() => {
    const map: Record<ApplicationStage, Application[]> = {
      discovered: [], matched: [], applied: [], viewed: [], interview: [], offer: [], rejected: [],
    };
    applications.forEach((app) => map[app.stage].push(app));
    return map;
  }, [applications]);

  const recentActivity = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);
  }, [applications]);

  const handleAddJob = async (job: Job) => {
    const existing = applications.find((a) => a.job_id === job.id);
    if (existing) return;
    const { score } = computeMatchScore(job.skills_required, job.skills_preferred, userSkillNames);
    try {
      const newApp = await createApplication(job.id, score >= 50 ? 'matched' : 'discovered', score);
      setApplications((prev) => [newApp, ...prev]);
      await logActivity('job_added', 'job', job.id, { match_score: score });
    } catch {
      // ignore
    }
  };

  const handleDrop = async (stage: ApplicationStage) => {
    if (!draggedId) return;
    const app = applications.find((a) => a.id === draggedId);
    if (!app || app.stage === stage) {
      setDraggedId(null);
      return;
    }
    setApplications((prev) => prev.map((a) => (a.id === draggedId ? { ...a, stage } : a)));
    setDraggedId(null);
    try {
      await updateApplicationStage(draggedId, stage);
      await logActivity('stage_changed', 'application', draggedId, { from: app.stage, to: stage });
    } catch {
      reload();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-7 w-7 text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={Inbox}
        title="Could not load your dashboard"
        description={error}
        action={<button onClick={reload} className="btn-secondary">Try again</button>}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${profile?.full_name?.split(' ')[0] ?? 'there'}`}
        subtitle="Here's your job search at a glance."
        actions={
          <Link to="/app/jobs" className="btn-primary">
            <Briefcase className="h-4 w-4" /> Find jobs
          </Link>
        }
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total applications', value: stats.total, icon: KanbanSquare, color: 'text-secondary-600', bg: 'bg-secondary-100' },
          { label: 'Matched', value: stats.matched, icon: TrendingUp, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Applied', value: stats.applied, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Interviews', value: stats.interviews, icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Offers', value: stats.offers, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className={`h-9 w-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-secondary-900">{stat.value}</p>
            <p className="text-xs text-secondary-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Kanban */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Application pipeline</h2>
        {applications.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={KanbanSquare}
              title="Your pipeline is empty"
              description="Browse the job feed to start tracking applications. Jobs you add will appear here."
              action={<Link to="/app/jobs" className="btn-primary"><Briefcase className="h-4 w-4" /> Browse jobs</Link>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto kanban-scroll -mx-1 px-1">
            <div className="flex gap-4 min-w-max pb-2">
              {STAGE_ORDER.map((stage) => (
                <div
                  key={stage}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(stage)}
                  className="w-72 shrink-0"
                >
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <div className="flex items-center gap-2">
                      <span className={classNames('inline-block h-2 w-2 rounded-full', STAGE_COLORS[stage].split(' ')[0].replace('bg-', 'bg-').replace('50', '400'))} />
                      <h3 className="text-sm font-semibold text-secondary-700">{STAGE_LABELS[stage]}</h3>
                    </div>
                    <span className="badge bg-secondary-100 text-secondary-600">{grouped[stage].length}</span>
                  </div>
                  <div className={classNames(
                    'space-y-2.5 min-h-[100px] rounded-2xl p-2 transition-colors',
                    draggedId ? 'bg-secondary-100/60' : ''
                  )}>
                    {grouped[stage].map((app) => (
                      <KanbanCard key={app.id} app={app} onDragStart={() => setDraggedId(app.id)} displayCurrency={displayCurrency} rates={rates} />
                    ))}
                    {grouped[stage].length === 0 && (
                      <div className="text-center py-6 text-xs text-secondary-400 border-2 border-dashed border-secondary-200 rounded-xl">
                        Drop here
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom: job recommendations + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended jobs */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-secondary-900">Top job matches</h2>
            <Link to="/app/jobs" className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {topJobs.slice(0, 4).map((job) => {
              const { score } = computeMatchScore(job.skills_required, job.skills_preferred, userSkillNames);
              const alreadyAdded = applications.some((a) => a.job_id === job.id);
              return (
                <div key={job.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary-50 transition-colors group">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-secondary-700 to-secondary-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {job.company.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/app/jobs/${job.id}`} className="block">
                      <p className="text-sm font-semibold text-secondary-900 truncate group-hover:text-primary-700">{job.title}</p>
                      <p className="text-xs text-secondary-500 truncate">{job.company} · {job.location}</p>
                    </Link>
                  </div>
                  <ScoreRing score={score} size={36} />
                  {!alreadyAdded && (
                    <button
                      onClick={() => handleAddJob(job)}
                      className="rounded-lg p-1.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      title="Add to pipeline"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
            {topJobs.length === 0 && (
              <p className="text-sm text-secondary-400 text-center py-6">No jobs available yet.</p>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-secondary-900 mb-4">Recent activity</h2>
          {recentActivity.length === 0 ? (
            <EmptyState icon={Activity} title="No activity yet" description="Once you start tracking applications, activity will show here." />
          ) : (
            <div className="space-y-3">
              {recentActivity.map((app) => (
                <div key={app.id} className="flex items-center gap-3">
                  <div className={classNames('h-2 w-2 rounded-full shrink-0', STAGE_COLORS[app.stage].split(' ')[0].replace('50', '500').replace('100', '400').replace('200', '500'))} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-secondary-900 truncate">
                      {app.job?.title} <span className="text-secondary-400">at {app.job?.company}</span>
                    </p>
                    <p className="text-xs text-secondary-500">Moved to {STAGE_LABELS[app.stage]} · {timeAgo(app.updated_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KanbanCard({ app, onDragStart, displayCurrency, rates }: { app: Application; onDragStart: () => void; displayCurrency: string; rates: Record<string, number> }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="card p-3.5 cursor-grab active:cursor-grabbing hover:shadow-cardhover transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link to={`/app/jobs/${app.job_id}`} className="min-w-0">
          <p className="text-sm font-semibold text-secondary-900 truncate hover:text-primary-700">{app.job?.title}</p>
          <p className="text-xs text-secondary-500 truncate">{app.job?.company}</p>
        </Link>
        {app.match_score !== null && <ScoreRing score={app.match_score} size={32} />}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {app.job?.work_mode && (
          <span className="badge bg-secondary-100 text-secondary-600">{app.job.work_mode}</span>
        )}
        {app.job?.salary_min && (
          <span className="text-xs text-secondary-500">{formatConvertedSalary(app.job.salary_min, app.job.salary_max, app.job.salary_currency, displayCurrency, rates)}</span>
        )}
      </div>
    </div>
  );
}
