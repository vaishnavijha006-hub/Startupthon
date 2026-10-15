/**
 * Utility for validating and formatting organizer phone numbers.
 *
 * Rule: phone must be EXACTLY 10 numeric digits — regex `^[0-9]{10}$`.
 * No spaces, hyphens, country code, or other characters are accepted.
 */

const PHONE_REGEX = /^[0-9]{10}$/;

/**
 * Returns true only if `phone` matches `^[0-9]{10}$` exactly.
 */
export function isValidOrganizerPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

/**
 * Returns the `tel:` href for a valid 10-digit phone number (prefixed with
 * India's country code +91). Returns `null` if the number is invalid.
 */
export function getTelHref(phone: string): string | null {
  if (!isValidOrganizerPhone(phone)) return null;
  return `tel:+91${phone}`;
}

/**
 * Formats a valid 10-digit number for display as "+91 XXXXX XXXXX".
 * Returns `null` if the number is invalid.
 */
export function formatDisplayPhone(phone: string): string | null {
  if (!isValidOrganizerPhone(phone)) return null;
  return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
}
