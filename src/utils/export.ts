import type { DashboardRegistration } from '@/types';

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
  const blob = new Blob([registrationsToCsv(registrations)], { type: 'text/csv;charset=utf-8;' });
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
