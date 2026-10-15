export type TeamType = 'solo' | 'duo';

export type ShortlistStatus = 'pending' | 'shortlisted' | 'rejected';

export type DomainId =
  | 'ai'
  | 'healthcare'
  | 'environment'
  | 'fintech'
  | 'other';

export interface Domain {
  id: DomainId;
  name: string;
  description: string;
  icon: string;
}

export interface Participant {
  fullName: string;
  academicYear: string;
  section: string;
  rollNumber: string;
  phone: string;
  email: string;
}

export interface StartupIdea {
  title: string;
  description: string;
  domain: DomainId | '';
  prototypeAvailable: boolean | null;
  sketchFileName: string | null;
  /** Private Supabase Storage object path; populated only in admin records. */
  sketchFilePath?: string | null;
}

export interface Registration {
  id: string;
  teamType: TeamType;
  participants: Participant[];
  idea: StartupIdea;
  shortlistStatus: ShortlistStatus;
  createdAt: string;
}

/** Dashboard view of the submitted form, with optional metadata assigned by a future backend. */
export interface DashboardRegistration {
  /** Stable database UUID used for authorized administrative updates. */
  databaseId?: string;
  id?: string;
  registrationNumber?: number;
  teamType: TeamType;
  participants: Participant[];
  idea: StartupIdea;
  shortlistStatus: ShortlistStatus;
  createdAt?: string;
}

export interface ParticipantErrors {
  fullName?: string;
  academicYear?: string;
  section?: string;
  rollNumber?: string;
  phone?: string;
  email?: string;
}

export interface IdeaErrors {
  title?: string;
  description?: string;
  domain?: string;
  prototypeAvailable?: string;
  sketchFile?: string;
}

export interface RegistrationErrors {
  participants: ParticipantErrors[];
  idea: IdeaErrors;
}
