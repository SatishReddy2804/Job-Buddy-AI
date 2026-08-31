import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Brain,
  FileText,
  LineChart,
  Shield,
  Sparkles,
  Target,
  Zap,
  Check,
  Briefcase,
  BarChart3,
  KanbanSquare,
  MessageSquare,
} from 'lucide-react';
import { Logo } from '@/components/Logo';

const features = [
  {
    icon: Bot,
    title: 'Autonomous Application Agent',
    description: 'From job discovery to submission, Job Buddy applies end-to-end with zero manual effort — while keeping you in control.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Job Matching',
    description: 'Hybrid semantic + rule-based matching scores every job 0–100 against your profile, with transparent gap analysis.',
  },
  {
    icon: FileText,
    title: 'ATS-Optimized Resumes',
    description: 'Every resume and cover letter is dynamically tailored to mirror job description keywords and pass 50+ ATS systems.',
  },
  {
    icon: KanbanSquare,
    title: 'Application Pipeline',
    description: 'A drag-and-drop Kanban board tracks every application from discovered to offer, with status auto-detection.',
  },
  {
    icon: MessageSquare,
    title: 'Interview Coaching',
    description: 'Role-specific question banks, AI mock interviews, and salary negotiation scripts powered by market data.',
  },
  {
    icon: LineChart,
    title: 'Analytics & Insights',
    description: 'Funnel metrics, A/B testing insights, and benchmark comparisons show exactly what is working and what is not.',
  },
];

const steps = [
  { icon: Target, title: 'Build your profile', description: 'Upload your resume, set target roles, and define preferences in a guided wizard.' },
  { icon: Sparkles, title: 'Get matched', description: 'AI scores jobs against your profile and ranks them by fit, urgency, and desirability.' },
  { icon: Zap, title: 'Apply with one click', description: 'Review-then-apply or go fully autonomous — your tailored docs are ready instantly.' },
  { icon: BarChart3, title: 'Track & optimize', description: 'Watch your pipeline, get interview prep, and refine your strategy with real analytics.' },
];

const pricing = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['10 job matches / day', '5 applications / week', 'Basic resume builder', '30-day analytics'],
    cta: 'Get started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/ month',
    features: ['Unlimited matches', '100 applications / week', 'Full ATS tailoring', 'Interview prep', 'Browser extension'],
    cta: 'Start 7-day trial',
    highlight: true,
  },
  {
    name: 'Premium',
    price: '$59',
    period: '/ month',
    features: ['Everything in Pro', 'Unlimited applications', 'Salary negotiation coach', 'Referral automation', 'API access'],
    cta: 'Go Premium',
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-secondary-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Logo />
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-secondary-600">
              <a href="#features" className="hover:text-secondary-900 transition-colors">Features</a>
              <a href="#how" className="hover:text-secondary-900 transition-colors">How it works</a>
              <a href="#pricing" className="hover:text-secondary-900 transition-colors">Pricing</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link to="/auth" className="btn-ghost hidden sm:inline-flex">Sign in</Link>
              <Link to="/auth" className="btn-primary">Get started <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/60 via-white to-white" />
        <div className="absolute top-20 -right-20 h-72 w-72 rounded-full bg-primary-200/30 blur-3xl" />
        <div className="absolute top-40 -left-20 h-72 w-72 rounded-full bg-accent-200/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700 mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4" /> Your AI job application agent
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-secondary-900 leading-[1.1] animate-slide-up">
              Land your next job
              <span className="block bg-gradient-to-r from-primary-600 to-emerald-500 bg-clip-text text-transparent">
                on autopilot
              </span>
            </h1>
            <p className="mt-6 text-lg text-secondary-600 max-w-2xl mx-auto animate-slide-up">
              Job Buddy discovers, tailors, applies, and tracks job applications end-to-end.
              Turn yourself into a high-velocity candidate with 10x application speed — without losing personalization.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up">
              <Link to="/auth" className="btn-primary text-base px-7 py-3">
                Start applying for free <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how" className="btn-secondary text-base px-7 py-3">See how it works</a>
            </div>
            <p className="mt-4 text-xs text-secondary-400">No credit card required · Free tier forever</p>
          </div>

          {/* Hero preview card */}
          <div className="mt-16 mx-auto max-w-5xl animate-scale-in">
            <div className="card overflow-hidden shadow-glow">
              <div className="flex items-center gap-2 border-b border-secondary-100 px-4 py-3 bg-secondary-50/50">
                <div className="h-3 w-3 rounded-full bg-rose-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs text-secondary-400 font-medium">jobbuddy.app/dashboard</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gradient-to-br from-white to-secondary-50/50">
                {[
                  { label: 'Matched', count: 24, color: 'text-primary-600' },
                  { label: 'Applied', count: 18, color: 'text-blue-600' },
                  { label: 'Interviews', count: 6, color: 'text-violet-600' },
                  { label: 'Offers', count: 2, color: 'text-emerald-600' },
                ].map((stat) => (
                  <div key={stat.label} className="card p-4">
                    <p className="text-xs font-medium text-secondary-500">{stat.label}</p>
                    <p className={`mt-1 text-3xl font-bold ${stat.color}`}>{stat.count}</p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-secondary-100">
                      <div className={`h-full rounded-full ${stat.color.replace('text', 'bg')} opacity-80`} style={{ width: `${(stat.count / 24) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  {[
                    { company: 'Vercel', role: 'Senior Frontend Engineer', score: 92, mode: 'Remote' },
                    { company: 'Stripe', role: 'Full-Stack Engineer', score: 87, mode: 'Hybrid' },
                  ].map((job) => (
                    <div key={job.company} className="card p-4 flex items-center gap-4 hover:shadow-cardhover transition-shadow">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-secondary-700 to-secondary-900 flex items-center justify-center text-white font-bold text-sm">
                        {job.company.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-secondary-900 text-sm truncate">{job.role}</p>
                        <p className="text-xs text-secondary-500">{job.company} · {job.mode}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-emerald-600">{job.score}</span>
                        <span className="text-[10px] text-secondary-400 font-medium">match</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-secondary-100 bg-secondary-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: '100+', label: 'Tailored applications / day' },
              { value: '90%+', label: 'ATS compatibility score' },
              { value: '50+', label: 'Job sources aggregated' },
              { value: '10x', label: 'Application velocity' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-primary-600">{stat.value}</p>
                <p className="mt-1 text-sm text-secondary-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary-900">Everything you need to job hunt at scale</h2>
          <p className="mt-4 text-secondary-600">From discovery to offer, one platform handles the entire process intelligently.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card p-6 hover:shadow-cardhover transition-all duration-300 hover:-translate-y-0.5 group">
              <div className="h-12 w-12 rounded-xl bg-primary-50 group-hover:bg-primary-100 transition-colors flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900">{f.title}</h3>
              <p className="mt-2 text-sm text-secondary-600 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-secondary-900 text-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">How it works</h2>
            <p className="mt-4 text-secondary-300">Four steps from sign-up to offer.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="h-14 w-14 rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center mb-4">
                  <step.icon className="h-7 w-7 text-primary-400" />
                </div>
                <p className="text-xs font-bold text-primary-400 mb-1">STEP {i + 1}</p>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-secondary-300 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary-900">Simple, transparent pricing</h2>
          <p className="mt-4 text-secondary-600">Start free. Upgrade when you are ready to go full throttle.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pricing.map((plan) => (
            <div
              key={plan.name}
              className={`card p-8 relative ${plan.highlight ? 'ring-2 ring-primary-500 shadow-glow' : ''}`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <p className="text-sm font-semibold text-secondary-500">{plan.name}</p>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-secondary-900">{plan.price}</span>
                <span className="text-sm text-secondary-500">{plan.period}</span>
              </p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-secondary-700">
                    <Check className="h-4 w-4 text-primary-600 mt-0.5 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                className={`mt-8 w-full ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 px-8 py-16 text-center shadow-glow">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-accent-400/20 blur-2xl" />
          <Briefcase className="h-12 w-12 text-white/90 mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to 10x your job search?</h2>
          <p className="mt-4 text-primary-100 max-w-xl mx-auto">Join thousands of candidates who let AI handle the grind while they focus on interviews.</p>
          <Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-base font-semibold text-primary-700 hover:bg-primary-50 transition-colors">
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-secondary-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo />
            <div className="flex items-center gap-6 text-sm text-secondary-500">
              <a href="#features" className="hover:text-secondary-900">Features</a>
              <a href="#pricing" className="hover:text-secondary-900">Pricing</a>
              <Link to="/auth" className="hover:text-secondary-900">Sign in</Link>
            </div>
            <div className="flex items-center gap-2 text-sm text-secondary-400">
              <Shield className="h-4 w-4" /> GDPR & CCPA compliant
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-secondary-400">© {new Date().getFullYear()} Job Buddy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
