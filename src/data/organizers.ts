/**
 * Centralized configuration for organizer / coordinator contact details.
 *
 * IMPORTANT: `phone` MUST be stored as a plain 10-digit string (digits only,
 * no spaces, hyphens, country code, or any other character).
 * The regex `^[0-9]{10}$` is used to validate every entry before it is
 * rendered. Invalid entries are silently suppressed — no broken links appear.
 */
export interface Organizer {
  name: string;
  /** Exactly 10 numeric digits — no spaces, hyphens, or country code. */
  phone: string;
}

export const ORGANIZERS: Organizer[] = [
  { name: 'Mayank',   phone: '8218933674' },
  { name: 'Manushwi', phone: '8920976910' },
];
