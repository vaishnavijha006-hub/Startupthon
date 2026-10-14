import { CircleUserRound, Menu, RefreshCw } from 'lucide-react';
import type { AdminView } from './AdminSidebar';

interface AdminHeaderProps {
  activeView: AdminView;
  loading: boolean;
  onMenuClick: () => void;
  onRefresh: () => void;
}

const TITLES: Record<AdminView, { eyebrow: string; title: string; description: string }> = {
  overview: {
    eyebrow: 'Control center',
    title: 'Overview',
    description: 'A clear view of the CodezY Startup Pitch registration workspace.',
  },
  registrations: {
    eyebrow: 'Student records',
    title: 'Registrations',
    description: 'Search and review participant details from the available registration dataset.',
  },
};

function AdminHeader({ activeView, loading, onMenuClick, onRefresh }: AdminHeaderProps) {
  const page = TITLES[activeView];

  return (
    <header className="mb-8 border-b border-gunmetal pb-6">
      <div className="mb-7 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open admin navigation"
          className="inline-flex h-10 w-10 items-center justify-center border border-gunmetal text-text-secondary hover:border-laser-cyan/40 hover:text-laser-cyan lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 border border-gunmetal px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-laser-cyan/40 hover:text-laser-cyan disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh data
        </button>

        <div className="ml-auto flex items-center gap-3 border-l border-gunmetal pl-4">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-text-primary">Admin area</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-yellow-400">Preview only</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center border border-laser-cyan/30 bg-laser-cyan/5 text-laser-cyan">
            <CircleUserRound className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-laser-cyan/70">{page.eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-wider text-text-primary sm:text-4xl">{page.title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-text-secondary">{page.description}</p>
    </header>
  );
}

export default AdminHeader;
