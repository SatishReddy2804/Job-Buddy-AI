import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Lock,
  AlertCircle,
  User,
  Check,
  X,
  ArrowRight,
  KeyRound,
  Phone,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';
import { Spinner } from '@/components/ui';
import {
  validateEmail,
  validatePassword,
  isPasswordValid,
  validatePhone,
  PASSWORD_RULES,
} from '@/lib/validation';

type Mode = 'signin' | 'signup';
type View = 'auth' | 'reset';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export default function AuthPage() {
  const { signIn, signUp, signInWithOAuth, resetPasswordForEmail, resetPasswordForPhone } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState<Mode>('signup');
  const [view, setView] = useState<View>('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetInfo, setResetInfo] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const resetDone = searchParams.get('reset') === 'done';

  const passwordChecks = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ label: rule.label, passed: rule.test(password) })),
    [password],
  );

  const showPasswordChecklist = mode === 'signup' && password.length > 0 && !isPasswordValid(password);

  const handleEmailBlur = () => {
    if (email) setEmailError(validateEmail(email));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (mode === 'signup' && value) {
      const err = validatePassword(value);
      setPasswordError(err);
    } else {
      setPasswordError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }

    if (mode === 'signup') {
      const pwErr = validatePassword(password);
      if (pwErr) {
        setPasswordError(pwErr);
        return;
      }
    } else {
      if (!password) {
        setPasswordError('Password is required.');
        return;
      }
    }

    setLoading(true);
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    navigate('/onboarding');
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError(null);
    setOauthLoading(provider);
    const result = await signInWithOAuth(provider);
    if (result.error) {
      setOauthLoading(null);
      setError(result.error);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetInfo(null);

    if (resetMethod === 'email') {
      const err = validateEmail(resetEmail);
      if (err) {
        setResetError(err);
        return;
      }
      setResetLoading(true);
      const result = await resetPasswordForEmail(resetEmail);
      setResetLoading(false);
      if (result.error) {
        setResetError(result.error);
        return;
      }
      setResetInfo('Password reset link sent! Check your email inbox (and spam folder) for instructions to reset your password.');
    } else {
      const err = validatePhone(resetPhone);
      if (err) {
        setResetError(err);
        return;
      }
      setResetLoading(true);
      const result = await resetPasswordForPhone(resetPhone);
      setResetLoading(false);
      if (result.error) {
        setResetError(result.error);
        return;
      }
      setResetInfo('A password reset code has been sent to your phone via SMS. Check your messages for instructions.');
    }
  };

  if (view === 'reset') {
    return (
      <div className="min-h-screen grid lg:grid-cols-2">
        {/* Left — reset form */}
        <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-white">
          <div className="mx-auto w-full max-w-sm">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-secondary-500 hover:text-secondary-900 mb-8 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
            <Logo size="lg" />
            <h1 className="mt-8 text-2xl font-bold text-secondary-900">Reset your password</h1>
            <p className="mt-2 text-sm text-secondary-500">
              Choose how you'd like to receive your password reset instructions.
            </p>

            {resetInfo && (
              <div className="mt-6 flex items-start gap-2 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 animate-fade-in">
                <Check className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{resetInfo}</span>
              </div>
            )}

            {resetError && (
              <div className="mt-6 flex items-start gap-2 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 animate-fade-in">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {/* Method toggle */}
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setResetMethod('email'); setResetError(null); setResetInfo(null); }}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium border transition-all ${
                  resetMethod === 'email'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-secondary-200 text-secondary-600 hover:bg-secondary-50'
                }`}
              >
                <Mail className="h-4 w-4 inline mr-1.5" /> Email
              </button>
              <button
                type="button"
                onClick={() => { setResetMethod('phone'); setResetError(null); setResetInfo(null); }}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium border transition-all ${
                  resetMethod === 'phone'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-secondary-200 text-secondary-600 hover:bg-secondary-50'
                }`}
              >
                <Phone className="h-4 w-4 inline mr-1.5" /> SMS
              </button>
            </div>

            <form onSubmit={handleReset} className="mt-4 space-y-4">
              {resetMethod === 'email' ? (
                <div>
                  <label className="label" htmlFor="reset-email">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="label" htmlFor="reset-phone">Phone number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      id="reset-phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      value={resetPhone}
                      onChange={(e) => setResetPhone(e.target.value)}
                      className="input pl-10"
                      placeholder="+1 555 123 4567"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-secondary-400">
                    Include your country code (e.g. +1 for US, +91 for India).
                  </p>
                </div>
              )}
              <button type="submit" disabled={resetLoading} className="btn-primary w-full py-3">
                {resetLoading ? <Spinner className="h-4 w-4" /> : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    Send reset {resetMethod === 'email' ? 'link' : 'code'}
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-secondary-500">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => { setView('auth'); setResetError(null); setResetInfo(null); }}
                className="font-semibold text-primary-600 hover:text-primary-700"
              >
                Back to sign in
              </button>
            </p>
          </div>
        </div>

        {/* Right — visual */}
        <AuthVisual />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — form */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-white">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-secondary-500 hover:text-secondary-900 mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <Logo size="lg" />
          <h1 className="mt-8 text-2xl font-bold text-secondary-900">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-2 text-sm text-secondary-500">
            {mode === 'signin'
              ? 'Sign in to continue your job search.'
              : 'Start applying to jobs on autopilot — free.'}
          </p>

          {resetDone && (
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 animate-fade-in">
              <Check className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Your password has been reset. You can now sign in with your new password.</span>
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 animate-fade-in">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* OAuth buttons */}
          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={oauthLoading !== null}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-secondary-200 bg-white px-4 py-2.5 text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition-all disabled:opacity-60"
            >
              {oauthLoading === 'google' ? <Spinner className="h-4 w-4" /> : <GoogleIcon className="h-5 w-5" />}
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('github')}
              disabled={oauthLoading !== null}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-secondary-200 bg-white px-4 py-2.5 text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition-all disabled:opacity-60"
            >
              {oauthLoading === 'github' ? <Spinner className="h-4 w-4" /> : <GitHubIcon className="h-5 w-5" />}
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-secondary-200" />
            <span className="text-xs font-medium text-secondary-400">OR</span>
            <div className="flex-1 h-px bg-secondary-200" />
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                  onBlur={handleEmailBlur}
                  className={`input pl-10 ${emailError ? 'border-error-400 focus:border-error-500 focus:ring-error-200' : ''}`}
                  placeholder="you@example.com or name@college.edu"
                />
              </div>
              {emailError && (
                <p className="mt-1.5 text-xs text-error-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" /> {emailError}
                </p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  id="password"
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`input pl-10 ${passwordError ? 'border-error-400 focus:border-error-500 focus:ring-error-200' : ''}`}
                  placeholder={mode === 'signup' ? 'Min 8 chars, 1 upper, 1 number, 1 special' : 'Your password'}
                />
              </div>
              {passwordError && mode === 'signup' && (
                <p className="mt-1.5 text-xs text-error-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" /> {passwordError}
                </p>
              )}

              {/* Password strength checklist */}
              {showPasswordChecklist && (
                <div className="mt-2.5 rounded-xl border border-secondary-200 bg-secondary-50/50 p-3 space-y-1.5 animate-fade-in">
                  <p className="text-xs font-semibold text-secondary-600 mb-1.5">Password requirements:</p>
                  {passwordChecks.map((check) => (
                    <div key={check.label} className="flex items-center gap-2 text-xs">
                      {check.passed ? (
                        <Check className="h-3.5 w-3.5 text-success-600 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-secondary-400 shrink-0" />
                      )}
                      <span className={check.passed ? 'text-success-700 line-through' : 'text-secondary-500'}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {mode === 'signin' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setView('reset'); setError(null); }}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" disabled={loading || (mode === 'signup' && !isPasswordValid(password) && password.length > 0)} className="btn-primary w-full py-3 disabled:opacity-60">
              {loading ? <Spinner className="h-4 w-4" /> : (
                <>
                  <User className="h-4 w-4" />
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-secondary-500">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
                setEmailError(null);
                setPasswordError(null);
                setPassword('');
              }}
              className="font-semibold text-primary-600 hover:text-primary-700"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      {/* Right — visual */}
      <AuthVisual />
    </div>
  );
}

function AuthVisual() {
  return (
    <div className="hidden lg:flex relative bg-gradient-to-br from-primary-700 via-primary-800 to-secondary-900 overflow-hidden">
      <div className="absolute top-20 right-20 h-72 w-72 rounded-full bg-primary-400/20 blur-3xl" />
      <div className="absolute bottom-20 left-10 h-72 w-72 rounded-full bg-accent-400/15 blur-3xl" />
      <div className="relative flex flex-col justify-center px-16 text-white">
        <h2 className="text-3xl font-bold leading-tight max-w-md">
          The AI agent that turns job seekers into high-velocity candidates.
        </h2>
        <div className="mt-10 space-y-5 max-w-md">
          {[
            'Apply to 100+ tailored jobs per day',
            'Every resume scores 90%+ on ATS compatibility',
            'Track your pipeline from discovery to offer',
            'AI interview prep and salary negotiation coaching',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-primary-50 text-sm">{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-12 flex items-center gap-4 text-sm text-primary-100">
          <div className="flex -space-x-2">
            {['A', 'J', 'S', 'M'].map((c) => (
              <div key={c} className="h-9 w-9 rounded-full bg-white/20 border-2 border-primary-700 flex items-center justify-center text-xs font-semibold text-white">
                {c}
              </div>
            ))}
          </div>
          <span>Trusted by thousands of job seekers</span>
        </div>
      </div>
    </div>
  );
}
