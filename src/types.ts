/* src/types.ts */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export type UserRole = 'admin' | 'coach' | 'player';

export interface ClubUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
}

export type EventType = 'game' | 'training' | 'event';

export interface ClubEvent {
  id: string;
  title: string;
  type: EventType;
  category?: string;
  description?: string;
  start: string; // ISO string
  end: string;   // ISO string
  location?: string;
  periodId: string; // e.g. "2026-01" (for Jan-Feb 2026)
  createdBy: string;
  createdAt: string;
  manualRSVPs?: ManualRSVP[];
}

export type RSVPStatus = 'going' | 'not_going' | 'maybe';

export interface ManualRSVP {
  name: string;
  status: RSVPStatus;
}

export type PeriodBimester = 'Marzo/Abril' | 'Mayo/Junio' | 'Julio' | 'Agosto/Septiembre' | 'Octubre/Noviembre';
export type CategoryType = 'Cebollitas' | 'Premini' | 'Mini' | 'U13 Blanco' | 'U13 Azul';

export interface CurriculumContent {
  id: string;
  title: string;
  description?: string;
  assignedTeachers: string[]; // User IDs
  isGiven?: boolean;
  createdAt: string;
}

export interface Curriculum {
  id: string;
  category: CategoryType;
  bimester: PeriodBimester;
  contents: CurriculumContent[];
  categoryProfessors: string[]; // Professors assigned to the whole category
  manualStaff?: string[]; // Staff members added by name (not app users)
  updatedAt: string;
}

export interface RSVP {
  eventId: string;
  userId: string;
  status: RSVPStatus;
  updatedAt: string;
}
