import type {
  Participant,
  ParticipantErrors,
  IdeaErrors,
  StartupIdea,
  RegistrationErrors,
  TeamType,
} from '@/types';

export function validateEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return normalized.length <= 255
    && /^[a-z0-9._%+-]+@([a-z0-9][-a-z0-9]*\.)+[a-z]{2,}$/.test(normalized);
}

export function validatePhone(phone: string): boolean {
  const normalized = phone.trim();
  if (!/^[+]?[0-9 -]{10,25}$/.test(normalized)) return false;

  const digitCount = normalized.replace(/[^0-9]/g, '').length;
  return digitCount >= 10 && digitCount <= 15;
}

const ROLL_NUMBER_RULES: Record<string, { prefix?: string; required: boolean }> = {
  '1st Year': { required: false },
  '2nd Year': { prefix: '25', required: true },
  '3rd Year': { prefix: '24', required: true },
  '4th Year': { prefix: '23', required: true },
};

export function validateRollNumber(academicYear: string, rollNumber: string): string | undefined {
  const value = rollNumber.trim();
  const rule = ROLL_NUMBER_RULES[academicYear];

  if (!rule) {
    return value ? 'Select a valid academic year before validating the roll number' : undefined;
  }

  if (!value && rule.required) return 'Roll number is required for this academic year';
  if (!value) return undefined;
  if (!/^\d{13}$/.test(value)) return 'Roll number must contain exactly 13 digits';
  if (rule.prefix && !value.startsWith(rule.prefix)) {
    return `Roll number for ${academicYear.toLowerCase()} must start with ${rule.prefix}`;
  }

  return undefined;
}

export function validateParticipant(p: Participant): ParticipantErrors {
  const errors: ParticipantErrors = {};
  if (!p.fullName.trim()) errors.fullName = 'Full name is required';
  else if (p.fullName.trim().length < 2) errors.fullName = 'Name must be at least 2 characters';
  else if (p.fullName.trim().length > 100) errors.fullName = 'Name must not exceed 100 characters';

  if (!p.academicYear.trim()) errors.academicYear = 'Academic year is required';
  else if (!ROLL_NUMBER_RULES[p.academicYear]) errors.academicYear = 'Select a valid academic year';

  if (!p.section.trim()) errors.section = 'Section is required';
  else if (p.section.trim().length > 20) errors.section = 'Section must not exceed 20 characters';

  const rollNumberError = validateRollNumber(p.academicYear, p.rollNumber);
  if (rollNumberError) errors.rollNumber = rollNumberError;

  if (!p.phone.trim()) errors.phone = 'Phone number is required';
  else if (!validatePhone(p.phone)) errors.phone = 'Enter a valid phone number (10-15 digits)';

  if (!p.email.trim()) errors.email = 'Email address is required';
  else if (!validateEmail(p.email)) errors.email = 'Enter a valid email address';

  return errors;
}

export function validateIdea(idea: StartupIdea): IdeaErrors {
  const errors: IdeaErrors = {};
  if (!idea.title.trim()) errors.title = 'Idea title is required';
  else if (idea.title.trim().length < 3) errors.title = 'Title must be at least 3 characters';
  else if (idea.title.trim().length > 200) errors.title = 'Title must not exceed 200 characters';

  if (!idea.description.trim()) errors.description = 'Idea description is required';
  else if (idea.description.trim().length < 10) errors.description = 'Description must be at least 10 characters';
  else if (idea.description.trim().length > 5000) errors.description = 'Description must not exceed 5000 characters';

  if (!idea.domain) errors.domain = 'Please select a domain';

  if (idea.prototypeAvailable === null) errors.prototypeAvailable = 'Please specify if a prototype is available';

  return errors;
}

export function validateRegistration(
  teamType: TeamType,
  participants: Participant[],
  idea: StartupIdea,
): RegistrationErrors {
  const participantErrors = participants.map(validateParticipant);

  if (teamType === 'duo' && participants.length === 2) {
    const p1 = participants[0];
    const p2 = participants[1];

    const roll1 = p1.rollNumber?.trim();
    const roll2 = p2.rollNumber?.trim();
    if (roll1 && roll2 && roll1 === roll2) {
      participantErrors[1].rollNumber = 'Both team members cannot share the same roll number';
    }

    const email1 = p1.email?.trim().toLowerCase();
    const email2 = p2.email?.trim().toLowerCase();
    if (email1 && email2 && email1 === email2) {
      participantErrors[1].email = 'Both team members cannot share the same email address';
    }
  }

  const ideaErrors = validateIdea(idea);
  return { participants: participantErrors, idea: ideaErrors };
}

export function hasErrors(errors: RegistrationErrors): boolean {
  const hasParticipantErrors = errors.participants.some(
    (p) => Object.values(p).some((v) => v !== undefined),
  );
  const hasIdeaErrors = Object.values(errors.idea).some((v) => v !== undefined);
  return hasParticipantErrors || hasIdeaErrors;
}

export function validateFile(file: File): string | null {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return 'Only PNG, JPEG, WebP, or PDF files are allowed';
  }
  if (file.size > maxSize) {
    return 'File size must be under 5MB';
  }
  return null;
}
