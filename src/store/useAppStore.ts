import { create } from 'zustand';
import {
  Production,
  Scene,
  Role,
  Prop,
  PropBorrowRecord,
  Actor,
  AvailabilitySlot,
  RehearsalRoom,
  Schedule,
  ScheduleCandidate,
  GenerateOptions,
  FullData,
  ScheduledScene,
  LeavePeriod,
} from '../types';
import { generateId, formatDateTime, combineDateAndTime } from '../utils/time';
import { addMinutes } from 'date-fns';
import { generateScheduleCandidates, recalculateScheduleScores } from '../engine/scheduler';
import {
  sampleProductions,
  sampleScenes,
  sampleRoles,
  sampleProps,
  sampleActors,
  sampleAvailability,
  sampleRooms,
} from './sampleData';

const STORAGE_KEY = 'rehearsal-scheduler-data';
const DATA_VERSION = '1.0.0';

interface AppState {
  productions: Production[];
  scenes: Scene[];
  roles: Role[];
  props: Prop[];
  propBorrowRecords: PropBorrowRecord[];
  actors: Actor[];
  availability: AvailabilitySlot[];
  leavePeriods: LeavePeriod[];
  rooms: RehearsalRoom[];
  currentProductionId: string | null;
  schedules: Schedule[];
  currentScheduleId: string | null;
  candidates: ScheduleCandidate[];
  selectedDate: string;
  zoomLevel: 'day' | 'week';
  isGenerating: boolean;

  loadFromStorage: () => void;
  saveToStorage: () => void;

  setProductions: (productions: Production[]) => void;
  addProduction: (production: Omit<Production, 'id' | 'createdAt'>) => void;
  updateProduction: (id: string, updates: Partial<Production>) => void;
  deleteProduction: (id: string) => void;
  setCurrentProduction: (id: string | null) => void;

  addScene: (scene: Omit<Scene, 'id'>) => void;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  deleteScene: (id: string) => void;

  addRole: (role: Omit<Role, 'id'>) => void;
  updateRole: (id: string, updates: Partial<Role>) => void;
  deleteRole: (id: string) => void;

  addProp: (prop: Omit<Prop, 'id' | 'createdAt'>) => void;
  updateProp: (id: string, updates: Partial<Prop>) => void;
  deleteProp: (id: string) => void;

  addPropBorrowRecord: (record: Omit<PropBorrowRecord, 'id'>) => { success: boolean; message: string };
  updatePropBorrowRecord: (id: string, updates: Partial<PropBorrowRecord>) => void;
  deletePropBorrowRecord: (id: string) => void;
  returnPropBorrowRecord: (id: string, quantity?: number) => { success: boolean; message: string };
  getPropAvailableQuantity: (propId: string) => number;
  getPropBorrowedQuantity: (propId: string) => number;
  checkPropBorrowConflict: (propId: string, quantity: number, scheduledSceneId?: string) => { conflict: boolean; message: string };

  addActor: (actor: Omit<Actor, 'id'>) => void;
  updateActor: (id: string, updates: Partial<Actor>) => void;
  deleteActor: (id: string) => void;

  addAvailability: (slot: Omit<AvailabilitySlot, 'id'>) => void;
  updateAvailability: (id: string, updates: Partial<AvailabilitySlot>) => void;
  deleteAvailability: (id: string) => void;
  setActorAvailability: (
    actorId: string,
    slots: Omit<AvailabilitySlot, 'id' | 'actorId'>[]
  ) => void;

  addLeavePeriod: (period: Omit<LeavePeriod, 'id'>) => void;
  updateLeavePeriod: (id: string, updates: Partial<LeavePeriod>) => void;
  deleteLeavePeriod: (id: string) => void;

  addRoom: (room: Omit<RehearsalRoom, 'id'>) => void;
  updateRoom: (id: string, updates: Partial<RehearsalRoom>) => void;
  deleteRoom: (id: string) => void;

  generateCandidates: (options: GenerateOptions) => Promise<void>;
  selectCandidate: (candidateId: string) => void;
  clearCandidates: () => void;

  setCurrentSchedule: (id: string | null) => void;
  moveScheduledScene: (
    scheduledSceneId: string,
    newDate: string,
    newTime: string,
    newRoomId: string
  ) => void;
  updateScheduledScene: (
    scheduledSceneId: string,
    updates: Partial<ScheduledScene>
  ) => void;
  deleteScheduledScene: (scheduledSceneId: string) => void;
  addScheduledScene: (
    scheduleId: string,
    sceneId: string,
    roomId: string,
    date: string,
    startTime: string
  ) => void;
  recalculateScheduleScores: (scheduleId: string) => void;

  setSelectedDate: (date: string) => void;
  setZoomLevel: (level: 'day' | 'week') => void;

  importData: (data: FullData) => void;
  exportData: () => FullData;
  resetToSampleData: () => void;
  clearAllData: () => void;
}

function loadInitialState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        productions: data.productions || [],
        scenes: data.scenes || [],
        roles: data.roles || [],
        props: data.props || [],
        propBorrowRecords: data.propBorrowRecords || [],
        actors: data.actors || [],
        availability: data.availability || [],
        leavePeriods: data.leavePeriods || [],
        rooms: data.rooms || [],
        schedules: data.schedules || [],
      };
    }
  } catch (e) {
    console.error('Failed to load from storage:', e);
  }

  return {
    productions: sampleProductions,
    scenes: sampleScenes,
    roles: sampleRoles,
    props: sampleProps,
    propBorrowRecords: [],
    actors: sampleActors,
    availability: sampleAvailability,
    leavePeriods: [],
    rooms: sampleRooms,
    schedules: [],
  };
}

const initialData = loadInitialState();

export const useAppStore = create<AppState>((set, get) => ({
  ...initialData,
  propBorrowRecords: initialData.propBorrowRecords || [],
  currentProductionId: initialData.productions[0]?.id || null,
  currentScheduleId: null,
  candidates: [],
  selectedDate: new Date().toISOString().split('T')[0],
  zoomLevel: 'week' as const,
  isGenerating: false,

  loadFromStorage: () => {
    const data = loadInitialState();
    set({
      ...data,
      currentProductionId: data.productions[0]?.id || null,
    });
  },

  saveToStorage: () => {
    const state = get();
    const data: FullData = {
      version: DATA_VERSION,
      exportedAt: new Date().toISOString(),
      productions: state.productions,
      scenes: state.scenes,
      roles: state.roles,
      props: state.props,
      propBorrowRecords: state.propBorrowRecords,
      actors: state.actors,
      availability: state.availability,
      leavePeriods: state.leavePeriods,
      rooms: state.rooms,
      schedules: state.schedules,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  setProductions: (productions) => set({ productions }),

  addProduction: (production) => {
    const newProd: Production = {
      ...production,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      productions: [...state.productions, newProd],
      currentProductionId: state.currentProductionId || newProd.id,
    }));
    get().saveToStorage();
  },

  updateProduction: (id, updates) => {
    set((state) => ({
      productions: state.productions.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
    get().saveToStorage();
  },

  deleteProduction: (id) => {
    set((state) => {
      return {
        productions: state.productions.filter((p) => p.id !== id),
        scenes: state.scenes.filter((s) => s.productionId !== id),
        roles: state.roles.filter((r) => r.productionId !== id),
        props: state.props.filter((p) => p.productionId !== id),
        propBorrowRecords: state.propBorrowRecords.filter((r) => r.productionId !== id),
        schedules: state.schedules.filter((s) => s.productionId !== id),
        currentProductionId:
          state.currentProductionId === id
            ? state.productions.find((p) => p.id !== id)?.id || null
            : state.currentProductionId,
        actors: state.actors.map((a) => ({
          ...a,
          roleAssignments: a.roleAssignments.filter(
            (ra) => ra.productionId !== id
          ),
        })),
      };
    });
    get().saveToStorage();
  },

  setCurrentProduction: (id) => set({ currentProductionId: id }),

  addScene: (scene) => {
    set((state) => ({
      scenes: [...state.scenes, { ...scene, id: generateId() }],
    }));
    get().saveToStorage();
  },

  updateScene: (id, updates) => {
    set((state) => ({
      scenes: state.scenes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
    get().saveToStorage();
  },

  deleteScene: (id) => {
    set((state) => ({
      scenes: state.scenes
        .filter((s) => s.id !== id)
        .map((s) => ({
          ...s,
          dependsOnSceneIds: s.dependsOnSceneIds.filter((depId) => depId !== id),
        })),
    }));
    get().saveToStorage();
  },

  addRole: (role) => {
    set((state) => ({
      roles: [...state.roles, { ...role, id: generateId() }],
    }));
    get().saveToStorage();
  },

  updateRole: (id, updates) => {
    set((state) => ({
      roles: state.roles.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
    get().saveToStorage();
  },

  deleteRole: (id) => {
    set((state) => ({
      roles: state.roles.filter((r) => r.id !== id),
      scenes: state.scenes.map((s) => ({
        ...s,
        roleIds: s.roleIds.filter((rid) => rid !== id),
      })),
      actors: state.actors.map((a) => ({
        ...a,
        roleAssignments: a.roleAssignments.filter((ra) => ra.roleId !== id),
      })),
    }));
    get().saveToStorage();
  },

  addProp: (prop) => {
    set((state) => ({
      props: [...state.props, { ...prop, id: generateId(), createdAt: new Date().toISOString() }],
    }));
    get().saveToStorage();
  },

  updateProp: (id, updates) => {
    set((state) => ({
      props: state.props.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
    get().saveToStorage();
  },

  deleteProp: (id) => {
    set((state) => ({
      props: state.props.filter((p) => p.id !== id),
      propBorrowRecords: state.propBorrowRecords.filter((r) => r.propId !== id),
      scenes: state.scenes.map((s) => ({
        ...s,
        propIds: s.propIds.filter((pid) => pid !== id),
      })),
    }));
    get().saveToStorage();
  },

  getPropBorrowedQuantity: (propId) => {
    const state = get();
    return state.propBorrowRecords
      .filter((r) => r.propId === propId && r.status === 'borrowed')
      .reduce((sum, r) => sum + r.quantity, 0);
  },

  getPropAvailableQuantity: (propId) => {
    const state = get();
    const prop = state.props.find((p) => p.id === propId);
    if (!prop) return 0;
    const borrowed = get().getPropBorrowedQuantity(propId);
    return Math.max(0, prop.totalQuantity - borrowed);
  },

  checkPropBorrowConflict: (propId, quantity, scheduledSceneId) => {
    const state = get();
    const prop = state.props.find((p) => p.id === propId);
    if (!prop) {
      return { conflict: true, message: '道具不存在' };
    }

    const available = get().getPropAvailableQuantity(propId);
    if (quantity > available) {
      return {
        conflict: true,
        message: `库存不足，当前可用 ${available} 件，需要 ${quantity} 件`,
      };
    }

    if (scheduledSceneId) {
      const sameSceneRecords = state.propBorrowRecords.filter(
        (r) => r.scheduledSceneId === scheduledSceneId && r.propId === propId && r.status === 'borrowed'
      );
      const sceneTotal = sameSceneRecords.reduce((sum, r) => sum + r.quantity, 0) + quantity;
      if (sceneTotal > prop.totalQuantity) {
        return {
          conflict: true,
          message: `同场次超量冲突：该场次已借出 ${sameSceneRecords.reduce((sum, r) => sum + r.quantity, 0)} 件，再加 ${quantity} 件超过总库存 ${prop.totalQuantity} 件`,
        };
      }
    }

    return { conflict: false, message: '' };
  },

  addPropBorrowRecord: (record) => {
    const state = get();
    const check = get().checkPropBorrowConflict(record.propId, record.quantity, record.scheduledSceneId);
    if (check.conflict) {
      return { success: false, message: check.message };
    }

    const newRecord: PropBorrowRecord = {
      ...record,
      id: generateId(),
    };
    set((state) => ({
      propBorrowRecords: [...state.propBorrowRecords, newRecord],
    }));
    get().saveToStorage();
    return { success: true, message: '借出登记成功' };
  },

  updatePropBorrowRecord: (id, updates) => {
    set((state) => ({
      propBorrowRecords: state.propBorrowRecords.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }));
    get().saveToStorage();
  },

  deletePropBorrowRecord: (id) => {
    set((state) => ({
      propBorrowRecords: state.propBorrowRecords.filter((r) => r.id !== id),
    }));
    get().saveToStorage();
  },

  returnPropBorrowRecord: (id, returnQuantity) => {
    const state = get();
    const record = state.propBorrowRecords.find((r) => r.id === id);
    if (!record) {
      return { success: false, message: '记录不存在' };
    }
    if (record.status !== 'borrowed') {
      return { success: false, message: '该记录状态不是借出中' };
    }

    const qty = returnQuantity ?? record.quantity;
    if (qty > record.quantity) {
      return { success: false, message: `归还数量不能超过借出数量 ${record.quantity}` };
    }

    if (qty === record.quantity) {
      set((state) => ({
        propBorrowRecords: state.propBorrowRecords.map((r) =>
          r.id === id
            ? { ...r, status: 'returned', actualReturnTime: new Date().toISOString() }
            : r
        ),
      }));
    } else {
      const remaining: PropBorrowRecord = {
        ...record,
        id: generateId(),
        quantity: record.quantity - qty,
      };
      const returned: PropBorrowRecord = {
        ...record,
        id: generateId(),
        quantity: qty,
        status: 'returned',
        actualReturnTime: new Date().toISOString(),
      };
      set((state) => ({
        propBorrowRecords: [
          ...state.propBorrowRecords.filter((r) => r.id !== id),
          remaining,
          returned,
        ],
      }));
    }
    get().saveToStorage();
    return { success: true, message: '归还登记成功' };
  },

  addActor: (actor) => {
    set((state) => ({
      actors: [...state.actors, { ...actor, id: generateId() }],
    }));
    get().saveToStorage();
  },

  updateActor: (id, updates) => {
    set((state) => ({
      actors: state.actors.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
    get().saveToStorage();
  },

  deleteActor: (id) => {
    set((state) => ({
      actors: state.actors.filter((a) => a.id !== id),
      availability: state.availability.filter((av) => av.actorId !== id),
      leavePeriods: state.leavePeriods.filter((lp) => lp.actorId !== id),
    }));
    get().saveToStorage();
  },

  addAvailability: (slot) => {
    set((state) => ({
      availability: [...state.availability, { ...slot, id: generateId() }],
    }));
    get().saveToStorage();
  },

  updateAvailability: (id, updates) => {
    set((state) => ({
      availability: state.availability.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }));
    get().saveToStorage();
  },

  deleteAvailability: (id) => {
    set((state) => ({
      availability: state.availability.filter((a) => a.id !== id),
    }));
    get().saveToStorage();
  },

  setActorAvailability: (actorId, slots) => {
    set((state) => ({
      availability: [
        ...state.availability.filter((a) => a.actorId !== actorId),
        ...slots.map((s) => ({ ...s, id: generateId(), actorId })),
      ],
    }));
    get().saveToStorage();
  },

  addLeavePeriod: (period) => {
    set((state) => ({
      leavePeriods: [...state.leavePeriods, { ...period, id: generateId() }],
    }));
    const state = get();
    if (state.currentScheduleId) {
      get().recalculateScheduleScores(state.currentScheduleId);
    }
    get().saveToStorage();
  },

  updateLeavePeriod: (id, updates) => {
    set((state) => ({
      leavePeriods: state.leavePeriods.map((lp) =>
        lp.id === id ? { ...lp, ...updates } : lp
      ),
    }));
    const state = get();
    if (state.currentScheduleId) {
      get().recalculateScheduleScores(state.currentScheduleId);
    }
    get().saveToStorage();
  },

  deleteLeavePeriod: (id) => {
    set((state) => ({
      leavePeriods: state.leavePeriods.filter((lp) => lp.id !== id),
    }));
    const state = get();
    if (state.currentScheduleId) {
      get().recalculateScheduleScores(state.currentScheduleId);
    }
    get().saveToStorage();
  },

  addRoom: (room) => {
    set((state) => ({
      rooms: [...state.rooms, { ...room, id: generateId() }],
    }));
    get().saveToStorage();
  },

  updateRoom: (id, updates) => {
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
    get().saveToStorage();
  },

  deleteRoom: (id) => {
    set((state) => ({
      rooms: state.rooms.filter((r) => r.id !== id),
    }));
    get().saveToStorage();
  },

  generateCandidates: async (options) => {
    set({ isGenerating: true });
    await new Promise((resolve) => setTimeout(resolve, 100));

    const state = get();
    const candidates = generateScheduleCandidates(
      options,
      state.scenes,
      state.actors,
      state.props,
      state.rooms,
      state.availability,
      state.leavePeriods
    );

    set({ candidates, isGenerating: false });
  },

  selectCandidate: (candidateId) => {
    const state = get();
    const candidate = state.candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    const newSchedule = { ...candidate.schedule, id: generateId() };
    set((state) => ({
      schedules: [...state.schedules, newSchedule],
      currentScheduleId: newSchedule.id,
      candidates: [],
    }));
    get().saveToStorage();
  },

  clearCandidates: () => set({ candidates: [] }),

  setCurrentSchedule: (id) => set({ currentScheduleId: id }),

  moveScheduledScene: (scheduledSceneId, newDate, newTime, newRoomId) => {
    const state = get();
    const schedule = state.schedules.find(
      (s) =>
        s.id === state.currentScheduleId &&
        s.scheduledScenes.some((ss) => ss.id === scheduledSceneId)
    );

    if (!schedule) return;

    const scheduledScene = schedule.scheduledScenes.find(
      (ss) => ss.id === scheduledSceneId
    );
    if (!scheduledScene) return;

    const scene = state.scenes.find((s) => s.id === scheduledScene.sceneId);
    if (!scene) return;

    const startTime = combineDateAndTime(newDate, newTime);
    const endTime = addMinutes(startTime, scene.durationMinutes);

    const updatedSchedules = state.schedules.map((s) => {
      if (s.id !== schedule.id) return s;
      return {
        ...s,
        scheduledScenes: s.scheduledScenes.map((ss) =>
          ss.id === scheduledSceneId
            ? {
                ...ss,
                roomId: newRoomId,
                startTime: formatDateTime(startTime),
                endTime: formatDateTime(endTime),
              }
            : ss
        ),
      };
    });

    const updatedSchedule = updatedSchedules.find((s) => s.id === schedule.id)!;
    const recalculated = recalculateScheduleScores(
      updatedSchedule,
      state.scenes,
      state.actors,
      state.props,
      state.rooms,
      state.availability,
      state.leavePeriods
    );

    set({
      schedules: updatedSchedules.map((s) =>
        s.id === schedule.id ? recalculated : s
      ),
    });
    get().saveToStorage();
  },

  updateScheduledScene: (scheduledSceneId, updates) => {
    const state = get();
    const schedule = state.schedules.find(
      (s) =>
        s.id === state.currentScheduleId &&
        s.scheduledScenes.some((ss) => ss.id === scheduledSceneId)
    );

    if (!schedule) return;

    const updatedSchedules = state.schedules.map((s) => {
      if (s.id !== schedule.id) return s;
      return {
        ...s,
        scheduledScenes: s.scheduledScenes.map((ss) =>
          ss.id === scheduledSceneId ? { ...ss, ...updates } : ss
        ),
      };
    });

    const updatedSchedule = updatedSchedules.find((s) => s.id === schedule.id)!;
    const recalculated = recalculateScheduleScores(
      updatedSchedule,
      state.scenes,
      state.actors,
      state.props,
      state.rooms,
      state.availability,
      state.leavePeriods
    );

    set({
      schedules: updatedSchedules.map((s) =>
        s.id === schedule.id ? recalculated : s
      ),
    });
    get().saveToStorage();
  },

  deleteScheduledScene: (scheduledSceneId) => {
    const state = get();
    const schedule = state.schedules.find(
      (s) =>
        s.id === state.currentScheduleId &&
        s.scheduledScenes.some((ss) => ss.id === scheduledSceneId)
    );

    if (!schedule) return;

    const updatedSchedules = state.schedules.map((s) => {
      if (s.id !== schedule.id) return s;
      return {
        ...s,
        scheduledScenes: s.scheduledScenes.filter(
          (ss) => ss.id !== scheduledSceneId
        ),
      };
    });

    const updatedSchedule = updatedSchedules.find((s) => s.id === schedule.id)!;
    const recalculated = recalculateScheduleScores(
      updatedSchedule,
      state.scenes,
      state.actors,
      state.props,
      state.rooms,
      state.availability,
      state.leavePeriods
    );

    set({
      schedules: updatedSchedules.map((s) =>
        s.id === schedule.id ? recalculated : s
      ),
    });
    get().saveToStorage();
  },

  addScheduledScene: (scheduleId, sceneId, roomId, date, startTimeStr) => {
    const state = get();
    const scene = state.scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    const startTime = combineDateAndTime(date, startTimeStr);
    const endTime = addMinutes(startTime, scene.durationMinutes);

    const newScheduledScene: ScheduledScene = {
      id: generateId(),
      sceneId,
      roomId,
      startTime: formatDateTime(startTime),
      endTime: formatDateTime(endTime),
    };

    const updatedSchedules = state.schedules.map((s) => {
      if (s.id !== scheduleId) return s;
      return {
        ...s,
        scheduledScenes: [...s.scheduledScenes, newScheduledScene],
      };
    });

    const updatedSchedule = updatedSchedules.find((s) => s.id === scheduleId)!;
    const recalculated = recalculateScheduleScores(
      updatedSchedule,
      state.scenes,
      state.actors,
      state.props,
      state.rooms,
      state.availability,
      state.leavePeriods
    );

    set({
      schedules: updatedSchedules.map((s) =>
        s.id === scheduleId ? recalculated : s
      ),
    });
    get().saveToStorage();
  },

  recalculateScheduleScores: (scheduleId) => {
    const state = get();
    const schedule = state.schedules.find((s) => s.id === scheduleId);
    if (!schedule) return;

    const recalculated = recalculateScheduleScores(
      schedule,
      state.scenes,
      state.actors,
      state.props,
      state.rooms,
      state.availability,
      state.leavePeriods
    );

    set({
      schedules: state.schedules.map((s) =>
        s.id === scheduleId ? recalculated : s
      ),
    });
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
  setZoomLevel: (level) => set({ zoomLevel: level }),

  importData: (data) => {
    set({
      productions: data.productions || [],
      scenes: data.scenes || [],
      roles: data.roles || [],
      props: data.props || [],
      propBorrowRecords: data.propBorrowRecords || [],
      actors: data.actors || [],
      availability: data.availability || [],
      leavePeriods: data.leavePeriods || [],
      rooms: data.rooms || [],
      schedules: data.schedules || [],
      currentProductionId: data.productions?.[0]?.id || null,
      currentScheduleId: null,
      candidates: [],
    });
    get().saveToStorage();
  },

  exportData: (): FullData => {
    const state = get();
    return {
      version: DATA_VERSION,
      exportedAt: new Date().toISOString(),
      productions: state.productions,
      scenes: state.scenes,
      roles: state.roles,
      props: state.props,
      propBorrowRecords: state.propBorrowRecords,
      actors: state.actors,
      availability: state.availability,
      leavePeriods: state.leavePeriods,
      rooms: state.rooms,
      schedules: state.schedules,
    };
  },

  resetToSampleData: () => {
    set({
      productions: sampleProductions,
      scenes: sampleScenes,
      roles: sampleRoles,
      props: sampleProps,
      propBorrowRecords: [],
      actors: sampleActors,
      availability: sampleAvailability,
      leavePeriods: [],
      rooms: sampleRooms,
      schedules: [],
      currentProductionId: sampleProductions[0]?.id || null,
      currentScheduleId: null,
      candidates: [],
    });
    get().saveToStorage();
  },

  clearAllData: () => {
    set({
      productions: [],
      scenes: [],
      roles: [],
      props: [],
      propBorrowRecords: [],
      actors: [],
      availability: [],
      leavePeriods: [],
      rooms: [],
      schedules: [],
      currentProductionId: null,
      currentScheduleId: null,
      candidates: [],
    });
    get().saveToStorage();
  },
}));
