import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ChevronRight, Loader2, ShieldAlert } from 'lucide-react';
import HudCorners from '@/components/ui/HudCorners';
import { Logo } from '@/components/Logo';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = 'Enter a valid email address';
    if (!password.trim()) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    // Backend authentication not yet implemented
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitError('Admin authentication is not yet connected. Backend integration is required before login can function.');
    }, 600);
  };

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo className="h-12 w-12" />
          <div className="text-center">
            <h1 className="font-display text-xl font-bold uppercase tracking-wider text-text-primary">
              CodezY Admin
            </h1>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-laser-cyan/70">
              Secure Access Terminal
            </p>
          </div>
        </div>

        <div className="relative steel-panel p-8 clip-angular">
          <HudCorners className="absolute inset-0" />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="mb-2 block font-display text-sm font-medium uppercase tracking-wider text-text-secondary">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@codezy.edu"
                  className={`w-full bg-bg-primary/50 py-3 pl-11 pr-4 text-text-primary placeholder:text-text-secondary/40 border ${
                    errors.email ? 'border-red-500/50' : 'border-gunmetal'
                  } font-body text-sm transition-colors focus:border-laser-cyan focus:outline-none focus:shadow-[0_0_12px_rgba(0,229,255,0.15)]`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="h-3 w-3" /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block font-display text-sm font-medium uppercase tracking-wider text-text-secondary">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full bg-bg-primary/50 py-3 pl-11 pr-11 text-text-primary placeholder:text-text-secondary/40 border ${
                    errors.password ? 'border-red-500/50' : 'border-gunmetal'
                  } font-body text-sm transition-colors focus:border-laser-cyan focus:outline-none focus:shadow-[0_0_12px_rgba(0,229,255,0.15)]`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-laser-cyan"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="h-3 w-3" /> {errors.password}
                </p>
              )}
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="flex items-start gap-3 border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
                <ShieldAlert className="h-5 w-5 shrink-0 text-yellow-400" />
                <span className="text-sm text-yellow-200">{submitError}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-laser flex w-full items-center justify-center gap-2 border border-laser-cyan/50 bg-laser-cyan/10 px-6 py-3 font-display text-base font-semibold uppercase tracking-wider text-laser-cyan transition-all hover:bg-laser-cyan/20 hover:shadow-[0_0_24px_rgba(0,229,255,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Authenticating...</>
              ) : (
                <>Access Dashboard <ChevronRight className="h-5 w-5" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="font-mono text-xs uppercase tracking-wider text-text-secondary hover:text-laser-cyan">
              ← Return to main site
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center font-mono text-xs text-text-secondary">
          Authentication backend pending. This interface is prepared for integration.
        </p>
      </div>
    </div>
  );
}

export default AdminLogin;
