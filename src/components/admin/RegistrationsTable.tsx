import { ArrowDown, ArrowUp, ArrowUpDown, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { StudentRegistrationRow, StudentSortField, SortDirection } from '@/utils/adminDashboard';
import { paginateItems } from '@/utils/adminDashboard';

interface RegistrationsTableProps {
  rows: StudentRegistrationRow[];
  currentPage: number;
  pageSize: number;
  sortField: StudentSortField;
  sortDirection: SortDirection;
  onSort: (field: StudentSortField) => void;
  onSelect: (row: StudentRegistrationRow) => void;
  onPageChange: (page: number) => void;
  emptyTitle: string;
  emptyMessage: string;
}

function RegistrationsTable({
  rows,
  currentPage,
  pageSize,
  sortField,
  sortDirection,
  onSort,
  onSelect,
  onPageChange,
  emptyTitle,
  emptyMessage,
}: RegistrationsTableProps) {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const visibleRows = paginateItems(rows, safePage, pageSize);
  const firstItem = rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastItem = Math.min(safePage * pageSize, rows.length);

  const sortButton = (label: string, field: StudentSortField) => {
    const active = sortField === field;
    const Icon = active ? (sortDirection === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <button type="button" onClick={() => onSort(field)} className="inline-flex items-center gap-2 text-left hover:text-text-primary">
        {label}<Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    );
  };

  return (
    <section aria-label="Registration results" className="overflow-hidden border border-gunmetal bg-bg-secondary/50">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gunmetal px-4 py-3 sm:px-5">
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-text-primary">Participant records</h2>
          <p className="mt-1 text-xs text-text-secondary">One row per participant; team members share a registration ID.</p>
        </div>
        <span className="font-mono text-xs text-text-secondary">{rows.length} {rows.length === 1 ? 'student' : 'students'}</span>
      </div>

      {rows.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gunmetal bg-bg-primary/60 text-text-secondary">
            <ArrowRight className="h-5 w-5 rotate-45" aria-hidden="true" />
          </div>
          <h3 className="font-display text-base font-semibold uppercase tracking-wider text-text-primary">{emptyTitle}</h3>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-text-secondary">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <p className="px-4 pt-3 text-[11px] text-text-secondary sm:px-5 lg:hidden">Swipe horizontally to view all fields.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left">
              <thead className="bg-bg-primary/50">
                <tr className="border-b border-gunmetal font-mono text-[10px] uppercase tracking-wider text-text-secondary">
                  <th className="px-4 py-3 font-medium">Registration ID</th>
                  <th className="px-4 py-3 font-medium" aria-sort={sortField === 'name' ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'}>{sortButton('Student', 'name')}</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">College · proposed</th>
                  <th className="px-4 py-3 font-medium" aria-sort={sortField === 'academicYear' ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'}>{sortButton('Academic year', 'academicYear')}</th>
                  <th className="px-4 py-3 font-medium" aria-sort={sortField === 'rollNumber' ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'}>{sortButton('Roll number', 'rollNumber')}</th>
                  <th className="px-4 py-3 font-medium" aria-sort={sortField === 'registeredAt' ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'}>{sortButton('Registration date', 'registeredAt')}</th>
                  <th className="px-4 py-3 text-right font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gunmetal/70">
                {visibleRows.map((row) => (
                  <tr key={row.key} className="transition-colors hover:bg-laser-cyan/[0.035]">
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{row.registration.id || 'Not assigned'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-text-primary">{row.participant.fullName}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{row.participant.email}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">Not collected</td>
                    <td className="px-4 py-3 text-sm text-text-primary">{row.participant.academicYear}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{row.participant.rollNumber || '—'}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{formatDate(row.registration.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => onSelect(row)} className="border border-laser-cyan/25 px-3 py-1.5 text-xs font-semibold text-laser-cyan transition-colors hover:bg-laser-cyan/10">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gunmetal px-4 py-3 sm:px-5">
            <p className="text-xs text-text-secondary">Showing {firstItem}–{lastItem} of {rows.length}</p>
            <div className="flex items-center gap-2">
              <button type="button" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)} aria-label="Previous page" className="inline-flex h-8 w-8 items-center justify-center border border-gunmetal text-text-secondary hover:border-laser-cyan/40 hover:text-laser-cyan disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-20 text-center font-mono text-xs text-text-secondary">Page {safePage} of {pageCount}</span>
              <button type="button" disabled={safePage >= pageCount} onClick={() => onPageChange(safePage + 1)} aria-label="Next page" className="inline-flex h-8 w-8 items-center justify-center border border-gunmetal text-text-secondary hover:border-laser-cyan/40 hover:text-laser-cyan disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </>
      )}
    </section>
  );
}

function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export default RegistrationsTable;
