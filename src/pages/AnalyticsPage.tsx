import { useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Target, Award, Clock } from 'lucide-react';
import { useApplications } from '@/hooks/useApplications';
import { PageHeader, EmptyState, Spinner } from '@/components/ui';
import { STAGE_LABELS, classNames } from '@/lib/utils';
import type { ApplicationStage } from '@/types';

const FUNNEL_STAGES: ApplicationStage[] = ['applied', 'viewed', 'interview', 'offer'];

export default function AnalyticsPage() {
  const { applications, loading, error } = useApplications();

  const metrics = useMemo(() => {
    const byStage = (stage: ApplicationStage) => applications.filter((a) => a.stage === stage).length;
    const applied = byStage('applied') + byStage('viewed') + byStage('interview') + byStage('offer') + byStage('rejected');
    const viewed = byStage('viewed') + byStage('interview') + byStage('offer') + byStage('rejected');
    const interviews = byStage('interview') + byStage('offer');
    const offers = byStage('offer');
    const rejected = byStage('rejected');

    const viewRate = applied > 0 ? Math.round((viewed / applied) * 100) : 0;
    const interviewRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0;
    const offerRate = interviews > 0 ? Math.round((offers / interviews) * 100) : 0;
    const rejectionRate = applied > 0 ? Math.round((rejected / applied) * 100) : 0;

    const avgMatchScore = applications.length > 0
      ? Math.round(applications.reduce((sum, a) => sum + (a.match_score ?? 0), 0) / applications.length)
      : 0;

    // Company breakdown
    const companyMap = new Map<string, number>();
    applications.forEach((a) => {
      const company = a.job?.company ?? 'Unknown';
      companyMap.set(company, (companyMap.get(company) ?? 0) + 1);
    });
    const topCompanies = Array.from(companyMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Stage distribution
    const stageDist = ['discovered', 'matched', 'applied', 'viewed', 'interview', 'offer', 'rejected'] as ApplicationStage[];
    const stageCounts = stageDist.map((s) => ({ stage: s, count: byStage(s) }));

    return {
      total: applications.length,
      applied, viewed, interviews, offers, rejected,
      viewRate, interviewRate, offerRate, rejectionRate,
      avgMatchScore, topCompanies, stageCounts,
    };
  }, [applications]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-7 w-7 text-primary-600" /></div>;
  }

  if (error) {
    return <EmptyState icon={BarChart3} title="Could not load analytics" description={error} />;
  }

  if (applications.length === 0) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Track your application funnel and performance" />
        <div className="card">
          <EmptyState
            icon={BarChart3}
            title="No data yet"
            description="Once you start tracking applications, your analytics dashboard will populate with funnel metrics, conversion rates, and company insights."
          />
        </div>
      </div>
    );
  }

  const funnelMax = Math.max(...FUNNEL_STAGES.map((s) => metrics.stageCounts.find((sc) => sc.stage === s)?.count ?? 0), 1);

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Track your application funnel and performance" />

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={Target} label="Total applications" value={metrics.total} color="text-secondary-600" bg="bg-secondary-100" />
        <MetricCard icon={TrendingUp} label="Interview rate" value={`${metrics.interviewRate}%`} color="text-violet-600" bg="bg-violet-50" />
        <MetricCard icon={Award} label="Offer rate" value={`${metrics.offerRate}%`} color="text-emerald-600" bg="bg-emerald-50" />
        <MetricCard icon={Clock} label="Avg match score" value={metrics.avgMatchScore} color="text-primary-600" bg="bg-primary-50" />
      </div>

      {/* Funnel + stage distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Funnel */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-secondary-900 mb-5">Application funnel</h2>
          <div className="space-y-4">
            {FUNNEL_STAGES.map((stage) => {
              const count = metrics.stageCounts.find((sc) => sc.stage === stage)?.count ?? 0;
              const pct = Math.round((count / funnelMax) * 100);
              const conversion = stage === 'applied' ? 100 : Math.round((count / (metrics.stageCounts.find((sc) => sc.stage === 'applied')?.count ?? 1)) * 100);
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium text-secondary-700">{STAGE_LABELS[stage]}</span>
                    <span className="text-secondary-500">{count} <span className="text-secondary-400">({conversion}%)</span></span>
                  </div>
                  <div className="h-3 rounded-full bg-secondary-100 overflow-hidden">
                    <div
                      className={classNames(
                        'h-full rounded-full transition-all duration-700',
                        stage === 'applied' ? 'bg-blue-500' :
                        stage === 'viewed' ? 'bg-amber-500' :
                        stage === 'interview' ? 'bg-violet-500' : 'bg-emerald-500'
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage distribution */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-secondary-900 mb-5">Pipeline breakdown</h2>
          <div className="space-y-3">
            {metrics.stageCounts.map(({ stage, count }) => {
              const max = Math.max(...metrics.stageCounts.map((sc) => sc.count), 1);
              const pct = Math.round((count / max) * 100);
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-secondary-600 w-24 shrink-0">{STAGE_LABELS[stage]}</span>
                  <div className="flex-1 h-6 rounded-lg bg-secondary-100 overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-lg transition-all duration-500 flex items-center justify-end pr-2" style={{ width: `${Math.max(pct, count > 0 ? 10 : 0)}%` }}>
                      {count > 0 && <span className="text-xs font-bold text-white">{count}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Companies + rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top companies */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-secondary-900 mb-4">Top companies</h2>
          {metrics.topCompanies.length === 0 ? (
            <p className="text-sm text-secondary-400">No company data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {metrics.topCompanies.map(([company, count], i) => (
                <div key={company} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-secondary-400 w-5">{i + 1}</span>
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-secondary-700 to-secondary-900 flex items-center justify-center text-white text-xs font-bold">
                    {company.slice(0, 2)}
                  </div>
                  <span className="text-sm font-medium text-secondary-700 flex-1">{company}</span>
                  <span className="badge bg-secondary-100 text-secondary-600">{count} app{count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversion rates */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-secondary-900 mb-4">Conversion rates</h2>
          <div className="space-y-4">
            <RateRow label="Applied → Viewed" value={metrics.viewRate} />
            <RateRow label="Applied → Interview" value={metrics.interviewRate} />
            <RateRow label="Interview → Offer" value={metrics.offerRate} />
            <RateRow label="Rejection rate" value={metrics.rejectionRate} negative />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color, bg }: { icon: typeof Target; label: string; value: string | number; color: string; bg: string }) {
  return (
    <div className="card p-4">
      <div className={classNames('h-9 w-9 rounded-xl flex items-center justify-center mb-3', bg)}>
        <Icon className={classNames('h-5 w-5', color)} />
      </div>
      <p className="text-2xl font-bold text-secondary-900">{value}</p>
      <p className="text-xs text-secondary-500 mt-0.5">{label}</p>
    </div>
  );
}

function RateRow({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  const Icon = negative ? TrendingDown : TrendingUp;
  const color = negative ? 'text-rose-600' : value >= 15 ? 'text-emerald-600' : value >= 5 ? 'text-amber-600' : 'text-secondary-500';
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-secondary-600">{label}</span>
      <div className="flex items-center gap-2">
        <Icon className={classNames('h-4 w-4', color)} />
        <span className={classNames('text-sm font-bold', color)}>{value}%</span>
      </div>
    </div>
  );
}
