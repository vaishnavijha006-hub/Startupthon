import type { DashboardRegistration } from '@/types';
import type { StudentRegistrationRow } from './adminDashboard';

export const CSV_HEADERS = [
  'Student Section',
  'Student Roll Number',
  'Startup Idea Title',
] as const;

/**
 * Wraps a numeric-looking string so that Excel keeps it as text.
 *
 * Excel auto-converts long digit strings (e.g. 13-digit roll numbers)
 * into scientific notation even when the CSV cell is quoted.
 * The only reliable in-CSV workaround is to emit the cell as a
 * formula literal  ="2403330100134"  which Excel evaluates as text.
 *
 * Non-numeric values and empty strings are returned unchanged.
 */
function excelSafeRollNumber(value: string): string {
  const v = value ?? '';
  // Only apply the formula trick to pure-digit strings of 10+ chars
  // (shorter numbers aren't at risk of scientific-notation conversion).
  if (/^\d{10,}$/.test(v)) {
    return `="${v}"`;
  }
  return v;
}

export function registrationsToCsv(registrations: DashboardRegistration[]): string {
  const rows: string[][] = [[...CSV_HEADERS]];

  for (const registration of registrations) {
    const ideaTitle = registration.idea?.title ?? '';

    for (const participant of registration.participants) {
      rows.push([
        participant.section ?? '',
        excelSafeRollNumber(participant.rollNumber ?? ''),
        ideaTitle,
      ]);
    }
  }

  return serializeCsvRows(rows);
}

export function exportRegistrationsCsv(registrations: DashboardRegistration[]): void {
  downloadCsv(registrationsToCsv(registrations), 'codezy-registrations.csv');
}

export function studentRowsToCsv(rows: StudentRegistrationRow[]): string {
  const data = rows.map(({ registration, participant }) => [
    participant.section ?? '',
    excelSafeRollNumber(participant.rollNumber ?? ''),
    registration.idea?.title ?? '',
  ]);
  return serializeCsvRows([[...CSV_HEADERS], ...data]);
}

function serializeCsvRows(rows: string[][]): string {
  return `\uFEFF${rows.map((row) => row.map((cell, index) => {
    // Quote and escape the Excel text formula as a normal RFC 4180 CSV field.
    // After CSV parsing its value remains ="digits", which Excel evaluates as text.
    if (index === 1 && /^="\d{10,}"$/.test(cell)) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return escapeCsvCell(cell);
  }).join(',')).join('\r\n')}`;
}

export function exportStudentRowsCsv(rows: StudentRegistrationRow[], filename = 'codezy-all-students.csv'): void {
  downloadCsv(studentRowsToCsv(rows), filename);
}

/**
 * Exports only the shortlisted students from the given rows.
 * Returns the count of exported rows (0 = nothing exported).
 */
export function exportShortlistedStudentRowsCsv(rows: StudentRegistrationRow[]): number {
  const shortlisted = rows.filter((row) => row.registration.shortlistStatus === 'shortlisted');
  if (shortlisted.length === 0) return 0;
  downloadCsv(studentRowsToCsv(shortlisted), 'codezy-shortlisted-students.csv');
  return shortlisted.length;
}

function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
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
