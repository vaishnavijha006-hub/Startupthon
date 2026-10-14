import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { Loader2, ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';
import { useAdminAuth } from '@/services/adminAuth';
import HudCorners from '@/components/ui/HudCorners';

export function AdminRouteGuard() {
  const { user, isAdmin, loading, signOut } = useAdminAuth();
  const location = useLocation();

  // 1. Loading state: hold until initial Supabase session check completes
  // This prevents redirect loops and premature flashes of the login page on page refresh.
  if (loading) {
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center pt-24 pb-20">
        <div className="relative steel-panel p-8 text-center clip-angular sm:p-12 max-w-md w-full mx-4">
          <HudCorners className="absolute inset-0" />
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-laser-cyan mb-4" />
          <p className="font-display text-base font-semibold uppercase tracking-wider text-text-primary">
            Verifying Credentials
          </p>
          <p className="mt-2 text-xs font-mono text-text-secondary">
            Checking administrative security token...
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: redirect to Admin Login
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // 3. Authenticated but non-admin: reject access with a clear, safe screen
  if (!isAdmin) {
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 pt-24 pb-20">
        <div className="relative steel-panel p-8 text-center clip-angular sm:p-12 max-w-lg w-full">
          <HudCorners className="absolute inset-0" />
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-yellow-500/40 bg-yellow-500/10">
            <ShieldAlert className="h-8 w-8 text-yellow-400" />
          </div>

          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-text-primary">
            Access Denied
          </h1>

          <p className="mt-3 text-sm text-text-secondary">
            You are signed in as <span className="font-mono text-text-primary">{user.email}</span>, but your account does not possess administrative privileges.
          </p>

          <div className="mt-6 border border-yellow-500/20 bg-yellow-500/5 p-4 text-left">
            <p className="text-xs text-yellow-200/90 leading-relaxed">
              Administrative access is strictly restricted. Only users with the <code className="font-mono bg-bg-primary px-1 py-0.5 text-laser-cyan">role: &quot;admin&quot;</code> claim in their server-managed account metadata can access this terminal.
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => void signOut()}
              className="btn-laser inline-flex items-center justify-center gap-2 border border-red-500/40 bg-red-500/10 px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-wider text-red-300 hover:bg-red-500/20"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
            <a
              href="/"
              className="btn-laser inline-flex items-center justify-center gap-2 border border-gunmetal bg-bg-primary/50 px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary hover:border-metallic/40"
            >
              <ArrowLeft className="h-4 w-4" />
              Return Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated & Authorized: render protected dashboard
  return <Outlet />;
}

export default AdminRouteGuard;
