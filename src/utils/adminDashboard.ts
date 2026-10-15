import type { DashboardRegistration, Participant } from '@/types';

export type AcademicYearFilter = 'all' | '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
export type DomainFilter = 'all' | 'ai' | 'healthcare' | 'environment' | 'fintech' | 'other';
export type ReviewStatusFilter = 'all' | 'pending' | 'shortlisted' | 'rejected';
export type StudentSortField = 'name' | 'academicYear' | 'rollNumber' | 'registeredAt';
export type SortDirection = 'asc' | 'desc';

export interface StudentRegistrationRow {
  key: string;
  registration: DashboardRegistration;
  participant: Participant;
}

export interface RegistrationSummary {
  totalRegistrations: number;
  firstYearStudents: number;
  secondYearStudents: number;
  seniorStudents: number;
}

export function flattenRegistrations(registrations: DashboardRegistration[]): StudentRegistrationRow[] {
  return registrations.flatMap((registration, registrationIndex) =>
    registration.participants.map((participant, participantIndex) => ({
      key: `${registration.id ?? `record-${registrationIndex}`}-participant-${participantIndex}`,
      registration,
      participant,
    })),
  );
}

export function filterStudentRows(
  rows: StudentRegistrationRow[],
  searchQuery: string,
  academicYear: AcademicYearFilter,
  domain: DomainFilter = 'all',
  reviewStatus: ReviewStatusFilter = 'all',
): StudentRegistrationRow[] {
  const query = searchQuery.trim().toLocaleLowerCase();
  return rows.filter(({ participant, registration }) => {
    if (academicYear !== 'all' && participant.academicYear !== academicYear) return false;
    if (domain !== 'all' && registration.idea.domain !== domain) return false;
    if (reviewStatus !== 'all' && registration.shortlistStatus !== reviewStatus) return false;
    if (!query) return true;
    return [participant.fullName, participant.email, participant.rollNumber, registration.id ?? '', registration.idea.title]
      .some((value) => value.toLocaleLowerCase().includes(query));
  });
}

export function sortStudentRows(
  rows: StudentRegistrationRow[],
  field: StudentSortField,
  direction: SortDirection,
): StudentRegistrationRow[] {
  const multiplier = direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (field === 'registeredAt') {
      const dateA = a.registration.createdAt ? Date.parse(a.registration.createdAt) : Number.NaN;
      const dateB = b.registration.createdAt ? Date.parse(b.registration.createdAt) : Number.NaN;
      if (!Number.isFinite(dateA) && !Number.isFinite(dateB)) return 0;
      if (!Number.isFinite(dateA)) return 1;
      if (!Number.isFinite(dateB)) return -1;
      return (dateA - dateB) * multiplier;
    }

    const valueA = a.participant[field === 'name' ? 'fullName' : field];
    const valueB = b.participant[field === 'name' ? 'fullName' : field];
    return valueA.localeCompare(valueB, undefined, { numeric: true, sensitivity: 'base' }) * multiplier;
  });
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
  const startIndex = Math.max(0, page - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
}

export function summarizeRegistrations(registrations: DashboardRegistration[]): RegistrationSummary {
  const participants = registrations.flatMap((registration) => registration.participants);
  return {
    totalRegistrations: registrations.length,
    firstYearStudents: participants.filter((participant) => participant.academicYear === '1st Year').length,
    secondYearStudents: participants.filter((participant) => participant.academicYear === '2nd Year').length,
    seniorStudents: participants.filter((participant) =>
      participant.academicYear === '3rd Year' || participant.academicYear === '4th Year',
    ).length,
  };
}
