import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  KanbanSquare,
  List,
  Search,
  Trash2,
  ArrowRight,
  X,
  MapPin,
  DollarSign,
  Calendar,
  Inbox,
  ExternalLink,
} from 'lucide-react';
import { useApplications } from '@/hooks/useApplications';
import { updateApplicationStage, deleteApplication, logActivity } from '@/lib/api';
import { PageHeader, EmptyState, Spinner, ScoreRing } from '@/components/ui';
import {
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_COLORS,
  formatSalary,
  timeAgo,
  classNames,
} from '@/lib/utils';
import type { Application, ApplicationStage } from '@/types';

type View = 'list' | 'board';

export default function ApplicationsPage() {
  const { applications, loading, error, setApplications, reload } = useApplications();
  const [view, setView] = useState<View>('list');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Application | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      if (stageFilter !== 'all' && app.stage !== stageFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!app.job?.title.toLowerCase().includes(q) && !app.job?.company.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [applications, search, stageFilter]);

  const grouped = useMemo(() => {
    const map: Record<ApplicationStage, Application[]> = {
      discovered: [], matched: [], applied: [], viewed: [], interview: [], offer: [], rejected: [],
    };
    filtered.forEach((app) => map[app.stage].push(app));
    return map;
  }, [filtered]);

  const handleStageChange = async (appId: string, stage: ApplicationStage) => {
    const app = applications.find((a) => a.id === appId);
    if (!app || app.stage === stage) return;
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, stage } : a)));
    setSelected((prev) => (prev?.id === appId ? { ...prev, stage } : prev));
    try {
      await updateApplicationStage(appId, stage);
      await logActivity('stage_changed', 'application', appId, { from: app.stage, to: stage });
    } catch {
      reload();
    }
  };

  const handleDelete = async (appId: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== appId));
    setSelected(null);
    try {
      await deleteApplication(appId);
    } catch {
      reload();
    }
  };

  const handleDrop = (stage: ApplicationStage) => {
    if (draggedId) handleStageChange(draggedId, stage);
    setDraggedId(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-7 w-7 text-primary-600" /></div>;
  }

  if (error) {
    return (
      <EmptyState
        icon={Inbox}
        title="Could not load applications"
        description={error}
        action={<button onClick={reload} className="btn-secondary">Try again</button>}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Applications"
        subtitle={`${applications.length} total in your pipeline`}
        actions={
          <div className="inline-flex rounded-xl border border-secondary-200 bg-white p-1">
            <button
              onClick={() => setView('list')}
              className={classNames('rounded-lg px-3 py-1.5 text-sm font-medium transition-colors', view === 'list' ? 'bg-primary-50 text-primary-700' : 'text-secondary-500 hover:text-secondary-900')}
            >
              <List className="h-4 w-4 inline mr-1" /> List
            </button>
            <button
              onClick={() => setView('board')}
              className={classNames('rounded-lg px-3 py-1.5 text-sm font-medium transition-colors', view === 'board' ? 'bg-primary-50 text-primary-700' : 'text-secondary-500 hover:text-secondary-900')}
            >
              <KanbanSquare className="h-4 w-4 inline mr-1" /> Board
            </button>
          </div>
        }
      />

      {applications.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={KanbanSquare}
            title="No applications yet"
            description="Browse the job feed and add jobs to your pipeline to start tracking them here."
            action={<Link to="/app/jobs" className="btn-primary">Find jobs</Link>}
          />
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Search by title or company…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-11"
              />
            </div>
            <select className="input sm:w-48" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
              <option value="all">All stages</option>
              {STAGE_ORDER.map((s) => (
                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {/* List view */}
          {view === 'list' && (
            <div className="space-y-2.5">
              {filtered.length === 0 ? (
                <EmptyState icon={Search} title="No matches" description="Try adjusting your search or stage filter." />
              ) : (
                filtered.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => setSelected(app)}
                    className="card w-full p-4 flex items-center gap-4 text-left hover:shadow-cardhover transition-all"
                  >
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-secondary-700 to-secondary-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {app.job?.company.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-secondary-900 truncate">{app.job?.title}</p>
                      <p className="text-sm text-secondary-500 truncate">{app.job?.company} · {app.job?.location}</p>
                    </div>
                    <span className={classNames('badge border', STAGE_COLORS[app.stage])}>{STAGE_LABELS[app.stage]}</span>
                    {app.match_score !== null && <ScoreRing score={app.match_score} size={36} />}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Board view */}
          {view === 'board' && (
            <div className="overflow-x-auto kanban-scroll -mx-1 px-1">
              <div className="flex gap-4 min-w-max pb-2">
                {STAGE_ORDER.map((stage) => (
                  <div key={stage} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(stage)} className="w-72 shrink-0">
                    <div className="flex items-center justify-between mb-2.5 px-1">
                      <h3 className="text-sm font-semibold text-secondary-700">{STAGE_LABELS[stage]}</h3>
                      <span className="badge bg-secondary-100 text-secondary-600">{grouped[stage].length}</span>
                    </div>
                    <div className={classNames('space-y-2.5 min-h-[100px] rounded-2xl p-2', draggedId ? 'bg-secondary-100/60' : '')}>
                      {grouped[stage].map((app) => (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={() => setDraggedId(app.id)}
                          onClick={() => setSelected(app)}
                          className="card p-3.5 cursor-grab active:cursor-grabbing hover:shadow-cardhover transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-sm font-semibold text-secondary-900 truncate">{app.job?.title}</p>
                            {app.match_score !== null && <ScoreRing score={app.match_score} size={30} />}
                          </div>
                          <p className="text-xs text-secondary-500 truncate mb-2">{app.job?.company}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {app.job?.work_mode && <span className="badge bg-secondary-100 text-secondary-600">{app.job.work_mode}</span>}
                            {app.job?.salary_min && <span className="text-xs text-secondary-500">{formatSalary(app.job.salary_min, app.job.salary_max)}</span>}
                          </div>
                        </div>
                      ))}
                      {grouped[stage].length === 0 && (
                        <div className="text-center py-6 text-xs text-secondary-400 border-2 border-dashed border-secondary-200 rounded-xl">Drop here</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail drawer */}
      {selected && (
        <DetailDrawer
          app={selected}
          onClose={() => setSelected(null)}
          onStageChange={(stage) => handleStageChange(selected.id, stage)}
          onDelete={() => handleDelete(selected.id)}
        />
      )}
    </div>
  );
}

function DetailDrawer({
  app,
  onClose,
  onStageChange,
  onDelete,
}: {
  app: Application;
  onClose: () => void;
  onStageChange: (stage: ApplicationStage) => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-xl overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white border-b border-secondary-100 px-5 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-secondary-900">Application details</h2>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-900"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Job info */}
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-secondary-700 to-secondary-900 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {app.job?.company.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <Link to={`/app/jobs/${app.job_id}`} className="font-semibold text-secondary-900 hover:text-primary-700">{app.job?.title}</Link>
              <p className="text-sm text-secondary-500">{app.job?.company}</p>
            </div>
            {app.match_score !== null && <ScoreRing score={app.match_score} size={40} />}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-secondary-500">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {app.job?.location || 'Remote'}</span>
            {(app.job?.salary_min || app.job?.salary_max) && (
              <span className="inline-flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> {formatSalary(app.job?.salary_min ?? null, app.job?.salary_max ?? null)}</span>
            )}
            {app.applied_at && <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Applied {timeAgo(app.applied_at)}</span>}
          </div>

          {/* Stage selector */}
          <div>
            <label className="label">Stage</label>
            <div className="grid grid-cols-2 gap-2">
              {STAGE_ORDER.map((stage) => (
                <button
                  key={stage}
                  onClick={() => onStageChange(stage)}
                  className={classNames(
                    'rounded-xl px-3 py-2 text-sm font-medium border transition-all',
                    app.stage === stage ? STAGE_COLORS[stage] : 'border-secondary-200 text-secondary-600 hover:bg-secondary-50'
                  )}
                >
                  {STAGE_LABELS[stage]}
                </button>
              ))}
            </div>
          </div>

          {/* Method */}
          {app.application_method && (
            <div>
              <label className="label">Application method</label>
              <p className="text-sm text-secondary-700 capitalize">{app.application_method.replace('_', ' ')}</p>
            </div>
          )}

          {/* Recruiter */}
          {(app.recruiter_name || app.recruiter_email) && (
            <div>
              <label className="label">Recruiter contact</label>
              {app.recruiter_name && <p className="text-sm text-secondary-700">{app.recruiter_name}</p>}
              {app.recruiter_email && <p className="text-sm text-secondary-500">{app.recruiter_email}</p>}
            </div>
          )}

          {/* Notes */}
          {app.notes && (
            <div>
              <label className="label">Notes</label>
              <p className="text-sm text-secondary-700 rounded-xl bg-secondary-50 p-3">{app.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-secondary-100">
            {app.job?.apply_url && (
              <a href={app.job.apply_url} target="_blank" rel="noopener noreferrer" className="btn-secondary flex-1 justify-center">
                <ExternalLink className="h-4 w-4" /> Apply on site
              </a>
            )}
            <Link to={`/app/jobs/${app.job_id}`} className="btn-secondary flex-1 justify-center">
              View job <ArrowRight className="h-4 w-4" />
            </Link>
            <button onClick={onDelete} className="btn-danger px-3" title="Remove from pipeline">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
