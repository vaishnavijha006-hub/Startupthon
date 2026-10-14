import type { DashboardRegistration } from '@/types';

export type RegistrationDataset =
  | { status: 'available'; registrations: DashboardRegistration[] }
  | { status: 'unavailable'; registrations: []; message: string };

/** Placeholder data source. Replace this implementation with a Supabase repository later. */
export async function loadAdminRegistrations(): Promise<RegistrationDataset> {
  return {
    status: 'unavailable',
    registrations: [],
    message: 'Registration data is unavailable because no data source is connected yet.',
  };
}
