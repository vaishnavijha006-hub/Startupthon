import type { Registration } from '@/types';

export interface ExportRow {
  section: string;
  rollNumber: string;
  ideaTitle: string;
}

export function registrationsToExportRows(registrations: Registration[]): ExportRow[] {
  const rows: ExportRow[] = [];
  for (const reg of registrations) {
    for (const p of reg.participants) {
      rows.push({
        section: p.section,
        rollNumber: p.rollNumber,
        ideaTitle: reg.idea.title,
      });
    }
  }
  return rows;
}

export function exportToCsv(rows: ExportRow[]): void {
  const headers = ['Student Section', 'Student Roll Number', 'Startup Idea Title'];
  const lines = [headers.join(',')];

  for (const row of rows) {
    const values = [row.section, row.rollNumber, row.ideaTitle].map(escapeCsv);
    lines.push(values.join(','));
  }

  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'codezy-registrations.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
