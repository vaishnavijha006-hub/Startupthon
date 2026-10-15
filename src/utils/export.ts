import type { DashboardRegistration } from '@/types';
import type { StudentRegistrationRow } from './adminDashboard';

export const CSV_HEADERS = [
  'Student Section',
  'Student Roll Number',
  'Startup Idea Title',
] as const;

export function registrationsToCsv(registrations: DashboardRegistration[]): string {
  const rows: string[][] = [[...CSV_HEADERS]];

  for (const registration of registrations) {
    const ideaTitle = registration.idea?.title ?? '';

    for (const participant of registration.participants) {
      rows.push([
        participant.section ?? '',
        participant.rollNumber ?? '',
        ideaTitle,
      ]);
    }
  }

  return `\uFEFF${rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')}`;
}

export function exportRegistrationsCsv(registrations: DashboardRegistration[]): void {
  downloadCsv(registrationsToCsv(registrations));
}

export function studentRowsToCsv(rows: StudentRegistrationRow[]): string {
  const data = rows.map(({ registration, participant }) => [
    participant.section ?? '',
    participant.rollNumber ?? '',
    registration.idea?.title ?? '',
  ]);
  return `\uFEFF${[[...CSV_HEADERS], ...data].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')}`;
}

export function exportStudentRowsCsv(rows: StudentRegistrationRow[]): void {
  downloadCsv(studentRowsToCsv(rows));
}

function downloadCsv(csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'codezy-registrations.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function escapeCsvCell(value: string): string {
  const str = value == null ? '' : String(value);
  // Protect against spreadsheet formula injection (=, +, -, @, tab, CR, even with leading whitespace)
  const safeValue = /^[\s\t\r\n]*[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safeValue.replace(/"/g, '""')}"`;
}
