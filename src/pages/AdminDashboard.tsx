import { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Printer,
  Users,
  User,
  Users2,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  X,
  ShieldAlert,
  Filter,
} from 'lucide-react';
import HudCorners from '@/components/ui/HudCorners';
import { exportToCsv, registrationsToExportRows } from '@/utils/export';
import type { Registration, ShortlistStatus } from '@/types';

// Empty state — no fabricated records
const DEMO_REGISTRATIONS: Registration[] = [];

function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ShortlistStatus>('all');
  const [filterTeamType, setFilterTeamType] = useState<'all' | 'solo' | 'duo'>('all');
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);

  const registrations = DEMO_REGISTRATIONS;

  const filtered = useMemo(() => {
    return registrations.filter((reg) => {
      if (filterStatus !== 'all' && reg.shortlistStatus !== filterStatus) return false;
      if (filterTeamType !== 'all' && reg.teamType !== filterTeamType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchInParticipant = reg.participants.some(
          (p) =>
            p.fullName.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q) ||
            p.rollNumber.toLowerCase().includes(q),
        );
        const matchInIdea = reg.idea.title.toLowerCase().includes(q);
        if (!matchInParticipant && !matchInIdea) return false;
      }
      return true;
    });
  }, [registrations, searchQuery, filterStatus, filterTeamType]);

  const stats = useMemo(() => {
    return {
      total: registrations.length,
      solo: registrations.filter((r) => r.teamType === 'solo').length,
      duo: registrations.filter((r) => r.teamType === 'duo').length,
      shortlisted: registrations.filter((r) => r.shortlistStatus === 'shortlisted').length,
    };
  }, [registrations]);

  const handleExportCsv = () => {
    const rows = registrationsToExportRows(registrations);
    exportToCsv(rows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relative z-10 min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-px w-8 bg-laser-cyan/50" />
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-laser-cyan/70">
              Control Center
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-text-primary sm:text-4xl">
            Admin Dashboard
          </h1>
          <div className="mt-3 flex items-center gap-2 border border-yellow-500/20 bg-yellow-500/5 px-4 py-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-yellow-400" />
            <span className="text-xs text-yellow-200">
              Authentication and data backend pending. Dashboard shows an empty state — no fabricated records.
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Total Registrations" value={stats.total} />
          <StatCard icon={User} label="Solo Participants" value={stats.solo} />
          <StatCard icon={Users2} label="Duo Teams" value={stats.duo} />
          <StatCard icon={CheckCircle2} label="Shortlisted" value={stats.shortlisted} />
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, roll number, or idea..."
              className="w-full bg-bg-primary/50 py-2.5 pl-11 pr-4 text-text-primary placeholder:text-text-secondary/40 border border-gunmetal font-body text-sm transition-colors focus:border-laser-cyan focus:outline-none focus:shadow-[0_0_12px_rgba(0,229,255,0.15)] focus-visible:ring-2 focus-visible:ring-laser-cyan/30"
            />
          </div>

          {/* Export & Print */}
          <div className="flex gap-3">
            <button
              onClick={handleExportCsv}
              disabled={registrations.length === 0}
              className="btn-laser inline-flex items-center gap-2 border border-laser-cyan/50 bg-laser-cyan/10 px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-laser-cyan transition-all hover:bg-laser-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button
              onClick={handlePrint}
              disabled={registrations.length === 0}
              className="btn-laser inline-flex items-center gap-2 border border-metallic/30 bg-gunmetal/40 px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-text-primary transition-all hover:border-metallic/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-text-secondary">
            <Filter className="h-3.5 w-3.5" /> Filters:
          </div>
          {/* Status filter */}
          <div className="flex gap-2">
            {(['all', 'pending', 'shortlisted', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`border px-3 py-1.5 font-display text-xs uppercase tracking-wider transition-all ${
                  filterStatus === status
                    ? 'border-laser-cyan bg-laser-cyan/10 text-laser-cyan'
                    : 'border-gunmetal text-text-secondary hover:border-metallic/40'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-gunmetal" />
          {/* Team type filter */}
          <div className="flex gap-2">
            {(['all', 'solo', 'duo'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterTeamType(type)}
                className={`border px-3 py-1.5 font-display text-xs uppercase tracking-wider transition-all ${
                  filterTeamType === type
                    ? 'border-laser-cyan bg-laser-cyan/10 text-laser-cyan'
                    : 'border-gunmetal text-text-secondary hover:border-metallic/40'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Table or empty state */}
        {registrations.length === 0 ? (
          <EmptyState />
        ) : (
          <RegistrationsTable
            registrations={filtered}
            onSelectReg={setSelectedReg}
          />
        )}
      </div>

      {/* Detail modal */}
      {selectedReg && (
        <RegistrationDetail
          registration={selectedReg}
          onClose={() => setSelectedReg(null)}
        />
      )}
    </div>
  );
}

// === Stat Card ===
function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="relative steel-panel p-5 clip-angular">
      <HudCorners className="absolute inset-0" />
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center border border-laser-cyan/30 bg-laser-cyan/5 clip-angular-sm">
          <Icon className="h-6 w-6 text-laser-cyan" />
        </div>
        <div>
          <span className="block font-display text-2xl font-bold text-text-primary">{value}</span>
          <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">{label}</span>
        </div>
      </div>
    </div>
  );
}

// === Empty State ===
function EmptyState() {
  return (
    <div className="relative flex flex-col items-center justify-center border border-gunmetal bg-bg-secondary/30 py-20 clip-angular">
      <HudCorners className="absolute inset-0" />
      <div className="mb-4 flex h-16 w-16 items-center justify-center border border-gunmetal bg-bg-primary/50 clip-angular-sm">
        <FileText className="h-8 w-8 text-text-secondary" />
      </div>
      <h3 className="font-display text-lg font-semibold uppercase tracking-wider text-text-primary">
        No Registrations Yet
      </h3>
      <p className="mt-2 max-w-md text-center text-sm text-text-secondary">
        Once the backend is connected and registrations come in, they will appear here
        with full search, filtering, and shortlisting controls.
      </p>
    </div>
  );
}

// === Registrations Table ===
function RegistrationsTable({
  registrations,
  onSelectReg,
}: {
  registrations: Registration[];
  onSelectReg: (reg: Registration) => void;
}) {
  return (
    <div className="overflow-x-auto border border-gunmetal">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gunmetal bg-bg-secondary/60">
            <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-laser-cyan">Ref ID</th>
            <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-laser-cyan">Team</th>
            <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-laser-cyan">Participant(s)</th>
            <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-laser-cyan">Idea Title</th>
            <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-laser-cyan">Domain</th>
            <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-laser-cyan">Status</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((reg) => (
            <tr
              key={reg.id}
              onClick={() => onSelectReg(reg)}
              className="cursor-pointer border-b border-gunmetal/50 transition-colors hover:bg-laser-cyan/5"
            >
              <td className="px-4 py-3 font-mono text-xs text-text-secondary">{reg.id}</td>
              <td className="px-4 py-3">
                <span className={`border px-2 py-0.5 font-display text-xs uppercase ${
                  reg.teamType === 'solo'
                    ? 'border-laser-cyan/30 text-laser-cyan'
                    : 'border-laser-violet/30 text-laser-violet'
                }`}>
                  {reg.teamType}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-text-primary">
                {reg.participants.map((p) => p.fullName).join(', ')}
              </td>
              <td className="px-4 py-3 text-sm text-text-primary">{reg.idea.title}</td>
              <td className="px-4 py-3 text-sm text-text-secondary capitalize">{reg.idea.domain}</td>
              <td className="px-4 py-3">
                <StatusBadge status={reg.shortlistStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// === Status Badge ===
function StatusBadge({ status }: { status: ShortlistStatus }) {
  const config = {
    pending: { icon: Clock, label: 'Pending', class: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/5' },
    shortlisted: { icon: CheckCircle2, label: 'Shortlisted', class: 'border-green-500/30 text-green-400 bg-green-500/5' },
    rejected: { icon: XCircle, label: 'Rejected', class: 'border-red-500/30 text-red-400 bg-red-500/5' },
  };
  const { icon: Icon, label, class: cls } = config[status];
  return (
    <span className={`inline-flex items-center gap-1 border px-2 py-0.5 font-display text-xs uppercase ${cls}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

// === Registration Detail Modal ===
function RegistrationDetail({ registration, onClose }: { registration: Registration; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative steel-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto p-8 clip-angular"
        onClick={(e) => e.stopPropagation()}
      >
        <HudCorners className="absolute inset-0" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-text-secondary hover:text-laser-cyan"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 font-display text-2xl font-bold uppercase tracking-wider text-text-primary">
          Registration Details
        </h2>

        {/* Participants */}
        <div className="mb-6">
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-laser-cyan">
            Participants ({registration.teamType === 'solo' ? '1' : '2'})
          </h3>
          <div className="space-y-3">
            {registration.participants.map((p, i) => (
              <div key={i} className="border border-gunmetal bg-bg-primary/40 p-4">
                <p className="font-display text-base font-semibold text-text-primary">{p.fullName}</p>
                <div className="mt-2 grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
                  <span>Year: {p.academicYear}</span>
                  <span>Section: {p.section}</span>
                  <span>Roll: {p.rollNumber}</span>
                  <span>Phone: {p.phone}</span>
                  <span className="sm:col-span-2">Email: {p.email}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Idea */}
        <div className="mb-6">
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-laser-cyan">
            Startup Idea
          </h3>
          <div className="border border-gunmetal bg-bg-primary/40 p-4">
            <p className="font-display text-base font-semibold text-text-primary">{registration.idea.title}</p>
            <p className="mt-2 text-sm text-text-secondary">{registration.idea.description}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <span className="text-text-secondary">Domain: <span className="text-laser-cyan capitalize">{registration.idea.domain}</span></span>
              <span className="text-text-secondary">Prototype: <span className="text-laser-cyan">{registration.idea.prototypeAvailable ? 'Yes' : 'No'}</span></span>
            </div>
          </div>
        </div>

        {/* Sketch preview area */}
        <div className="mb-6">
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-laser-cyan">
            Uploaded Sketch / Blueprint
          </h3>
          <div className="flex min-h-32 items-center justify-center border border-dashed border-gunmetal bg-bg-primary/30 p-6">
            {registration.idea.sketchFileName ? (
              <div className="text-center">
                <FileText className="mx-auto mb-2 h-8 w-8 text-laser-cyan" />
                <p className="font-mono text-sm text-laser-cyan">{registration.idea.sketchFileName}</p>
                <p className="mt-1 text-xs text-text-secondary">Preview will render when file storage is connected</p>
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No sketch or blueprint uploaded.</p>
            )}
          </div>
        </div>

        {/* Shortlisting controls */}
        <div>
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-laser-cyan">
            Shortlisting Controls
          </h3>
          <div className="flex gap-3">
            <button className="flex-1 border border-green-500/30 bg-green-500/10 px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-green-400 transition-all hover:bg-green-500/20">
              <CheckCircle2 className="mr-1 inline h-4 w-4" /> Shortlist
            </button>
            <button className="flex-1 border border-red-500/30 bg-red-500/10 px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-red-400 transition-all hover:bg-red-500/20">
              <XCircle className="mr-1 inline h-4 w-4" /> Reject
            </button>
            <button className="flex-1 border border-yellow-500/30 bg-yellow-500/10 px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-yellow-400 transition-all hover:bg-yellow-500/20">
              <Clock className="mr-1 inline h-4 w-4" /> Reset
            </button>
          </div>
          <p className="mt-2 text-xs text-text-secondary">
            Shortlisting is non-functional until the backend is connected.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
