export interface Production {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface Role {
  id: string;
  productionId: string;
  name: string;
  description: string;
}

export interface Prop {
  id: string;
  productionId: string;
  name: string;
  totalQuantity: number;
  barcode?: string;
  location?: string;
  description?: string;
  createdAt: string;
}

export type PropBorrowStatus = 'borrowed' | 'returned' | 'lost' | 'damaged';

export interface PropBorrowRecord {
  id: string;
  propId: string;
  productionId: string;
  scheduledSceneId?: string;
  sceneId?: string;
  borrower: string;
  borrowerContact?: string;
  quantity: number;
  borrowTime: string;
  expectedReturnTime?: string;
  actualReturnTime?: string;
  status: PropBorrowStatus;
  notes?: string;
}

export interface Scene {
  id: string;
  productionId: string;
  name: string;
  durationMinutes: number;
  sequence: number;
  roleIds: string[];
  propIds: string[];
  dependsOnSceneIds: string[];
}

export interface Actor {
  id: string;
  name: string;
  contact: string;
  roleAssignments: { roleId: string; productionId: string }[];
}

export type AvailabilityType = 'available' | 'unavailable' | 'preferred';

export interface AvailabilitySlot {
  id: string;
  actorId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  type: AvailabilityType;
}

export interface RehearsalRoom {
  id: string;
  name: string;
  capacity: number;
}

export type RoomUnavailabilityType = 'maintenance' | 'closed' | 'other';

export interface RoomUnavailability {
  id: string;
  roomId: string;
  startTime: string;
  endTime: string;
  type: RoomUnavailabilityType;
  reason?: string;
}

export interface ScheduledScene {
  id: string;
  sceneId: string;
  roomId: string;
  startTime: string;
  endTime: string;
}

export type ConflictType = 'actor' | 'prop' | 'dependency' | 'room' | 'availability' | 'leave' | 'room-unavailable';
export type ConflictSeverity = 'error' | 'warning';

export interface Conflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  description: string;
  involvedScheduledSceneIds: string[];
  details: Record<string, unknown>;
}

export interface Schedule {
  id: string;
  name: string;
  productionId: string;
  startDate: string;
  endDate: string;
  scheduledScenes: ScheduledScene[];
  conflictScore: number;
  gapScore: number;
  conflicts: Conflict[];
}

export interface ScheduleCandidate {
  id: string;
  schedule: Schedule;
  totalScore: number;
  rank: number;
}

export interface GenerateOptions {
  productionId: string;
  startDate: string;
  endDate: string;
  candidateCount: number;
  dailyStartTime: string;
  dailyEndTime: string;
  breakDurationMinutes: number;
  weightConfig?: Partial<ConflictWeightConfig>;
}

export interface LeavePeriod {
  id: string;
  actorId: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface FullData {
  version: string;
  exportedAt: string;
  productions: Production[];
  scenes: Scene[];
  roles: Role[];
  props: Prop[];
  propBorrowRecords: PropBorrowRecord[];
  actors: Actor[];
  availability: AvailabilitySlot[];
  leavePeriods: LeavePeriod[];
  rooms: RehearsalRoom[];
  roomUnavailabilities: RoomUnavailability[];
  schedules: Schedule[];
}

export type DraggableSceneData = {
  id: string;
  type: 'scheduled-scene';
  scheduledScene: ScheduledScene;
};

export interface ConflictWeightConfig {
  actor: number;
  prop: number;
  dependency: number;
  room: number;
  availability: number;
  leave: number;
  'room-unavailable': number;
}

export const CONFLICT_WEIGHTS: ConflictWeightConfig = {
  actor: 100,
  prop: 50,
  dependency: 80,
  room: 70,
  availability: 5,
  leave: 150,
  'room-unavailable': 200,
};

export const OPTIMAL_GAP_MINUTES = 15;
