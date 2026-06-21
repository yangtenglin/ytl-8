import {
  Scene,
  Actor,
  Prop,
  RehearsalRoom,
  AvailabilitySlot,
  ScheduledScene,
  Schedule,
  ScheduleCandidate,
  GenerateOptions,
  Conflict,
  LeavePeriod,
  Role,
  RoomUnavailability,
} from '../types';
import {
  generateId,
  formatDateTime,
  combineDateAndTime,
  getDatesInRange,
  formatDate,
} from '../utils/time';
import { detectAllConflicts, calculateConflictScore } from './conflictDetector';
import { calculateGapScore, calculateTotalScore } from './scoring';
import { parseISO, isBefore, isAfter, addMinutes } from 'date-fns';

interface SchedulingContext {
  scenes: Scene[];
  actors: Actor[];
  props: Prop[];
  rooms: RehearsalRoom[];
  availability: AvailabilitySlot[];
  leavePeriods: LeavePeriod[];
  roomUnavailabilities: RoomUnavailability[];
  roles: Role[];
  productionId: string;
  options: GenerateOptions;
}

function getSceneDependencyDepth(
  scene: Scene,
  scenes: Scene[],
  visited: Set<string> = new Set()
): number {
  if (visited.has(scene.id)) return 0;
  visited.add(scene.id);

  if (scene.dependsOnSceneIds.length === 0) return 0;

  let maxDepth = 0;
  for (const depId of scene.dependsOnSceneIds) {
    const depScene = scenes.find((s) => s.id === depId);
    if (depScene) {
      const depth = getSceneDependencyDepth(depScene, scenes, visited) + 1;
      maxDepth = Math.max(maxDepth, depth);
    }
  }
  return maxDepth;
}

function sortScenesByPriority(scenes: Scene[]): Scene[] {
  return [...scenes].sort((a, b) => {
    const depthA = getSceneDependencyDepth(a, scenes);
    const depthB = getSceneDependencyDepth(b, scenes);
    if (depthB !== depthA) return depthB - depthA;

    const actorCountA = a.roleIds.length;
    const actorCountB = b.roleIds.length;
    if (actorCountB !== actorCountA) return actorCountB - actorCountA;

    const propCountA = a.propIds.length;
    const propCountB = b.propIds.length;
    return propCountB - propCountA;
  });
}

function checkAssignmentConflicts(
  candidate: ScheduledScene,
  assigned: ScheduledScene[],
  ctx: SchedulingContext
): Conflict[] {
  return detectAllConflicts(
    [...assigned, candidate],
    ctx.scenes,
    ctx.actors,
    ctx.props,
    ctx.rooms,
    ctx.availability,
    ctx.productionId,
    ctx.leavePeriods,
    ctx.roles
  ).filter((c) => c.involvedScheduledSceneIds.includes(candidate.id));
}

function generateCandidateAssignments(
  scene: Scene,
  assigned: ScheduledScene[],
  ctx: SchedulingContext
): ScheduledScene[] {
  const candidates: ScheduledScene[] = [];
  const dates = getDatesInRange(ctx.options.startDate, ctx.options.endDate);

  for (const date of dates) {
    for (const room of ctx.rooms) {
      const roomUnavailList = ctx.roomUnavailabilities.filter(
        (ru) => ru.roomId === room.id
      );

      const dayStartMinutes =
        parseInt(ctx.options.dailyStartTime.split(':')[0]) * 60 +
        parseInt(ctx.options.dailyStartTime.split(':')[1]);
      const dayEndMinutes =
        parseInt(ctx.options.dailyEndTime.split(':')[0]) * 60 +
        parseInt(ctx.options.dailyEndTime.split(':')[1]);

      let currentMinutes = dayStartMinutes;
      while (currentMinutes + scene.durationMinutes <= dayEndMinutes) {
        const hours = Math.floor(currentMinutes / 60);
        const mins = currentMinutes % 60;
        const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

        const startTime = combineDateAndTime(date, timeStr);
        const endTime = addMinutes(startTime, scene.durationMinutes);

        const hasRoomUnavailabilityConflict = roomUnavailList.some((ru) =>
          isBefore(parseISO(ru.startTime), endTime) &&
          isAfter(parseISO(ru.endTime), startTime)
        );

        if (hasRoomUnavailabilityConflict) {
          currentMinutes += 30;
          continue;
        }

        const scheduledScene: ScheduledScene = {
          id: generateId(),
          sceneId: scene.id,
          roomId: room.id,
          startTime: formatDateTime(startTime),
          endTime: formatDateTime(endTime),
        };

        const dependenciesMet = scene.dependsOnSceneIds.every((depId) => {
          const depScheduled = assigned.find((s) => s.sceneId === depId);
          if (!depScheduled) return false;
          return isBefore(parseISO(depScheduled.endTime), startTime);
        });

        if (dependenciesMet) {
          const conflicts = checkAssignmentConflicts(
            scheduledScene,
            assigned,
            ctx
          );
          if (conflicts.filter((c) => c.severity === 'error').length === 0) {
            candidates.push(scheduledScene);
          }
        }

        currentMinutes += 30;
      }
    }
  }

  return candidates.sort((a, b) => {
    const conflictsA = checkAssignmentConflicts(a, assigned, ctx).length;
    const conflictsB = checkAssignmentConflicts(b, assigned, ctx).length;
    return conflictsA - conflictsB;
  });
}

function backtrackSchedule(
  remainingScenes: Scene[],
  currentAssignment: ScheduledScene[],
  ctx: SchedulingContext,
  maxSolutions: number,
  solutions: ScheduledScene[][]
): void {
  if (solutions.length >= maxSolutions) return;

  if (remainingScenes.length === 0) {
    solutions.push([...currentAssignment]);
    return;
  }

  const [currentScene, ...restScenes] = remainingScenes;
  const candidates = generateCandidateAssignments(
    currentScene,
    currentAssignment,
    ctx
  );

  for (const candidate of candidates) {
    if (solutions.length >= maxSolutions) break;

    const errors = checkAssignmentConflicts(candidate, currentAssignment, ctx)
      .filter((c) => c.severity === 'error');

    if (errors.length === 0) {
      currentAssignment.push(candidate);
      backtrackSchedule(
        restScenes,
        currentAssignment,
        ctx,
        maxSolutions,
        solutions
      );
      currentAssignment.pop();
    }
  }
}

export function generateScheduleCandidates(
  options: GenerateOptions,
  scenes: Scene[],
  actors: Actor[],
  props: Prop[],
  rooms: RehearsalRoom[],
  availability: AvailabilitySlot[],
  leavePeriods: LeavePeriod[] = [],
  roles: Role[] = [],
  roomUnavailabilities: RoomUnavailability[] = []
): ScheduleCandidate[] {
  const productionScenes = scenes.filter(
    (s) => s.productionId === options.productionId
  );

  if (productionScenes.length === 0 || rooms.length === 0) {
    return [];
  }

  const ctx: SchedulingContext = {
    scenes,
    actors,
    props,
    rooms,
    availability,
    leavePeriods,
    roomUnavailabilities,
    roles,
    productionId: options.productionId,
    options,
  };

  const sortedScenes = sortScenesByPriority(productionScenes);
  const solutions: ScheduledScene[][] = [];

  const maxAttempts = options.candidateCount * 3;
  for (let attempt = 0; attempt < maxAttempts && solutions.length < options.candidateCount; attempt++) {
    const shuffledScenes = [...sortedScenes];
    if (attempt > 0) {
      for (let i = shuffledScenes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledScenes[i], shuffledScenes[j]] = [shuffledScenes[j], shuffledScenes[i]];
      }
      shuffledScenes.sort((a, b) => {
        const depthA = getSceneDependencyDepth(a, scenes);
        const depthB = getSceneDependencyDepth(b, scenes);
        return depthB - depthA;
      });
    }

    backtrackSchedule(
      shuffledScenes,
      [],
      ctx,
      solutions.length + 1,
      solutions
    );
  }

  const candidates: ScheduleCandidate[] = solutions
    .map((scheduledScenes, index) => {
      const conflicts = detectAllConflicts(
        scheduledScenes,
        scenes,
        actors,
        props,
        rooms,
        availability,
        options.productionId,
        leavePeriods,
        roles,
        roomUnavailabilities
      );
      const conflictScore = calculateConflictScore(conflicts);
      const { score: gapScore } = calculateGapScore(scheduledScenes);
      const totalScore = calculateTotalScore(conflictScore, gapScore);

      const schedule: Schedule = {
        id: generateId(),
        name: `方案 ${index + 1}`,
        productionId: options.productionId,
        startDate: options.startDate,
        endDate: options.endDate,
        scheduledScenes,
        conflictScore,
        gapScore,
        conflicts,
      };

      return {
        id: generateId(),
        schedule,
        totalScore,
        rank: 0,
      };
    })
    .sort((a, b) => a.totalScore - b.totalScore)
    .map((c, index) => ({ ...c, rank: index + 1 }));

  return candidates;
}

export function recalculateScheduleScores(
  schedule: Schedule,
  scenes: Scene[],
  actors: Actor[],
  props: Prop[],
  rooms: RehearsalRoom[],
  availability: AvailabilitySlot[],
  leavePeriods: LeavePeriod[] = [],
  roles: Role[] = [],
  roomUnavailabilities: RoomUnavailability[] = []
): Schedule {
  const conflicts = detectAllConflicts(
    schedule.scheduledScenes,
    scenes,
    actors,
    props,
    rooms,
    availability,
    schedule.productionId,
    leavePeriods,
    roles,
    roomUnavailabilities
  );
  const conflictScore = calculateConflictScore(conflicts);
  const { score: gapScore } = calculateGapScore(schedule.scheduledScenes);

  return {
    ...schedule,
    conflicts,
    conflictScore,
    gapScore,
  };
}
