import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, GraduationCap, RefreshCw, Users } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar, { type AdminView } from '@/components/admin/AdminSidebar';
import RegistrationsTable from '@/components/admin/RegistrationsTable';
import SummaryCard from '@/components/admin/SummaryCard';
import { loadAdminRegistrations, type RegistrationDataset } from '@/services/adminRegistrationSource';
import type { DashboardRegistration } from '@/types';
import { exportRegistrationsCsv } from '@/utils/export';
import {
  filterStudentRows,
  flattenRegistrations,
  sortStudentRows,
  summarizeRegistrations,
  type AcademicYearFilter,
  type SortDirection,
  type StudentSortField,
} from '@/utils/adminDashboard';

const PAGE_SIZE = 10;
const EMPTY_REGISTRATIONS: DashboardRegistration[] = [];

function AdminDashboard() {
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dataset, setDataset] = useState<RegistrationDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [year, setYear] = useState<AcademicYearFilter>('all');
  const [sortField, setSortField] = useState<StudentSortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [selectedRegistration, setSelectedRegistration] = useState<DashboardRegistration | null>(null);

  const refresh = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setDataset(await loadAdminRegistrations());
    } catch {
      setLoadError('Registration data could not be loaded. Please try again.');
      setDataset(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const registrations = dataset?.status === 'available' ? dataset.registrations : EMPTY_REGISTRATIONS;
  const rows = useMemo(() => {
    const filtered = filterStudentRows(flattenRegistrations(registrations), query, year);
    return sortStudentRows(filtered, sortField, sortDirection);
  }, [registrations, query, year, sortField, sortDirection]);
  const summary = useMemo(() => summarizeRegistrations(registrations), [registrations]);

  const chooseSort = (field: StudentSortField) => {
    setSortDirection((current) => sortField === field && current === 'asc' ? 'desc' : 'asc');
    setSortField(field);
    setPage(1);
  };

  const unavailable = dataset?.status === 'unavailable';
  const emptyTitle = loadError ? 'Could not load registrations' : unavailable ? 'Registration data unavailable' : query || year !== 'all' ? 'No matching students' : 'No registrations yet';
  const emptyMessage = loadError
    ? 'Registration counts are unknown because the data source could not be reached. Retry to check again.'
    : unavailable
    ? dataset.message
    : query || year !== 'all'
      ? 'Try another search or academic-year filter.'
      : 'Submitted registrations will appear here when a data source is connected.';

  return (
    <div className="min-h-screen px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] gap-6">
        <AdminSidebar activeView={activeView} onViewChange={setActiveView} mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
        <div className="min-w-0 flex-1">
          <AdminHeader activeView={activeView} loading={loading} onMenuClick={() => setMobileMenuOpen(true)} onRefresh={() => void refresh()} />

          {loadError && (
            <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-200">
              <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" />{loadError}</span>
              <button type="button" onClick={() => void refresh()} className="inline-flex items-center gap-2 border border-red-500/30 px-3 py-2 text-xs hover:bg-red-500/10"><RefreshCw className="h-3.5 w-3.5" />Retry</button>
            </div>
          )}

          {unavailable && !loadError && (
            <div role="status" className="mb-6 border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-100">
              <p className="font-semibold">Frontend preview · no registration source connected</p>
              <p className="mt-1 text-xs leading-relaxed text-yellow-100/75">Counts and records are unavailable until the backend is implemented. This dashboard does not use demo registrations or provide authentication.</p>
            </div>
          )}

          {activeView === 'overview' ? (
            <>
              <section aria-label="Registration overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard icon={Users} label="Total Registrations" value={loading || unavailable || loadError ? '—' : summary.totalRegistrations} description={loading ? 'Loading registration data' : unavailable || loadError ? 'Unavailable until data source is connected' : 'Submitted registration records'} />
                <SummaryCard icon={GraduationCap} label="First-Year Students" value={loading || unavailable || loadError ? '—' : summary.firstYearStudents} description="Participant count by academic year" />
                <SummaryCard icon={GraduationCap} label="Second-Year Students" value={loading || unavailable || loadError ? '—' : summary.secondYearStudents} description="Participant count by academic year" />
                <SummaryCard icon={GraduationCap} label="Third- and Fourth-Year Students" value={loading || unavailable || loadError ? '—' : summary.seniorStudents} description="Combined participant count" />
              </section>
              <section className="mt-8 border border-gunmetal bg-bg-secondary/40 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-laser-cyan/70">Registration workspace</p><h2 className="mt-2 font-display text-lg font-semibold uppercase tracking-wider text-text-primary">Student records</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">Review participant information, search the available dataset, and export records as CSV when a data source is connected.</p></div>
                  <button type="button" onClick={() => setActiveView('registrations')} className="border border-laser-cyan/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-laser-cyan transition-colors hover:bg-laser-cyan/10">Open registrations</button>
                </div>
                {loading ? <p className="mt-6 border-t border-gunmetal pt-5 text-sm text-text-secondary">Loading registration data…</p> : (
                  <p className="mt-6 border-t border-gunmetal pt-5 text-sm text-text-secondary">{unavailable || loadError ? 'No registration records are currently available.' : `${rows.length} participant records are available.`}</p>
                )}
              </section>
            </>
          ) : (
            <section aria-label="Registrations">
              <div className="mb-5 flex flex-col gap-3 border border-gunmetal bg-bg-secondary/40 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-text-secondary">Search name, email, or roll number
                    <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search students" className="mt-2 w-full border border-gunmetal bg-bg-primary/70 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-laser-cyan focus:outline-none" />
                  </label>
                  <label className="block text-xs font-medium text-text-secondary">Academic year
                    <select value={year} onChange={(event) => { setYear(event.target.value as AcademicYearFilter); setPage(1); }} className="mt-2 w-full border border-gunmetal bg-bg-primary px-3 py-2.5 text-sm text-text-primary focus:border-laser-cyan focus:outline-none">
                      <option value="all">All years</option><option value="1st Year">First year</option><option value="2nd Year">Second year</option><option value="3rd Year">Third year</option><option value="4th Year">Fourth year</option>
                    </select>
                  </label>
                </div>
                <button type="button" onClick={() => exportRegistrationsCsv(registrations)} disabled={loading || registrations.length === 0} className="inline-flex items-center justify-center gap-2 border border-laser-cyan/40 bg-laser-cyan/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-laser-cyan hover:bg-laser-cyan/10 disabled:cursor-not-allowed disabled:opacity-40"><Download className="h-4 w-4" />Export CSV</button>
              </div>
              <p className="mb-3 text-xs text-text-secondary">CSV export contains the currently available frontend dataset. College is not collected by the current form and is marked as not collected.</p>
              {loading ? <div role="status" className="flex min-h-64 items-center justify-center border border-gunmetal bg-bg-secondary/30 text-sm text-text-secondary"><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Loading registrations…</div> : (
                <RegistrationsTable rows={rows} currentPage={page} pageSize={PAGE_SIZE} sortField={sortField} sortDirection={sortDirection} onSort={chooseSort} onSelect={(row) => setSelectedRegistration(row.registration)} onPageChange={setPage} emptyTitle={emptyTitle} emptyMessage={emptyMessage} />
              )}
            </section>
          )}
        </div>
      </div>

      {selectedRegistration && <RegistrationDetails registration={selectedRegistration} onClose={() => setSelectedRegistration(null)} />}
    </div>
  );
}

function RegistrationDetails({ registration, onClose }: { registration: DashboardRegistration; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-bg-primary/80 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="registration-details-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto border border-gunmetal bg-bg-secondary p-5 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-gunmetal pb-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-laser-cyan/70">Participant record</p><h2 id="registration-details-title" className="mt-2 font-display text-xl font-bold uppercase tracking-wider text-text-primary">Registration details</h2></div><button type="button" onClick={onClose} className="border border-gunmetal px-3 py-2 text-xs text-text-secondary hover:border-laser-cyan/40 hover:text-laser-cyan">Close</button></div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><Detail label="Registration ID" value={registration.id ?? 'Not assigned'} /><Detail label="Registration date" value={formatDate(registration.createdAt)} /><Detail label="Team type" value={registration.teamType} /><Detail label="College" value="Not collected by current form" /></dl>
        <h3 className="mt-7 font-display text-sm font-semibold uppercase tracking-wider text-laser-cyan">Participants</h3>
        <div className="mt-3 space-y-3">{registration.participants.map((participant, index) => <article key={`${participant.email}-${index}`} className="border border-gunmetal bg-bg-primary/40 p-4"><h4 className="font-semibold text-text-primary">{participant.fullName}</h4><dl className="mt-3 grid gap-x-5 gap-y-2 text-sm sm:grid-cols-2"><Detail label="Email" value={participant.email} /><Detail label="Phone" value={participant.phone} /><Detail label="Academic year" value={participant.academicYear} /><Detail label="Section" value={participant.section} /><Detail label="Roll number" value={participant.rollNumber || 'Not provided'} /></dl></article>)}</div>
        <h3 className="mt-7 font-display text-sm font-semibold uppercase tracking-wider text-laser-cyan">Startup idea</h3>
        <article className="mt-3 border border-gunmetal bg-bg-primary/40 p-4"><h4 className="font-semibold text-text-primary">{registration.idea.title}</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">{registration.idea.description}</p><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><Detail label="Domain" value={registration.idea.domain || 'Not specified'} /><Detail label="Prototype available" value={registration.idea.prototypeAvailable === null ? 'Not specified' : registration.idea.prototypeAvailable ? 'Yes' : 'No'} /><Detail label="Sketch filename" value={registration.idea.sketchFileName ?? 'Not uploaded'} /></dl></article>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-[10px] uppercase tracking-wider text-text-secondary">{label}</dt><dd className="mt-1 break-words text-text-primary">{value}</dd></div>;
}

function formatDate(value?: string): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date) : 'Not available';
}

export default AdminDashboard;
