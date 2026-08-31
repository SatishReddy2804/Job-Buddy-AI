import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Building2,
  Calendar,
  ExternalLink,
  Check,
  X,
  Plus,
  Target,
  MessageSquare,
  Loader2,
  Lightbulb,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useApplications } from '@/hooks/useApplications';
import { fetchProfileSkills, fetchResumes, updateResume, createApplication, updateApplicationStage, logActivity } from '@/lib/api';
import { Spinner, EmptyState, ScoreRing } from '@/components/ui';
import { computeMatchScore, formatConvertedSalary, timeAgo, WORK_MODE_LABELS, EXPERIENCE_LABELS } from '@/lib/utils';
import { useCurrencyRates } from '@/hooks/useCurrencyRates';
import type { Job, ProfileSkill, Resume } from '@/types';

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { applications, setApplications } = useApplications();
  const rates = useCurrencyRates();
  const displayCurrency = profile?.preferred_currency ?? 'USD';
  const [job, setJob] = useState<Job | null>(null);
  const [skills, setSkills] = useState<ProfileSkill[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [addedSkills, setAddedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [prepLoading, setPrepLoading] = useState(false);
  const [prep, setPrep] = useState<{ questions: Array<{ question: string; category: string }> } | null>(null);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [generatingCL, setGeneratingCL] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    supabase.from('jobs').select('*').eq('id', jobId).maybeSingle().then(({ data, error }) => {
      if (error || !data) {
        setJob(null);
      } else {
        setJob(data as Job);
      }
      setLoading(false);
    });
    if (profile) fetchProfileSkills(profile.id).then(setSkills).catch(() => {});
    fetchResumes().then(setResumes).catch(() => {});
  }, [jobId, profile]);

  const primaryResume = useMemo(() => resumes.find((r) => r.is_primary) ?? resumes[0], [resumes]);
  const resumeSkills = useMemo(() => primaryResume?.content.skills ?? [], [primaryResume]);

  const userSkillNames = useMemo(() => {
    const resumeSkillSet = new Set(resumeSkills.map((s) => s.toLowerCase()));
    return [...new Set([...resumeSkills, ...skills.filter((s) => resumeSkillSet.has(s.name.toLowerCase())).map((s) => s.name)])];
  }, [skills, resumeSkills]);
  const match = useMemo(() => {
    if (!job) return { score: 0, matched: [], missing: [] };
    return computeMatchScore(job.skills_required, job.skills_preferred, userSkillNames);
  }, [job, userSkillNames]);

  const skillsGap = useMemo(() => {
    if (!job) return { missing: [], extraInJob: [] };
    const resumeSet = new Set(resumeSkills.map((s) => s.toLowerCase()));
    const missing = job.skills_required.filter((s) => !resumeSet.has(s.toLowerCase()));
    const missingPreferred = job.skills_preferred.filter((s) => !resumeSet.has(s.toLowerCase()));
    return { missing: [...new Set([...missing, ...missingPreferred])] };
  }, [job, resumeSkills]);

  const handleAddSkillToResume = async (skill: string) => {
    if (!primaryResume) return;
    const currentSkills = primaryResume.content.skills ?? [];
    if (currentSkills.some((s) => s.toLowerCase() === skill.toLowerCase())) return;
    const newSkills = [...currentSkills, skill];
    setAddedSkills((prev) => [...prev, skill]);
    setResumes((prev) => prev.map((r) => r.id === primaryResume.id ? { ...r, content: { ...r.content, skills: newSkills } } : r));
    try {
      await updateResume(primaryResume.id, { content: { ...primaryResume.content, skills: newSkills } });
    } catch {
      setResumes((prev) => prev.map((r) => r.id === primaryResume.id ? { ...r, content: { ...r.content, skills: currentSkills } } : r));
      setAddedSkills((prev) => prev.filter((s) => s !== skill));
    }
  };

  const handleAddAllMissingSkills = async () => {
    for (const skill of skillsGap.missing) {
      await handleAddSkillToResume(skill);
    }
  };

  const existingApp = applications.find((a) => a.job_id === jobId);

  const handleAddToPipeline = async () => {
    if (!job) return;
    try {
      const newApp = await createApplication(job.id, match.score >= 50 ? 'matched' : 'discovered', match.score);
      setApplications((prev) => [newApp, ...prev]);
      await logActivity('job_added', 'job', job.id, { match_score: match.score });
    } catch {
      // ignore
    }
  };

  const handleApply = async () => {
    if (!existingApp || !job) return;
    const updated = await updateApplicationStage(existingApp.id, 'applied', { application_method: 'manual' });
    setApplications((prev) => prev.map((a) => (a.id === existingApp.id ? updated : a)));
    await logActivity('applied', 'application', existingApp.id, { company: job.company });
  };

  const generatePrep = async () => {
    if (!job) return;
    setPrepLoading(true);
    // Generate deterministic interview questions based on job data (stand-in for LLM)
    await new Promise((r) => setTimeout(r, 800));
    const questions = [
      { question: `Tell me about your experience with ${job.skills_required[0] ?? 'your core skills'}.`, category: 'Technical' },
      { question: `Why are you interested in joining ${job.company}?`, category: 'Behavioral' },
      { question: `Describe a challenging project you worked on and how you overcame obstacles.`, category: 'Behavioral' },
      { question: `How would you approach designing a system for ${job.company}'s scale?`, category: 'System Design' },
      { question: `What excites you about the ${job.industry ?? 'technology'} industry?`, category: 'Company fit' },
      { question: `Walk me through a time you had a disagreement with a teammate and how you resolved it.`, category: 'Behavioral' },
      { question: `How do you stay current with new technologies and best practices?`, category: 'Technical' },
      { question: `Tell me about a time you delivered a project under a tight deadline.`, category: 'Behavioral' },
    ];
    setPrep({ questions });
    setPrepLoading(false);
  };

  const generateCoverLetter = async () => {
    if (!job || !profile) return;
    setGeneratingCL(true);
    await new Promise((r) => setTimeout(r, 900));
    const name = profile.full_name ?? 'Your Name';
    const role = profile.present_role ?? 'a software professional';
    const topSkill = job.skills_required[0] ?? 'software engineering';
    const letter = `Dear Hiring Team at ${job.company},

I am excited to apply for the ${job.title} position at ${job.company}. With ${profile.years_experience ?? 'several'} years of experience as ${role}, I have developed strong expertise in ${topSkill} and related technologies that align closely with your requirements.

What draws me to ${job.company} is your work in ${job.industry ?? 'the industry'} and the opportunity to contribute to meaningful products. In my current role, I have focused on building scalable, well-tested solutions and collaborating cross-functionally to deliver results.

I would welcome the opportunity to discuss how my background in ${userSkillNames.slice(0, 3).join(', ') || 'my field'} can contribute to your team. Thank you for your consideration.

Best regards,
${name}`;
    setCoverLetter(letter);
    setGeneratingCL(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-7 w-7 text-primary-600" /></div>;
  }

  if (!job) {
    return (
      <EmptyState
        icon={X}
        title="Job not found"
        description="This job may have been removed."
        action={<Link to="/app/jobs" className="btn-primary">Back to jobs</Link>}
      />
    );
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-secondary-500 hover:text-secondary-900 mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job header */}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-secondary-700 to-secondary-900 flex items-center justify-center text-white font-bold shrink-0">
                {job.company.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-secondary-900">{job.title}</h1>
                <p className="text-secondary-600">{job.company}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-secondary-500">
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {job.location || 'Remote'}</span>
                  {job.work_mode && <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {WORK_MODE_LABELS[job.work_mode]}</span>}
                  {(job.salary_min || job.salary_max) && <span className="inline-flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> {formatConvertedSalary(job.salary_min, job.salary_max, job.salary_currency, displayCurrency, rates)}</span>}
                  <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {timeAgo(job.posted_at)}</span>
                </div>
              </div>
              {job.apply_url && (
                <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="btn-secondary shrink-0">
                  <ExternalLink className="h-4 w-4" /> Apply on site
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-secondary-900 mb-3">Job description</h2>
            <p className="text-sm text-secondary-700 leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          {/* Requirements */}
          {job.requirements.length > 0 && (
            <div className="card p-6">
              <h2 className="text-base font-semibold text-secondary-900 mb-3">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-secondary-700">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cover letter generator */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-secondary-900">AI cover letter</h2>
              <button onClick={generateCoverLetter} disabled={generatingCL} className="btn-secondary text-sm">
                {generatingCL ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                {coverLetter ? 'Regenerate' : 'Generate'}
              </button>
            </div>
            {coverLetter ? (
              <div className="rounded-xl border border-secondary-200 bg-secondary-50/50 p-4">
                <pre className="text-sm text-secondary-700 whitespace-pre-wrap font-sans leading-relaxed">{coverLetter}</pre>
                <button
                  onClick={() => navigator.clipboard.writeText(coverLetter)}
                  className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Copy to clipboard
                </button>
              </div>
            ) : (
              <p className="text-sm text-secondary-500">Generate a tailored cover letter based on your profile and this job description.</p>
            )}
          </div>

          {/* Interview prep */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-secondary-900">Interview prep</h2>
              <button onClick={generatePrep} disabled={prepLoading} className="btn-secondary text-sm">
                {prepLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                {prep ? 'Regenerate' : 'Generate questions'}
              </button>
            </div>
            {prep ? (
              <div className="space-y-3">
                {prep.questions.map((q, i) => (
                  <div key={i} className="flex gap-3 rounded-xl border border-secondary-200 p-3">
                    <span className="h-6 w-6 rounded-full bg-primary-50 text-primary-600 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <div>
                      <p className="text-sm text-secondary-800">{q.question}</p>
                      <span className="text-xs text-secondary-400 mt-0.5 inline-block">{q.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-secondary-500">Generate role-specific interview questions to practice before your interview.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Match score */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-secondary-900 mb-4">Match analysis</h2>
            <div className="flex items-center gap-4 mb-5">
              <ScoreRing score={match.score} size={64} />
              <div>
                <p className="text-3xl font-bold text-secondary-900">{match.score}<span className="text-lg text-secondary-400">%</span></p>
                <p className="text-xs text-secondary-500">Overall match score</p>
              </div>
            </div>

            {match.matched.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-emerald-700 mb-2">Skills you have ({match.matched.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {match.matched.map((s) => (
                    <span key={s} className="badge bg-emerald-50 text-emerald-700"><Check className="h-3 w-3" /> {s}</span>
                  ))}
                </div>
              </div>
            )}

            {match.missing.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-2">Skills to develop ({match.missing.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {match.missing.map((s) => (
                    <span key={s} className="badge bg-amber-50 text-amber-700"><X className="h-3 w-3" /> {s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Skill gap advisor */}
          {primaryResume && skillsGap.missing.length > 0 && (
            <div className="card p-6 border-amber-200">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="h-5 w-5 text-amber-600" />
                <h2 className="text-base font-semibold text-secondary-900">Skill gap advisor</h2>
              </div>
              <p className="text-xs text-secondary-500 mb-4">
                Comparing against your resume <span className="font-medium text-secondary-700">{primaryResume.label}</span>. These skills are required or preferred by this job but missing from your resume.
              </p>
              {skillsGap.missing.length === 0 ? (
                <p className="text-sm text-emerald-600 flex items-center gap-2">
                  <Check className="h-4 w-4" /> Your resume covers all the skills this job needs.
                </p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {skillsGap.missing.map((skill) => {
                      const alreadyAdded = addedSkills.some((s) => s.toLowerCase() === skill.toLowerCase());
                      const resumeHas = resumeSkills.some((s) => s.toLowerCase() === skill.toLowerCase());
                      return (
                        <div key={skill} className="flex items-center justify-between rounded-lg border border-secondary-200 px-3 py-2">
                          <span className="text-sm font-medium text-secondary-800">{skill}</span>
                          {resumeHas || alreadyAdded ? (
                            <span className="badge bg-emerald-50 text-emerald-700 gap-1"><Check className="h-3 w-3" /> Added</span>
                          ) : (
                            <button
                              onClick={() => handleAddSkillToResume(skill)}
                              className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add to resume
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {addedSkills.length < skillsGap.missing.length && (
                    <button onClick={handleAddAllMissingSkills} className="btn-primary w-full text-sm">
                      <Plus className="h-4 w-4" /> Add all missing skills to resume
                    </button>
                  )}
                  {addedSkills.length >= skillsGap.missing.length && (
                    <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 flex items-center gap-2">
                      <Check className="h-4 w-4" /> All missing skills have been added to your resume.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {primaryResume && skillsGap.missing.length === 0 && job && job.skills_required.length > 0 && (
            <div className="card p-6 border-emerald-200">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="text-base font-semibold text-secondary-900">Resume match</h2>
                  <p className="text-xs text-secondary-500">Your resume covers all required and preferred skills for this role.</p>
                </div>
              </div>
            </div>
          )}

          {!primaryResume && (
            <div className="card p-6 border-primary-200 bg-primary-50/30">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-5 w-5 text-primary-600" />
                <h2 className="text-base font-semibold text-secondary-900">Upload a resume</h2>
              </div>
              <p className="text-sm text-secondary-600 mb-3">
                Upload your resume to see how well it matches this job and get personalized skill gap recommendations.
              </p>
              <Link to="/app/resumes" className="btn-primary w-full text-sm">
                <FileText className="h-4 w-4" /> Go to resumes
              </Link>
            </div>
          )}

          {/* Action card */}
          <div className="card p-6">
            {existingApp ? (
              <div>
                <p className="text-sm text-secondary-500 mb-1">Status in pipeline</p>
                <p className="text-lg font-semibold text-secondary-900 capitalize mb-4">{existingApp.stage}</p>
                {existingApp.stage !== 'applied' && (
                  <button onClick={handleApply} className="btn-primary w-full">
                    <Check className="h-4 w-4" /> Mark as applied
                  </button>
                )}
                <Link to="/app/applications" className="btn-secondary w-full mt-2">View in pipeline</Link>
              </div>
            ) : (
              <button onClick={handleAddToPipeline} className="btn-primary w-full">
                <Plus className="h-4 w-4" /> Add to pipeline
              </button>
            )}
          </div>

          {/* Job meta */}
          <div className="card p-6 space-y-3">
            <h2 className="text-base font-semibold text-secondary-900 mb-1">Details</h2>
            {job.experience_level && (
              <Row label="Experience" value={EXPERIENCE_LABELS[job.experience_level as keyof typeof EXPERIENCE_LABELS] ?? job.experience_level} />
            )}
            {job.company_size && <Row label="Company size" value={job.company_size} />}
            {job.industry && <Row label="Industry" value={job.industry} />}
            {job.source && <Row label="Source" value={job.source} />}
            {job.benefits.length > 0 && (
              <div>
                <p className="text-xs text-secondary-500 mb-1.5">Benefits</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.benefits.map((b) => (
                    <span key={b} className="badge bg-secondary-100 text-secondary-600">{b}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-secondary-500">{label}</span>
      <span className="font-medium text-secondary-900">{value}</span>
    </div>
  );
}
