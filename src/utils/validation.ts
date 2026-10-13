import type {
  Participant,
  ParticipantErrors,
  IdeaErrors,
  StartupIdea,
  RegistrationErrors,
  TeamType,
} from '@/types';

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePhone(phone: string): boolean {
  return /^[+]?[\d\s-]{10,15}$/.test(phone.trim());
}

export function validateParticipant(p: Participant): ParticipantErrors {
  const errors: ParticipantErrors = {};
  if (!p.fullName.trim()) errors.fullName = 'Full name is required';
  else if (p.fullName.trim().length < 2) errors.fullName = 'Name must be at least 2 characters';

  if (!p.academicYear.trim()) errors.academicYear = 'Academic year is required';

  if (!p.section.trim()) errors.section = 'Section is required';

  if (!p.rollNumber.trim()) errors.rollNumber = 'Roll number is required';

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

  if (!idea.description.trim()) errors.description = 'Idea description is required';
  else if (idea.description.trim().length < 10) errors.description = 'Description must be at least 10 characters';

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
