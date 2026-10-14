import type { DashboardRegistration } from '@/types';

const CSV_HEADERS = [
  'Registration ID',
  'Student Name',
  'Email',
  'College (not collected; proposed field)',
  'Academic Year',
  'Roll Number',
  'Section',
  'Phone',
  'Team Type',
  'Idea Title',
  'Idea Description',
  'Domain',
  'Prototype Available',
  'Registration Date',
];

export function registrationsToCsv(registrations: DashboardRegistration[]): string {
  const rows: string[][] = [CSV_HEADERS];

  for (const registration of registrations) {
    for (const participant of registration.participants) {
      rows.push([
        registration.id ?? '',
        participant.fullName,
        participant.email,
        'Not collected',
        participant.academicYear,
        participant.rollNumber,
        participant.section,
        participant.phone,
        registration.teamType,
        registration.idea.title,
        registration.idea.description,
        registration.idea.domain,
        registration.idea.prototypeAvailable === null ? '' : registration.idea.prototypeAvailable ? 'Yes' : 'No',
        registration.createdAt ?? '',
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

function escapeCsvCell(value: string): string {
  const safeValue = /^\s*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
}
