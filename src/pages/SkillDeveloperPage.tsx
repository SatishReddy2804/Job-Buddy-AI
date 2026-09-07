import { useEffect, useMemo, useState } from 'react';
import {
  GraduationCap,
  TrendingUp,
  Target,
  Clock,
  BookOpen,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Lightbulb,
  Loader2,
  Search,
  X,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchProfileSkills, fetchJobs } from '@/lib/api';
import { PageHeader, EmptyState, Spinner, ScoreRing } from '@/components/ui';
import { classNames } from '@/lib/utils';
import { CourseCardIcons } from '@/components/CourseCardIcons';
import type { Job, ProfileSkill } from '@/types';

interface LearningStep {
  title: string;
  description: string;
  estimatedTime: string;
  resourceType: string;
  youtubeUrl?: string;
  courseUrl?: string;
  platform?: string;
}

interface SkillPlan {
  skillName: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  steps: LearningStep[];
  estimatedWeeks: number;
  marketDemand: number;
}

const RESOURCE_TEMPLATES: Record<string, Omit<LearningStep, 'title'>> = {
  course: { description: 'Start with a structured course covering fundamentals to intermediate concepts.', estimatedTime: '2-3 weeks', resourceType: 'Online Course' },
  project: { description: 'Build a hands-on project to apply what you learned in a real scenario.', estimatedTime: '1-2 weeks', resourceType: 'Practical Project' },
  deep: { description: 'Dive into advanced topics, best practices, and common interview patterns.', estimatedTime: '1-2 weeks', resourceType: 'Deep Dive' },
  practice: { description: 'Solve practice problems and complete exercises to solidify your knowledge.', estimatedTime: '1 week', resourceType: 'Practice Exercises' },
};

function generateLearningPlan(skillName: string, marketDemand: number, priority: SkillPlan['priority']): SkillPlan {
  const steps: LearningStep[] = [
    { title: `Learn ${skillName} fundamentals`, ...RESOURCE_TEMPLATES.course },
    { title: `Build a ${skillName} project`, ...RESOURCE_TEMPLATES.project },
    { title: `Master advanced ${skillName}`, ...RESOURCE_TEMPLATES.deep },
    { title: `Practice ${skillName} problems`, ...RESOURCE_TEMPLATES.practice },
  ];

  const reasons: Record<SkillPlan['priority'], string> = {
    high: 'This skill appears frequently in job requirements for your target roles. Learning it will significantly boost your match rate.',
    medium: 'This skill is commonly preferred by employers in your field. Adding it will improve your competitiveness.',
    low: 'This is a supplementary skill that rounds out your profile for broader role coverage.',
  };

  const weeks = priority === 'high' ? 6 : priority === 'medium' ? 4 : 3;

  return {
    skillName,
    category: 'Technical',
    priority,
    reason: reasons[priority],
    steps,
    estimatedWeeks: weeks,
    marketDemand,
  };
}

function categorizeSkillGap(
  missingSkills: string[],
  jobs: Job[],
  userSkillCount: number,
): SkillPlan[] {
  const skillFreq = new Map<string, { required: number; preferred: number }>();
  for (const job of jobs) {
    for (const skill of job.skills_required) {
      const key = skill.toLowerCase();
      const entry = skillFreq.get(key) ?? { required: 0, preferred: 0 };
      entry.required++;
      skillFreq.set(key, entry);
    }
    for (const skill of job.skills_preferred) {
      const key = skill.toLowerCase();
      const entry = skillFreq.get(key) ?? { required: 0, preferred: 0 };
      entry.preferred++;
      skillFreq.set(key, entry);
    }
  }

  const missingNormalized = new Set(missingSkills.map((s) => s.toLowerCase()));

  const scored = Array.from(skillFreq.entries())
    .filter(([key]) => missingNormalized.has(key))
    .map(([key, freq]) => {
      const originalName = missingSkills.find((s) => s.toLowerCase() === key) ?? key;
      const demandScore = Math.min(100, freq.required * 15 + freq.preferred * 8);
      const priority: SkillPlan['priority'] = freq.required >= 3 ? 'high' : freq.required >= 1 || freq.preferred >= 3 ? 'medium' : 'low';
      return { name: originalName, demandScore, priority };
    })
    .sort((a, b) => b.demandScore - a.demandScore)
    .slice(0, 8);

  return scored.map((s) => generateLearningPlan(s.name, s.demandScore, s.priority));
}

export default function SkillDeveloperPage() {
  const { profile } = useAuth();
  const [skills, setSkills] = useState<ProfileSkill[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [plans, setPlans] = useState<SkillPlan[]>([]);
  const [activePlan, setActivePlan] = useState<SkillPlan | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [customSkill, setCustomSkill] = useState('');

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    Promise.all([
      fetchProfileSkills(profile.id).catch(() => [] as ProfileSkill[]),
      fetchJobs({ limit: 100 }).catch(() => [] as Job[]),
    ]).then(([skillData, jobData]) => {
      setSkills(skillData);
      setJobs(jobData);
      setLoading(false);
    });
  }, [profile]);

  const userSkillNames = useMemo(() => skills.map((s) => s.name), [skills]);

  const skillGap = useMemo(() => {
    const userSet = new Set(userSkillNames.map((s) => s.toLowerCase()));
    const allJobSkills = new Set<string>();
    for (const job of jobs) {
      for (const s of job.skills_required) allJobSkills.add(s);
      for (const s of job.skills_preferred) allJobSkills.add(s);
    }
    return Array.from(allJobSkills).filter((s) => !userSet.has(s.toLowerCase()));
  }, [jobs, userSkillNames]);

  const filteredGaps = useMemo(() => {
    if (!searchQuery.trim()) return skillGap;
    const q = searchQuery.toLowerCase();
    return skillGap.filter((s) => s.toLowerCase().includes(q));
  }, [skillGap, searchQuery]);

  const generatePlans = () => {
    setGenerating(true);
    setTimeout(() => {
      const newPlans = categorizeSkillGap(skillGap, jobs, userSkillNames.length);
      setPlans(newPlans);
      setGenerating(false);
    }, 600);
  };

  const generateForCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    const plan = generateLearningPlan(trimmed, 50, 'medium');
    setPlans((prev) => {
      const filtered = prev.filter((p) => p.skillName.toLowerCase() !== trimmed.toLowerCase());
      return [plan, ...filtered];
    });
    setActivePlan(plan);
    setCustomSkill('');
  };

  const toggleStep = (planName: string, stepTitle: string) => {
    const key = `${planName}:${stepTitle}`;
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getPlanProgress = (plan: SkillPlan) => {
    const completed = plan.steps.filter((s) => completedSteps.has(`${plan.skillName}:${s.title}`)).length;
    return Math.round((completed / plan.steps.length) * 100);
  };

  const overallProgress = useMemo(() => {
    if (plans.length === 0) return 0;
    const totalSteps = plans.reduce((sum, p) => sum + p.steps.length, 0);
    const completed = plans.reduce(
      (sum, p) => sum + p.steps.filter((s) => completedSteps.has(`${p.skillName}:${s.title}`)).length,
      0,
    );
    return Math.round((completed / totalSteps) * 100);
  }, [plans, completedSteps]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-7 w-7 text-primary-600" /></div>;
  }

  if (skillGap.length === 0 && plans.length === 0) {
    return (
      <div>
        <PageHeader title="Skill Developer" subtitle="Identify skill gaps and generate personalized learning plans" />
        <div className="card">
          <EmptyState
            icon={GraduationCap}
            title="No skill gaps detected"
            description="Your current skills cover all the requirements from available jobs. Add more jobs to your feed or explore new skills manually."
          />
        </div>
        <div className="mt-6 card p-6">
          <h3 className="text-base font-semibold text-secondary-900 mb-3">Explore a skill manually</h3>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="e.g. Rust, Kubernetes, GraphQL…"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); generateForCustomSkill(); } }}
            />
            <button onClick={generateForCustomSkill} disabled={!customSkill.trim()} className="btn-primary">
              <Plus className="h-4 w-4" /> Generate plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Skill Developer"
        subtitle="Identify skill gaps and generate personalized learning plans"
        actions={
          <button onClick={generatePlans} disabled={generating || skillGap.length === 0} className="btn-primary">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate learning plans
          </button>
        }
      />

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="h-9 w-9 rounded-xl bg-primary-50 flex items-center justify-center mb-3">
            <Target className="h-5 w-5 text-primary-600" />
          </div>
          <p className="text-2xl font-bold text-secondary-900">{skills.length}</p>
          <p className="text-xs text-secondary-500 mt-0.5">Your skills</p>
        </div>
        <div className="card p-4">
          <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
            <TrendingUp className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-secondary-900">{skillGap.length}</p>
          <p className="text-xs text-secondary-500 mt-0.5">Skill gaps found</p>
        </div>
        <div className="card p-4">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
            <BookOpen className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-secondary-900">{plans.length}</p>
          <p className="text-xs text-secondary-500 mt-0.5">Learning plans</p>
        </div>
        <div className="card p-4">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-secondary-900">{overallProgress}%</p>
          <p className="text-xs text-secondary-500 mt-0.5">Overall progress</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: skill gaps + plan list */}
        <div className="lg:col-span-1 space-y-6">
          {/* Skill gap list */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              <h2 className="text-base font-semibold text-secondary-900">Skill gaps</h2>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                className="input pl-10 text-sm"
                placeholder="Search skills…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {filteredGaps.length === 0 ? (
                <p className="text-sm text-secondary-400 text-center py-4">No matching skills found.</p>
              ) : (
                filteredGaps.slice(0, 20).map((skill) => {
                  const hasPlan = plans.some((p) => p.skillName.toLowerCase() === skill.toLowerCase());
                  return (
                    <div key={skill} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-secondary-50 transition-colors">
                      <span className="text-sm font-medium text-secondary-800">{skill}</span>
                      {hasPlan ? (
                        <span className="badge bg-primary-50 text-primary-700 gap-1"><CheckCircle2 className="h-3 w-3" /> Planned</span>
                      ) : (
                        <button
                          onClick={() => {
                            const plan = generateLearningPlan(skill, 50, 'medium');
                            setPlans((prev) => [plan, ...prev]);
                            setActivePlan(plan);
                          }}
                          className="text-xs font-medium text-primary-600 hover:text-primary-700"
                        >
                          <Plus className="h-3 w-3 inline" /> Plan
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {filteredGaps.length > 20 && (
              <p className="text-xs text-secondary-400 mt-2 text-center">Showing top 20 of {filteredGaps.length}</p>
            )}
          </div>

          {/* Custom skill */}
          <div className="card p-5">
            <h2 className="text-base font-semibold text-secondary-900 mb-3">Explore any skill</h2>
            <div className="flex gap-2">
              <input
                className="input text-sm"
                placeholder="e.g. Rust, GraphQL…"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); generateForCustomSkill(); } }}
              />
              <button onClick={generateForCustomSkill} disabled={!customSkill.trim()} className="btn-secondary px-3">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Plan list */}
          {plans.length > 0 && (
            <div className="card p-5">
              <h2 className="text-base font-semibold text-secondary-900 mb-3">Your learning plans</h2>
              <div className="space-y-2">
                {plans.map((plan) => {
                  const progress = getPlanProgress(plan);
                  const isActive = activePlan?.skillName === plan.skillName;
                  return (
                    <button
                      key={plan.skillName}
                      onClick={() => setActivePlan(plan)}
                      className={classNames(
                        'w-full text-left rounded-xl border p-3 transition-all',
                        isActive ? 'border-primary-400 bg-primary-50/50' : 'border-secondary-200 hover:bg-secondary-50',
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-secondary-900">{plan.skillName}</span>
                        <span className={classNames(
                          'badge text-xs',
                          plan.priority === 'high' ? 'bg-rose-50 text-rose-700' :
                          plan.priority === 'medium' ? 'bg-amber-50 text-amber-700' :
                          'bg-secondary-100 text-secondary-600'
                        )}>
                          {plan.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-secondary-200 overflow-hidden">
                          <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-secondary-500">{progress}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column: active plan detail */}
        <div className="lg:col-span-2">
          {activePlan ? (
            <div className="card p-6 animate-fade-in">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-secondary-900">{activePlan.skillName}</h2>
                    <span className={classNames(
                      'badge',
                      activePlan.priority === 'high' ? 'bg-rose-50 text-rose-700' :
                      activePlan.priority === 'medium' ? 'bg-amber-50 text-amber-700' :
                      'bg-secondary-100 text-secondary-600'
                    )}>
                      {activePlan.priority} priority
                    </span>
                  </div>
                  <p className="text-sm text-secondary-500">{activePlan.reason}</p>
                </div>
                <ScoreRing score={activePlan.marketDemand} size={56} />
              </div>

              {/* Plan meta */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="rounded-xl border border-secondary-200 p-3 text-center">
                  <Clock className="h-4 w-4 text-secondary-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-secondary-900">{activePlan.estimatedWeeks} weeks</p>
                  <p className="text-xs text-secondary-500">Estimated time</p>
                </div>
                <div className="rounded-xl border border-secondary-200 p-3 text-center">
                  <BookOpen className="h-4 w-4 text-secondary-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-secondary-900">{activePlan.steps.length} steps</p>
                  <p className="text-xs text-secondary-500">Learning path</p>
                </div>
                <div className="rounded-xl border border-secondary-200 p-3 text-center">
                  <TrendingUp className="h-4 w-4 text-secondary-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-secondary-900">{activePlan.marketDemand}%</p>
                  <p className="text-xs text-secondary-500">Market demand</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-secondary-700">Progress</span>
                  <span className="text-sm font-bold text-primary-600">{getPlanProgress(activePlan)}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary-200 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500" style={{ width: `${getPlanProgress(activePlan)}%` }} />
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-secondary-900">Learning path</h3>
                {activePlan.steps.map((step, i) => {
                  const stepKey = `${activePlan.skillName}:${step.title}`;
                  const isDone = completedSteps.has(stepKey);
                  return (
                    <div
                      key={step.title}
                      className={classNames(
                        'rounded-xl border p-4 transition-all',
                        isDone ? 'border-emerald-200 bg-emerald-50/40' : 'border-secondary-200',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleStep(activePlan.skillName, step.title)}
                          className="mt-0.5 shrink-0"
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-secondary-300 hover:text-primary-400 transition-colors" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="h-6 w-6 rounded-full bg-primary-50 text-primary-600 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                            <p className={classNames('text-sm font-semibold', isDone ? 'text-secondary-500 line-through' : 'text-secondary-900')}>{step.title}</p>
                          </div>
                          <p className="text-sm text-secondary-600 mb-2">{step.description}</p>
                          <div className="flex items-center gap-3 text-xs text-secondary-400">
                            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {step.resourceType}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {step.estimatedTime}</span>
                            <CourseCardIcons
                              courseTitle={step.title}
                              youtubeUrl={step.youtubeUrl}
                              courseUrl={step.courseUrl}
                              platform={step.platform}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Completion footer */}
              {getPlanProgress(activePlan) === 100 && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3 animate-fade-in">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Learning plan complete!</p>
                    <p className="text-xs text-emerald-700">You've completed all steps for {activePlan.skillName}. Consider adding this skill to your profile.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <EmptyState
                icon={GraduationCap}
                title="Select a learning plan"
                description={
                  plans.length > 0
                    ? 'Choose a plan from the left to view its detailed learning path with step-by-step resources.'
                    : 'Click "Generate learning plans" to analyze skill gaps across available jobs and create personalized learning paths.'
                }
                action={
                  plans.length === 0 && skillGap.length > 0 ? (
                    <button onClick={generatePlans} disabled={generating} className="btn-primary">
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Generate plans
                    </button>
                  ) : undefined
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
