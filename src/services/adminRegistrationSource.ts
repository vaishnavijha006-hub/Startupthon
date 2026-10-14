import { supabase } from './supabase.ts';
import { isUserAdmin } from './adminAuth.ts';
import type { DashboardRegistration, Participant, StartupIdea, TeamType } from '@/types';

export type RegistrationDataset =
  | { status: 'available'; registrations: DashboardRegistration[] }
  | { status: 'unavailable'; registrations: []; message: string };

/**
 * Transforms raw relational records from Supabase tables (registrations, participants, startup_ideas)
 * into typed DashboardRegistration objects.
 */
export function mapDatabaseToDashboardRegistrations(rawRows: unknown[]): DashboardRegistration[] {
  if (!Array.isArray(rawRows)) return [];

  return rawRows.map((rawRow) => {
    const row = (rawRow && typeof rawRow === 'object' ? rawRow : {}) as Record<string, unknown>;

    // 1. Map participants
    const rawParticipants = Array.isArray(row.participants) ? row.participants : [];
    const participants: Participant[] = rawParticipants.map((pRaw) => {
      const p = (pRaw && typeof pRaw === 'object' ? pRaw : {}) as Record<string, unknown>;
      return {
        fullName: typeof p.full_name === 'string' ? p.full_name : '',
        academicYear: typeof p.academic_year === 'string' ? p.academic_year : '',
        section: typeof p.section === 'string' ? p.section : '',
        rollNumber: typeof p.roll_number === 'string' ? p.roll_number : '',
        phone: typeof p.phone === 'string' ? p.phone : '',
        email: typeof p.email === 'string' ? p.email : '',
      };
    });

    // 2. Map startup idea
    const rawIdea = Array.isArray(row.startup_ideas)
      ? (row.startup_ideas[0] as Record<string, unknown> | undefined)
      : (row.startup_ideas && typeof row.startup_ideas === 'object'
          ? (row.startup_ideas as Record<string, unknown>)
          : undefined);

    const idea: StartupIdea = {
      title: typeof rawIdea?.title === 'string' ? rawIdea.title : '',
      description: typeof rawIdea?.description === 'string' ? rawIdea.description : '',
      domain: (typeof rawIdea?.domain === 'string' ? rawIdea.domain : '') as StartupIdea['domain'],
      prototypeAvailable:
        typeof rawIdea?.prototype_available === 'boolean'
          ? rawIdea.prototype_available
          : null,
      sketchFileName:
        typeof rawIdea?.sketch_file_path === 'string'
          ? rawIdea.sketch_file_path
          : null,
    };

    // 3. Format registration number and reference ID
    const regNum =
      typeof row.registration_number === 'number'
        ? row.registration_number
        : typeof row.registration_number === 'string'
          ? parseInt(row.registration_number, 10)
          : undefined;

    const regId = regNum ? `REG-#${regNum}` : (typeof row.id === 'string' ? row.id : 'Not assigned');

    return {
      id: regId,
      registrationNumber: Number.isFinite(regNum) ? regNum : undefined,
      teamType: (row.team_type === 'duo' ? 'duo' : 'solo') as TeamType,
      participants,
      idea,
      createdAt: typeof row.created_at === 'string' ? row.created_at : '',
    };
  });
}

/**
 * Loads registration records securely for authenticated administrators.
 */
export async function loadAdminRegistrations(): Promise<RegistrationDataset> {
  try {
    // 1. Check authorization before executing query
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !isUserAdmin(session.user)) {
      return {
        status: 'unavailable',
        registrations: [],
        message: 'Administrative privileges required to access registration records.',
      };
    }

    // 2. Query relational database records using the authenticated admin's session
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        id,
        registration_number,
        team_type,
        created_at,
        participants (
          id,
          full_name,
          academic_year,
          section,
          roll_number,
          phone,
          email
        ),
        startup_ideas (
          id,
          title,
          description,
          domain,
          prototype_available,
          sketch_file_path
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Database query error in loadAdminRegistrations:', error.message);
      return {
        status: 'unavailable',
        registrations: [],
        message: `Registration data is unavailable: ${error.message}. Ensure admin RLS SELECT policies are configured in Supabase.`,
      };
    }

    if (!data) {
      return {
        status: 'available',
        registrations: [],
      };
    }

    const mapped = mapDatabaseToDashboardRegistrations(data);

    return {
      status: 'available',
      registrations: mapped,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    return {
      status: 'unavailable',
      registrations: [],
      message: `Failed to load registration data: ${message}`,
    };
  }
}
