import { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  X,
  Star,
  Loader2,
  Check,
  Download,
  Upload,
  FileUp,
  AlertCircle,
} from 'lucide-react';
import { fetchResumes, createResume, updateResume, deleteResume } from '@/lib/api';
import { parseResumeFile } from '@/lib/resume-parser';
import { PageHeader, EmptyState, Spinner } from '@/components/ui';
import { classNames, timeAgo } from '@/lib/utils';
import type { Resume, ResumeContent } from '@/types';

const EMPTY_CONTENT: ResumeContent = {
  summary: '',
  experience: [{ company: '', role: '', start: '', end: '', description: '' }],
  education: [{ school: '', degree: '', field: '', graduation: '' }],
  skills: [],
  projects: [],
  certifications: [],
};

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Resume | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchResumes();
      setResumes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const content = await parseResumeFile(file);
      if ((content.skills?.length ?? 0) === 0 && !content.summary) {
        throw new Error('Could not extract meaningful data from this file. Try a clearer PDF or text file.');
      }
      const label = file.name.replace(/\.(pdf|txt|md|rtf)$/i, '').slice(0, 50);
      const created = await createResume(label, content);
      setResumes((prev) => [created, ...prev]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFileUpload(file);
  };

  const handleSetPrimary = async (resume: Resume) => {
    setResumes((prev) => prev.map((r) => ({ ...r, is_primary: r.id === resume.id })));
    try {
      await updateResume(resume.id, { is_primary: true });
    } catch {
      load();
    }
  };

  const handleDelete = async (resume: Resume) => {
    setResumes((prev) => prev.filter((r) => r.id !== resume.id));
    try {
      await deleteResume(resume.id);
    } catch {
      load();
    }
  };

  const handleSave = async (label: string, content: ResumeContent, id?: string) => {
    if (id) {
      const updated = await updateResume(id, { label, content });
      setResumes((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } else {
      const created = await createResume(label, content);
      setResumes((prev) => [created, ...prev]);
    }
    setShowBuilder(false);
    setEditing(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="h-7 w-7 text-primary-600" /></div>;
  }

  if (error) {
    return (
      <EmptyState
        icon={FileText}
        title="Could not load resumes"
        description={error}
        action={<button onClick={load} className="btn-secondary">Try again</button>}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Resumes"
        subtitle="Create and manage ATS-friendly resume versions"
        actions={
          <button
            onClick={() => { setEditing(null); setShowBuilder(true); }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> New resume
          </button>
        }
      />

      {uploadError && (
        <div className="mb-4 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="ml-auto text-error-600 hover:text-error-800"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={classNames(
          'mb-6 rounded-2xl border-2 border-dashed p-8 text-center transition-all',
          dragActive ? 'border-primary-400 bg-primary-50/50' : 'border-secondary-200 bg-white hover:border-secondary-300'
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary-50 flex items-center justify-center">
            {uploading ? <Loader2 className="h-6 w-6 text-primary-600 animate-spin" /> : <FileUp className="h-6 w-6 text-primary-600" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-secondary-900">
              {uploading ? 'Parsing your resume…' : 'Upload your resume'}
            </p>
            <p className="text-xs text-secondary-500 mt-1">
              Drag and drop a PDF or text file, or click to browse. We'll extract your skills and match you to jobs.
            </p>
          </div>
          {!uploading && (
            <label className="btn-secondary cursor-pointer text-sm mt-1">
              <Upload className="h-4 w-4" /> Choose file
              <input
                type="file"
                accept=".pdf,.txt,.md,.rtf,application/pdf,text/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFileUpload(f); e.target.value = ''; }}
              />
            </label>
          )}
        </div>
      </div>

      {resumes.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FileText}
            title="No resumes yet"
            description="Create your first resume to start tailoring it for job applications. You can keep multiple versions for different roles."
            action={<button onClick={() => setShowBuilder(true)} className="btn-primary"><Plus className="h-4 w-4" /> Create resume</button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((resume) => (
            <div key={resume.id} className="card p-5 flex flex-col hover:shadow-cardhover transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">{resume.label}</h3>
                    <p className="text-xs text-secondary-400">{timeAgo(resume.updated_at)}</p>
                  </div>
                </div>
                {resume.is_primary && (
                  <span className="badge bg-primary-50 text-primary-700 border border-primary-200">
                    <Star className="h-3 w-3 fill-primary-500 text-primary-500" /> Primary
                  </span>
                )}
              </div>

              {/* Content preview */}
              <div className="text-sm text-secondary-600 space-y-1 mb-4 flex-1">
                {resume.content.summary && (
                  <p className="line-clamp-2">{resume.content.summary}</p>
                )}
                {resume.content.experience && resume.content.experience.length > 0 && (
                  <p className="text-xs text-secondary-400">{resume.content.experience.length} experience entries</p>
                )}
                {resume.content.skills && resume.content.skills.length > 0 && (
                  <p className="text-xs text-secondary-400">{resume.content.skills.length} skills</p>
                )}
              </div>

              {resume.ats_score !== null && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs text-secondary-500">ATS score:</span>
                  <span className={classNames(
                    'text-sm font-bold',
                    resume.ats_score >= 80 ? 'text-emerald-600' : resume.ats_score >= 60 ? 'text-amber-600' : 'text-rose-600'
                  )}>{resume.ats_score}/100</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-secondary-100">
                <button onClick={() => { setEditing(resume); setShowBuilder(true); }} className="btn-secondary flex-1 justify-center text-sm">
                  Edit
                </button>
                {!resume.is_primary && (
                  <button onClick={() => handleSetPrimary(resume)} className="btn-ghost text-sm px-3" title="Set as primary">
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => handleDelete(resume)} className="btn-ghost text-sm px-3 text-error-600 hover:bg-error-50" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showBuilder && (
        <ResumeBuilder
          resume={editing}
          onClose={() => { setShowBuilder(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function ResumeBuilder({
  resume,
  onClose,
  onSave,
}: {
  resume: Resume | null;
  onClose: () => void;
  onSave: (label: string, content: ResumeContent, id?: string) => Promise<void>;
}) {
  const [label, setLabel] = useState(resume?.label ?? 'General');
  const [content, setContent] = useState<ResumeContent>(resume?.content ?? EMPTY_CONTENT);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !content.skills?.includes(skill)) {
      setContent({ ...content, skills: [...(content.skills ?? []), skill] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setContent({ ...content, skills: content.skills?.filter((s) => s !== skill) });
  };

  const updateExperience = (i: number, field: string, value: string) => {
    const exp = [...(content.experience ?? [])];
    exp[i] = { ...exp[i], [field]: value };
    setContent({ ...content, experience: exp });
  };

  const addExperience = () => {
    setContent({ ...content, experience: [...(content.experience ?? []), { company: '', role: '', start: '', end: '', description: '' }] });
  };

  const removeExperience = (i: number) => {
    setContent({ ...content, experience: content.experience?.filter((_, idx) => idx !== i) });
  };

  const updateEducation = (i: number, field: string, value: string) => {
    const edu = [...(content.education ?? [])];
    edu[i] = { ...edu[i], [field]: value };
    setContent({ ...content, education: edu });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(label, content, resume?.id);
    } catch {
      // error handled by caller state
    } finally {
      setSaving(false);
    }
  };

  const exportText = () => {
    const lines: string[] = [];
    lines.push(label.toUpperCase());
    lines.push('');
    if (content.summary) { lines.push('SUMMARY'); lines.push(content.summary); lines.push(''); }
    if (content.experience?.length) {
      lines.push('EXPERIENCE');
      content.experience.forEach((e) => {
        lines.push(`${e.role} | ${e.company} | ${e.start} - ${e.end}`);
        if (e.description) lines.push(e.description);
        lines.push('');
      });
    }
    if (content.education?.length) {
      lines.push('EDUCATION');
      content.education.forEach((e) => {
        lines.push(`${e.degree} in ${e.field} | ${e.school} | ${e.graduation}`);
      });
      lines.push('');
    }
    if (content.skills?.length) { lines.push('SKILLS'); lines.push(content.skills.join(', ')); lines.push(''); }
    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${label.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white border-b border-secondary-100 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-semibold text-secondary-900">{resume ? 'Edit resume' : 'New resume'}</h2>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-900"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="label">Resume label</label>
            <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. General, Tech-focused, Leadership" />
          </div>

          <div>
            <label className="label">Professional summary</label>
            <textarea className="input min-h-[80px]" value={content.summary ?? ''} onChange={(e) => setContent({ ...content, summary: e.target.value })} placeholder="A brief professional summary…" />
          </div>

          {/* Experience */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Work experience</label>
              <button onClick={addExperience} className="text-sm font-medium text-primary-600 hover:text-primary-700"><Plus className="h-3.5 w-3.5 inline" /> Add</button>
            </div>
            <div className="space-y-3">
              {content.experience?.map((exp, i) => (
                <div key={i} className="rounded-xl border border-secondary-200 p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input text-sm" placeholder="Role" value={exp.role} onChange={(e) => updateExperience(i, 'role', e.target.value)} />
                    <input className="input text-sm" placeholder="Company" value={exp.company} onChange={(e) => updateExperience(i, 'company', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input text-sm" placeholder="Start (e.g. 2021)" value={exp.start} onChange={(e) => updateExperience(i, 'start', e.target.value)} />
                    <input className="input text-sm" placeholder="End (e.g. Present)" value={exp.end} onChange={(e) => updateExperience(i, 'end', e.target.value)} />
                  </div>
                  <textarea className="input text-sm min-h-[60px]" placeholder="Description of your work…" value={exp.description} onChange={(e) => updateExperience(i, 'description', e.target.value)} />
                  <button onClick={() => removeExperience(i)} className="text-xs text-error-600 hover:text-error-700"><Trash2 className="h-3 w-3 inline" /> Remove</button>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <label className="label">Education</label>
            <div className="space-y-3">
              {content.education?.map((edu, i) => (
                <div key={i} className="rounded-xl border border-secondary-200 p-3 space-y-2">
                  <input className="input text-sm" placeholder="School" value={edu.school} onChange={(e) => updateEducation(i, 'school', e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input text-sm" placeholder="Degree" value={edu.degree} onChange={(e) => updateEducation(i, 'degree', e.target.value)} />
                    <input className="input text-sm" placeholder="Field" value={edu.field} onChange={(e) => updateEducation(i, 'field', e.target.value)} />
                  </div>
                  <input className="input text-sm" placeholder="Graduation year" value={edu.graduation} onChange={(e) => updateEducation(i, 'graduation', e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="label">Skills</label>
            <div className="flex gap-2 mb-2">
              <input
                className="input text-sm"
                placeholder="Add a skill…"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              />
              <button onClick={addSkill} className="btn-secondary px-3"><Plus className="h-4 w-4" /></button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {content.skills?.map((skill) => (
                <span key={skill} className="badge bg-primary-50 text-primary-700 gap-1">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="hover:text-primary-900"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-secondary-100 px-5 py-3 flex items-center gap-2">
          <button onClick={exportText} className="btn-secondary flex-1 justify-center text-sm">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={handleSave} disabled={saving || !label.trim()} className="btn-primary flex-1 justify-center text-sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}
