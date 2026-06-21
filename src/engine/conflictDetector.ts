import {
  Scene,
  Actor,
  ScheduledScene,
  Conflict,
  AvailabilitySlot,
  Prop,
  CONFLICT_WEIGHTS,
  RehearsalRoom,
  LeavePeriod,
  Role,
  RoomUnavailability,
} from '../types';
import {
  isTimeOverlap,
  getDayOfWeek,
  formatTime,
  formatDisplayDateTime,
  generateId,
  getTimeMinutesFromMidnight,
} from '../utils/time';
import { parseISO, isBefore } from 'date-fns';

function getActorsForScene(
  scene: Scene,
  actors: Actor[],
  productionId: string
): Actor[] {
  return actors.filter((actor) =>
    actor.roleAssignments.some(
      (ra) =>
        ra.productionId === productionId && scene.roleIds.includes(ra.roleId)
    )
  );
}

function checkActorConflicts(
  scheduledScenes: ScheduledScene[],
  scenes: Scene[],
  actors: Actor[],
  productionId: string
): Conflict[] {
  const conflicts: Conflict[] = [];

  for (let i = 0; i < scheduledScenes.length; i++) {
    for (let j = i + 1; j < scheduledScenes.length; j++) {
      const ss1 = scheduledScenes[i];
      const ss2 = scheduledScenes[j];

      if (
        !isTimeOverlap(ss1.startTime, ss1.endTime, ss2.startTime, ss2.endTime)
      ) {
        continue;
      }

      const scene1 = scenes.find((s) => s.id === ss1.sceneId);
      const scene2 = scenes.find((s) => s.id === ss2.sceneId);
      if (!scene1 || !scene2) continue;

      const actors1 = getActorsForScene(scene1, actors, productionId);
      const actors2 = getActorsForScene(scene2, actors, productionId);

      const overlappingActors = actors1.filter((a1) =>
        actors2.some((a2) => a2.id === a1.id)
      );

      for (const actor of overlappingActors) {
        conflicts.push({
          id: generateId(),
          type: 'actor',
          severity: 'error',
          description: `演员「${actor.name}」在${formatDisplayDateTime(ss1.startTime)}同时出现在「${scene1.name}」和「${scene2.name}」`,
          involvedScheduledSceneIds: [ss1.id, ss2.id],
          details: {
            actorId: actor.id,
            actorName: actor.name,
            scene1Id: scene1.id,
            scene2Id: scene2.id,
          },
        });
      }
    }
  }

  return conflicts;
}

function checkPropConflicts(
  scheduledScenes: ScheduledScene[],
  scenes: Scene[],
  props: Prop[]
): Conflict[] {
  const conflicts: Conflict[] = [];

  for (let i = 0; i < scheduledScenes.length; i++) {
    for (let j = i + 1; j < scheduledScenes.length; j++) {
      const ss1 = scheduledScenes[i];
      const ss2 = scheduledScenes[j];

      if (
        !isTimeOverlap(ss1.startTime, ss1.endTime, ss2.startTime, ss2.endTime)
      ) {
        continue;
      }

      const scene1 = scenes.find((s) => s.id === ss1.sceneId);
      const scene2 = scenes.find((s) => s.id === ss2.sceneId);
      if (!scene1 || !scene2) continue;

      const overlappingProps = scene1.propIds.filter((pid) =>
        scene2.propIds.includes(pid)
      );

      for (const propId of overlappingProps) {
        const prop = props.find((p) => p.id === propId);
        if (!prop) continue;

        if (prop.totalQuantity < 2) {
          conflicts.push({
            id: generateId(),
            type: 'prop',
            severity: 'error',
            description: `道具「${prop.name}」数量不足，在${formatDisplayDateTime(ss1.startTime)}同时被「${scene1.name}」和「${scene2.name}」使用`,
            involvedScheduledSceneIds: [ss1.id, ss2.id],
            details: {
              propId: prop.id,
              propName: prop.name,
              scene1Id: scene1.id,
              scene2Id: scene2.id,
            },
          });
        }
      }
    }
  }

  return conflicts;
}

function checkDependencyConflicts(
  scheduledScenes: ScheduledScene[],
  scenes: Scene[]
): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const ss of scheduledScenes) {
    const scene = scenes.find((s) => s.id === ss.sceneId);
    if (!scene) continue;

    for (const depSceneId of scene.dependsOnSceneIds) {
      const depScheduled = scheduledScenes.find(
        (s) => s.sceneId === depSceneId
      );
      if (!depScheduled) continue;

      const ssStart = parseISO(ss.startTime);
      const depEnd = parseISO(depScheduled.endTime);

      if (isBefore(ssStart, depEnd)) {
        const depScene = scenes.find((s) => s.id === depSceneId);
        conflicts.push({
          id: generateId(),
          type: 'dependency',
          severity: 'error',
          description: `场次「${scene.name}」依赖的「${depScene?.name || '前置场次'}」尚未结束（${formatDisplayDateTime(depScheduled.endTime)}）就已开始（${formatDisplayDateTime(ss.startTime)}）`,
          involvedScheduledSceneIds: [ss.id, depScheduled.id],
          details: {
            dependentSceneId: scene.id,
            dependencySceneId: depSceneId,
          },
        });
      }
    }
  }

  return conflicts;
}

function checkRoomConflicts(scheduledScenes: ScheduledScene[]): Conflict[] {
  const conflicts: Conflict[] = [];

  const byRoom = new Map<string, ScheduledScene[]>();
  for (const ss of scheduledScenes) {
    const list = byRoom.get(ss.roomId) || [];
    list.push(ss);
    byRoom.set(ss.roomId, list);
  }

  for (const [roomId, roomScenes] of byRoom) {
    for (let i = 0; i < roomScenes.length; i++) {
      for (let j = i + 1; j < roomScenes.length; j++) {
        const ss1 = roomScenes[i];
        const ss2 = roomScenes[j];

        if (
          isTimeOverlap(ss1.startTime, ss1.endTime, ss2.startTime, ss2.endTime)
        ) {
          conflicts.push({
            id: generateId(),
            type: 'room',
            severity: 'error',
            description: `排练室在${formatDisplayDateTime(ss1.startTime)}被同时占用`,
            involvedScheduledSceneIds: [ss1.id, ss2.id],
            details: {
              roomId,
              scene1Id: ss1.sceneId,
              scene2Id: ss2.sceneId,
            },
          });
        }
      }
    }
  }

  return conflicts;
}

function checkAvailabilityConflicts(
  scheduledScenes: ScheduledScene[],
  scenes: Scene[],
  actors: Actor[],
  availability: AvailabilitySlot[],
  productionId: string
): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const ss of scheduledScenes) {
    const scene = scenes.find((s) => s.id === ss.sceneId);
    if (!scene) continue;

    const actorsInScene = getActorsForScene(scene, actors, productionId);
    const ssDay = getDayOfWeek(ss.startTime);
    const ssStartTime = formatTime(ss.startTime);
    const ssEndTime = formatTime(ss.endTime);

    for (const actor of actorsInScene) {
      const actorSlots = availability.filter(
        (slot) => slot.actorId === actor.id && slot.dayOfWeek === ssDay
      );

      let fullyCovered = false;
      let isPreferred = true;

      for (const slot of actorSlots) {
        if (slot.type === 'unavailable') continue;

        const ssStartMin = getTimeMinutesFromMidnight(ssStartTime);
        const ssEndMin = getTimeMinutesFromMidnight(ssEndTime);
        const slotStartMin = getTimeMinutesFromMidnight(slot.startTime);
        const slotEndMin = getTimeMinutesFromMidnight(slot.endTime);

        if (ssStartMin >= slotStartMin && ssEndMin <= slotEndMin) {
          fullyCovered = true;
          if (slot.type !== 'preferred') {
            isPreferred = false;
          }
        }
      }

      if (!fullyCovered && actorSlots.length > 0) {
        conflicts.push({
          id: generateId(),
          type: 'availability',
          severity: 'error',
          description: `演员「${actor.name}」在${formatDisplayDateTime(ss.startTime)}没有可用档期`,
          involvedScheduledSceneIds: [ss.id],
          details: {
            actorId: actor.id,
            actorName: actor.name,
            sceneId: scene.id,
          },
        });
      } else if (fullyCovered && !isPreferred) {
        conflicts.push({
          id: generateId(),
          type: 'availability',
          severity: 'warning',
          description: `演员「${actor.name}」在${formatDisplayDateTime(ss.startTime)}处于非优选时段`,
          involvedScheduledSceneIds: [ss.id],
          details: {
            actorId: actor.id,
            actorName: actor.name,
            sceneId: scene.id,
          },
        });
      }
    }
  }

  return conflicts;
}

function checkLeaveConflicts(
  scheduledScenes: ScheduledScene[],
  scenes: Scene[],
  actors: Actor[],
  leavePeriods: LeavePeriod[],
  productionId: string,
  roles: Role[]
): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const ss of scheduledScenes) {
    const scene = scenes.find((s) => s.id === ss.sceneId);
    if (!scene) continue;

    const actorsInScene = getActorsForScene(scene, actors, productionId);
    const ssStart = ss.startTime;
    const ssEnd = ss.endTime;

    for (const actor of actorsInScene) {
      const actorLeaves = leavePeriods.filter((lp) => lp.actorId === actor.id);

      for (const leave of actorLeaves) {
        if (isTimeOverlap(ssStart, ssEnd, leave.startTime, leave.endTime)) {
          const overlappingRoles = roles.filter((r) =>
            scene.roleIds.includes(r.id) &&
            actor.roleAssignments.some(
              (ra) => ra.roleId === r.id && ra.productionId === productionId
            )
          );

          const roleWeight = overlappingRoles.length > 0 ? overlappingRoles.length : 1;

          conflicts.push({
            id: generateId(),
            type: 'leave',
            severity: 'error',
            description: `演员「${actor.name}」请假时段与「${scene.name}」冲突${overlappingRoles.length > 0 ? `（缺席角色：${overlappingRoles.map((r) => r.name).join('、')}，加权×${roleWeight}）` : ''}`,
            involvedScheduledSceneIds: [ss.id],
            details: {
              actorId: actor.id,
              actorName: actor.name,
              sceneId: scene.id,
              leaveId: leave.id,
              roleIds: overlappingRoles.map((r) => r.id),
              roleWeight,
            },
          });
        }
      }
    }
  }

  return conflicts;
}

function getRoomUnavailabilityLabel(type: string): string {
  switch (type) {
    case 'maintenance':
      return '检修';
    case 'closed':
      return '停用';
    default:
      return '不可用';
  }
}

function checkRoomUnavailabilityConflicts(
  scheduledScenes: ScheduledScene[],
  scenes: Scene[],
  rooms: RehearsalRoom[],
  roomUnavailabilities: RoomUnavailability[]
): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const ss of scheduledScenes) {
    const scene = scenes.find((s) => s.id === ss.sceneId);
    if (!scene) continue;

    const room = rooms.find((r) => r.id === ss.roomId);
    const roomUnavailList = roomUnavailabilities.filter((ru) => ru.roomId === ss.roomId);

    for (const ru of roomUnavailList) {
      if (isTimeOverlap(ss.startTime, ss.endTime, ru.startTime, ru.endTime)) {
        const label = getRoomUnavailabilityLabel(ru.type);
        conflicts.push({
          id: generateId(),
          type: 'room-unavailable',
          severity: 'error',
          description: `「${room?.name || '排练厅'}」${label}时段与「${scene.name}」冲突（${formatDisplayDateTime(ru.startTime)} - ${formatDisplayDateTime(ru.endTime)}${ru.reason ? ` · ${ru.reason}` : ''}）`,
          involvedScheduledSceneIds: [ss.id],
          details: {
            roomId: ss.roomId,
            roomName: room?.name || '',
            sceneId: scene.id,
            roomUnavailabilityId: ru.id,
            unavailabilityType: ru.type,
            reason: ru.reason || '',
          },
        });
      }
    }
  }

  return conflicts;
}

export function detectAllConflicts(
  scheduledScenes: ScheduledScene[],
  scenes: Scene[],
  actors: Actor[],
  props: Prop[],
  rooms: RehearsalRoom[],
  availability: AvailabilitySlot[],
  productionId: string,
  leavePeriods: LeavePeriod[] = [],
  roles: Role[] = [],
  roomUnavailabilities: RoomUnavailability[] = []
): Conflict[] {
  return [
    ...checkActorConflicts(scheduledScenes, scenes, actors, productionId),
    ...checkPropConflicts(scheduledScenes, scenes, props),
    ...checkDependencyConflicts(scheduledScenes, scenes),
    ...checkRoomConflicts(scheduledScenes),
    ...checkAvailabilityConflicts(
      scheduledScenes,
      scenes,
      actors,
      availability,
      productionId
    ),
    ...checkLeaveConflicts(
      scheduledScenes,
      scenes,
      actors,
      leavePeriods,
      productionId,
      roles
    ),
    ...checkRoomUnavailabilityConflicts(
      scheduledScenes,
      scenes,
      rooms,
      roomUnavailabilities
    ),
  ];
}

export function calculateConflictScore(
  conflicts: Conflict[],
  customWeights?: Partial<typeof CONFLICT_WEIGHTS>
): number {
  const weights = { ...CONFLICT_WEIGHTS, ...customWeights };
  return conflicts.reduce((score, conflict) => {
    const weight = weights[conflict.type];
    const severityMultiplier = conflict.severity === 'error' ? 1 : 0.3;
    const roleWeight =
      conflict.type === 'leave' && conflict.details?.roleWeight
        ? (conflict.details.roleWeight as number)
        : 1;
    return score + weight * severityMultiplier * roleWeight;
  }, 0);
}
