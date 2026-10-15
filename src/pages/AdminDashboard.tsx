import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, GraduationCap, RefreshCw, Users } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar, { type AdminView } from '@/components/admin/AdminSidebar';
import RegistrationsTable, { ShortlistBadge } from '@/components/admin/RegistrationsTable';
import SummaryCard from '@/components/admin/SummaryCard';
import { createAdminSketchUrl, loadAdminRegistrations, updateAdminShortlistStatus, type RegistrationDataset } from '@/services/adminRegistrationSource';
import type { DashboardRegistration, ShortlistStatus } from '@/types';
import { exportStudentRowsCsv } from '@/utils/export';
import {
  filterStudentRows,
  flattenRegistrations,
  sortStudentRows,
  summarizeRegistrations,
  type AcademicYearFilter,
  type SortDirection,
  type StudentSortField,
  type DomainFilter,
  type ReviewStatusFilter,
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
  const [domain, setDomain] = useState<DomainFilter>('all');
  const [reviewStatus, setReviewStatus] = useState<ReviewStatusFilter>('all');
  const [sortField, setSortField] = useState<StudentSortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [selectedRegistration, setSelectedRegistration] = useState<DashboardRegistration | null>(null);
  const [shortlistSaving, setShortlistSaving] = useState(false);
  const [shortlistError, setShortlistError] = useState<string | null>(null);

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

  const changeShortlistStatus = async (status: ShortlistStatus) => {
    if (!selectedRegistration?.databaseId) {
      setShortlistError('This record does not have a database ID and cannot be updated.');
      return;
    }

    setShortlistSaving(true);
    setShortlistError(null);
    const result = await updateAdminShortlistStatus(selectedRegistration.databaseId, status);
    if (!result.success) {
      setShortlistError(result.message);
      setShortlistSaving(false);
      return;
    }

    await refresh();
    setSelectedRegistration((current) => current ? { ...current, shortlistStatus: status } : current);
    setShortlistSaving(false);
  };

  const registrations = dataset?.status === 'available' ? dataset.registrations : EMPTY_REGISTRATIONS;
  const rows = useMemo(() => {
    const filtered = filterStudentRows(flattenRegistrations(registrations), query, year, domain, reviewStatus);
    return sortStudentRows(filtered, sortField, sortDirection);
  }, [registrations, query, year, domain, reviewStatus, sortField, sortDirection]);
  const summary = useMemo(() => summarizeRegistrations(registrations), [registrations]);

  const chooseSort = (field: StudentSortField) => {
    setSortDirection((current) => sortField === field && current === 'asc' ? 'desc' : 'asc');
    setSortField(field);
    setPage(1);
  };

  const unavailable = dataset?.status === 'unavailable';
  const hasFilters = Boolean(query) || year !== 'all' || domain !== 'all' || reviewStatus !== 'all';
  const emptyTitle = loadError ? 'Could not load registrations' : unavailable ? 'Registration data unavailable' : hasFilters ? 'No matching students' : 'No registrations yet';
  const emptyMessage = loadError
    ? 'Registration counts are unknown because the data source could not be reached. Retry to check again.'
    : unavailable
    ? dataset.message
    : hasFilters
      ? 'Try another search or academic-year filter.'
      : 'Submitted registrations will appear here after a successful registration.';

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
              <p className="font-semibold">Registration data unavailable</p>
              <p className="mt-1 text-xs leading-relaxed text-yellow-100/75">{dataset.message}</p>
            </div>
          )}

          {activeView === 'overview' ? (
            <>
              <section aria-label="Registration overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard icon={Users} label="Total Registrations" value={loading || unavailable || loadError ? '—' : summary.totalRegistrations} description={loading ? 'Loading registration data' : unavailable || loadError ? 'Registration data unavailable' : 'Submitted registration records'} />
                <SummaryCard icon={GraduationCap} label="First-Year Students" value={loading || unavailable || loadError ? '—' : summary.firstYearStudents} description="Participant count by academic year" />
                <SummaryCard icon={GraduationCap} label="Second-Year Students" value={loading || unavailable || loadError ? '—' : summary.secondYearStudents} description="Participant count by academic year" />
                <SummaryCard icon={GraduationCap} label="Third- and Fourth-Year Students" value={loading || unavailable || loadError ? '—' : summary.seniorStudents} description="Combined participant count" />
              </section>
              <section className="mt-8 border border-gunmetal bg-bg-secondary/40 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-laser-cyan/70">Registration workspace</p><h2 className="mt-2 font-display text-lg font-semibold uppercase tracking-wider text-text-primary">Student records</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">Review participant information, search the available registration dataset, and export records as CSV.</p></div>
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
                  <label className="block text-xs font-medium text-text-secondary">Search name, email, roll number, registration ID, or idea title
                    <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search students" className="mt-2 w-full border border-gunmetal bg-bg-primary/70 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-laser-cyan focus:outline-none" />
                  </label>
                  <label className="block text-xs font-medium text-text-secondary">Academic year
                    <select value={year} onChange={(event) => { setYear(event.target.value as AcademicYearFilter); setPage(1); }} className="mt-2 w-full border border-gunmetal bg-bg-primary px-3 py-2.5 text-sm text-text-primary focus:border-laser-cyan focus:outline-none">
                      <option value="all">All years</option><option value="1st Year">First year</option><option value="2nd Year">Second year</option><option value="3rd Year">Third year</option><option value="4th Year">Fourth year</option>
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-text-secondary">Domain
                    <select value={domain} onChange={(event) => { setDomain(event.target.value as DomainFilter); setPage(1); }} className="mt-2 w-full border border-gunmetal bg-bg-primary px-3 py-2.5 text-sm text-text-primary focus:border-laser-cyan focus:outline-none">
                      <option value="all">All domains</option><option value="ai">AI</option><option value="healthcare">Healthcare</option><option value="environment">Environment</option><option value="fintech">Fintech</option><option value="other">Other</option>
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-text-secondary">Review status
                    <select value={reviewStatus} onChange={(event) => { setReviewStatus(event.target.value as ReviewStatusFilter); setPage(1); }} className="mt-2 w-full border border-gunmetal bg-bg-primary px-3 py-2.5 text-sm text-text-primary focus:border-laser-cyan focus:outline-none">
                      <option value="all">All statuses</option><option value="pending">Pending</option><option value="shortlisted">Shortlisted</option><option value="rejected">Rejected</option>
                    </select>
                  </label>
                </div>
                <button type="button" onClick={() => exportStudentRowsCsv(rows)} disabled={loading || rows.length === 0} className="inline-flex items-center justify-center gap-2 border border-laser-cyan/40 bg-laser-cyan/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-laser-cyan hover:bg-laser-cyan/10 disabled:cursor-not-allowed disabled:opacity-40"><Download className="h-4 w-4" />Export CSV</button>
              </div>
              <p className="mb-3 text-xs text-text-secondary">CSV export includes the matching participant records and exactly three columns: Student Section, Student Roll Number, and Startup Idea Title.</p>
              {loading ? <div role="status" className="flex min-h-64 items-center justify-center border border-gunmetal bg-bg-secondary/30 text-sm text-text-secondary"><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Loading registrations…</div> : (
                <RegistrationsTable rows={rows} currentPage={page} pageSize={PAGE_SIZE} sortField={sortField} sortDirection={sortDirection} onSort={chooseSort} onSelect={(row) => setSelectedRegistration(row.registration)} onPageChange={setPage} emptyTitle={emptyTitle} emptyMessage={emptyMessage} />
              )}
            </section>
          )}
        </div>
      </div>

      {selectedRegistration && <RegistrationDetails registration={selectedRegistration} onClose={() => setSelectedRegistration(null)} onShortlistChange={changeShortlistStatus} shortlistSaving={shortlistSaving} shortlistError={shortlistError} />}
    </div>
  );
}

function RegistrationDetails({ registration, onClose, onShortlistChange, shortlistSaving, shortlistError }: { registration: DashboardRegistration; onClose: () => void; onShortlistChange: (status: ShortlistStatus) => void; shortlistSaving: boolean; shortlistError: string | null }) {
  const [sketchUrl, setSketchUrl] = useState<string | null>(null);
  const [sketchLoading, setSketchLoading] = useState(false);
  useEffect(() => {
    let active = true;
    const path = registration.idea.sketchFilePath;
    if (!path) { setSketchUrl(null); return; }
    setSketchLoading(true);
    void createAdminSketchUrl(path).then((url) => {
      if (active) setSketchUrl(url);
    }).finally(() => {
      if (active) setSketchLoading(false);
    });
    return () => { active = false; };
  }, [registration.idea.sketchFilePath]);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-bg-primary/80 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="registration-details-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto border border-gunmetal bg-bg-secondary p-5 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-gunmetal pb-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-laser-cyan/70">Participant record</p><h2 id="registration-details-title" className="mt-2 font-display text-xl font-bold uppercase tracking-wider text-text-primary">Registration details</h2></div><button type="button" onClick={onClose} className="border border-gunmetal px-3 py-2 text-xs text-text-secondary hover:border-laser-cyan/40 hover:text-laser-cyan">Close</button></div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><Detail label="Registration ID" value={registration.id ?? 'Not assigned'} /><Detail label="Registration date" value={formatDate(registration.createdAt)} /><Detail label="Team type" value={registration.teamType} /><Detail label="College" value="Not collected by current form" /></dl>
        <div className="mt-6 border border-gunmetal bg-bg-primary/40 p-4">
          <label htmlFor="shortlist-status" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">Shortlist status</label>
          <div className="mt-2 mb-3"><ShortlistBadge status={registration.shortlistStatus} /></div>
          <select id="shortlist-status" value={registration.shortlistStatus} disabled={shortlistSaving || !registration.databaseId} onChange={(event) => onShortlistChange(event.target.value as ShortlistStatus)} className="mt-2 w-full border border-gunmetal bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:border-laser-cyan focus:outline-none disabled:opacity-50 sm:max-w-xs">
            <option value="pending">Pending</option><option value="shortlisted">Shortlisted</option><option value="rejected">Rejected</option>
          </select>
          {shortlistSaving && <p role="status" className="mt-2 text-xs text-text-secondary">Saving shortlist status…</p>}
          {shortlistError && <p role="alert" className="mt-2 text-xs text-red-300">{shortlistError}</p>}
        </div>
        <h3 className="mt-7 font-display text-sm font-semibold uppercase tracking-wider text-laser-cyan">Participants</h3>
        <div className="mt-3 space-y-3">{registration.participants.map((participant, index) => <article key={`${participant.email}-${index}`} className="border border-gunmetal bg-bg-primary/40 p-4"><h4 className="font-semibold text-text-primary">{participant.fullName}</h4><dl className="mt-3 grid gap-x-5 gap-y-2 text-sm sm:grid-cols-2"><Detail label="Email" value={participant.email} /><Detail label="Phone" value={participant.phone} /><Detail label="Academic year" value={participant.academicYear} /><Detail label="Section" value={participant.section} /><Detail label="Roll number" value={participant.rollNumber || 'Not provided'} /></dl></article>)}</div>
        <h3 className="mt-7 font-display text-sm font-semibold uppercase tracking-wider text-laser-cyan">Startup idea</h3>
        <article className="mt-3 border border-gunmetal bg-bg-primary/40 p-4"><h4 className="font-semibold text-text-primary">{registration.idea.title}</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">{registration.idea.description}</p><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><Detail label="Domain" value={registration.idea.domain || 'Not specified'} /><Detail label="Prototype available" value={registration.idea.prototypeAvailable === null ? 'Not specified' : registration.idea.prototypeAvailable ? 'Yes' : 'No'} /></dl><div className="mt-4 text-sm"><p className="text-[10px] uppercase tracking-wider text-text-secondary">Sketch</p>{!registration.idea.sketchFilePath ? <p className="mt-1 text-text-primary">Not uploaded</p> : sketchUrl ? <a href={sketchUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-laser-cyan underline">Open private sketch</a> : <p role="status" className="mt-1 text-text-secondary">{sketchLoading ? 'Preparing secure link…' : 'Sketch is unavailable or access was denied.'}</p>}</div></article>
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
