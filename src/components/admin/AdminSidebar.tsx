import { Link } from 'react-router-dom';
import { Activity, ClipboardList, LayoutDashboard, X } from 'lucide-react';
import { Logo } from '@/components/Logo';

export type AdminView = 'overview' | 'registrations';

interface AdminSidebarProps {
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function AdminSidebar({ activeView, onViewChange, mobileOpen, onMobileClose }: AdminSidebarProps) {
  const navigation = (
    <nav aria-label="Admin navigation" className="space-y-2">
      {([
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'registrations', label: 'Registrations', icon: ClipboardList },
      ] as const).map(({ id, label, icon: Icon }) => {
        const active = activeView === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              onViewChange(id);
              onMobileClose();
            }}
            aria-current={active ? 'page' : undefined}
            className={`flex w-full items-center gap-3 border px-4 py-3 text-left font-display text-sm font-semibold tracking-wide transition-colors ${
              active
                ? 'border-laser-cyan/40 bg-laser-cyan/10 text-laser-cyan'
                : 'border-transparent text-text-secondary hover:border-gunmetal hover:bg-bg-primary/50 hover:text-text-primary'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-laser-cyan" />}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-64 shrink-0 flex-col border border-gunmetal bg-bg-secondary/70 p-4 lg:flex">
        <SidebarBrand />
        <p className="mb-3 mt-9 px-4 font-mono text-[10px] uppercase tracking-[0.24em] text-text-secondary/70">
          Workspace
        </p>
        {navigation}
        <SidebarFooter />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close admin navigation"
            className="absolute inset-0 h-full w-full bg-bg-primary/80 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <aside className="relative flex h-full w-[min(20rem,85vw)] flex-col border-r border-gunmetal bg-bg-secondary p-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <SidebarBrand />
              <button type="button" onClick={onMobileClose} aria-label="Close navigation" className="p-2 text-text-secondary hover:text-laser-cyan">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 mt-9 px-4 font-mono text-[10px] uppercase tracking-[0.24em] text-text-secondary/70">
              Workspace
            </p>
            {navigation}
            <SidebarFooter />
          </aside>
        </div>
      )}
    </>
  );
}

function SidebarBrand() {
  return (
    <Link to="/" className="flex items-center gap-3 px-3 py-2" aria-label="CodezY home">
      <Logo className="h-9 w-9" />
      <span>
        <span className="block font-display text-sm font-bold uppercase tracking-wider text-text-primary">CodezY</span>
        <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-laser-cyan/70">Admin workspace</span>
      </span>
    </Link>
  );
}

function SidebarFooter() {
  return (
    <div className="mt-auto border-t border-gunmetal px-3 pt-5">
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        <Activity className="h-3.5 w-3.5 text-yellow-400" aria-hidden="true" />
        Frontend preview · data offline
      </div>
      <Link to="/" className="mt-4 inline-block text-xs text-text-secondary transition-colors hover:text-laser-cyan">
        View public site ↗
      </Link>
    </div>
  );
}

export default AdminSidebar;
