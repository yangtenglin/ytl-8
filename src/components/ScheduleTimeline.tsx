import { useMemo, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { parseISO, format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  ScheduledScene,
  Scene,
  RehearsalRoom,
  Conflict,
  Actor,
} from '../types';
import {
  formatDisplayDate,
  formatTime,
  getDatesInRange,
  getTimeMinutesFromMidnight,
} from '../utils/time';
import { Clock, User, Package, AlertTriangle, GripVertical, X } from 'lucide-react';

interface ScheduleTimelineProps {
  scheduledScenes: ScheduledScene[];
  scenes: Scene[];
  rooms: RehearsalRoom[];
  actors: Actor[];
  conflicts: Conflict[];
  startDate: string;
  endDate: string;
  onMoveScene: (
    scheduledSceneId: string,
    newDate: string,
    newTime: string,
    newRoomId: string
  ) => void;
  onDeleteScene: (scheduledSceneId: string) => void;
  zoomLevel: 'day' | 'week';
}

const TIMELINE_START_HOUR = 9;
const TIMELINE_END_HOUR = 23;
const PIXELS_PER_MINUTE = 1.2;

interface DraggableSceneBlockProps {
  scheduledScene: ScheduledScene;
  scene: Scene | undefined;
  room: RehearsalRoom | undefined;
  hasConflict: boolean;
  actorsInScene: Actor[];
  onDelete: () => void;
}

function DraggableSceneBlock({
  scheduledScene,
  scene,
  hasConflict,
  actorsInScene,
  onDelete,
}: DraggableSceneBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: scheduledScene.id,
    data: {
      type: 'scheduled-scene',
      scheduledScene,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!scene) return null;

  const startMinutes =
    getTimeMinutesFromMidnight(formatTime(scheduledScene.startTime)) -
    TIMELINE_START_HOUR * 60;
  const durationMinutes = scene.durationMinutes;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        top: `${startMinutes * PIXELS_PER_MINUTE}px`,
        height: `${Math.max(durationMinutes * PIXELS_PER_MINUTE, 36)}px`,
      }}
      className={`absolute left-1 right-1 rounded-md p-2 cursor-move overflow-hidden transition-all ${
        hasConflict
          ? 'bg-theater-burgundy-500/80 border border-theater-burgundy-400 animate-conflict-blink'
          : 'bg-gradient-to-br from-theater-burgundy-700 to-theater-burgundy-800 border border-theater-burgundy-500/50 hover:border-theater-gold-500/50 hover:shadow-lg'
      }`}
    >
      <div className="flex items-start gap-2 h-full">
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 text-theater-gold-400/60 hover:text-theater-gold-400 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 mt-0.5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-serif font-semibold text-theater-parchment-100 text-sm truncate">
              {scene.name}
            </h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex-shrink-0 p-0.5 rounded hover:bg-theater-burgundy-500/50 text-theater-parchment-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-theater-parchment-300 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(scheduledScene.startTime)} -{' '}
              {formatTime(scheduledScene.endTime)}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {actorsInScene.length}
            </span>
            {hasConflict && (
              <span className="flex items-center gap-1 text-theater-gold-300">
                <AlertTriangle className="w-3 h-3" />
              </span>
            )}
          </div>

          {durationMinutes > 45 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {actorsInScene.slice(0, 3).map((actor) => (
                <span
                  key={actor.id}
                  className="px-1.5 py-0.5 text-xs bg-theater-ink-800/50 rounded text-theater-parchment-300 truncate max-w-[80px]"
                >
                  {actor.name}
                </span>
              ))}
              {actorsInScene.length > 3 && (
                <span className="px-1.5 py-0.5 text-xs bg-theater-ink-800/50 rounded text-theater-parchment-400">
                  +{actorsInScene.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ScheduleTimeline({
  scheduledScenes,
  scenes,
  rooms,
  actors,
  conflicts,
  startDate,
  endDate,
  onMoveScene,
  onDeleteScene,
  zoomLevel,
}: ScheduleTimelineProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const dates = useMemo(() => {
    if (zoomLevel === 'day') {
      return [startDate];
    }
    const weekStart = startOfWeek(parseISO(startDate), { weekStartsOn: 1 });
    return getDatesInRange(
      format(weekStart, 'yyyy-MM-dd'),
      format(addDays(weekStart, 6), 'yyyy-MM-dd')
    );
  }, [startDate, zoomLevel]);

  const timelineHeight =
    (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60 * PIXELS_PER_MINUTE;

  const conflictingSceneIds = useMemo(() => {
    const ids = new Set<string>();
    for (const conflict of conflicts) {
      for (const id of conflict.involvedScheduledSceneIds) {
        ids.add(id);
      }
    }
    return ids;
  }, [conflicts]);

  const getActorsForScheduledScene = (scheduledScene: ScheduledScene) => {
    const scene = scenes.find((s) => s.id === scheduledScene.sceneId);
    if (!scene) return [];
    return actors.filter((actor) =>
      actor.roleAssignments.some(
        (ra) =>
          ra.productionId === scene.productionId &&
          scene.roleIds.includes(ra.roleId)
      )
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    const { active, over } = event;
    if (!over) return;

    const scheduledScene = scheduledScenes.find(
      (ss) => ss.id === active.id
    );
    if (!scheduledScene) return;

    const overData = over.data.current;
    if (!overData || overData.type !== 'drop-zone') return;

    const { date, roomId } = overData;
    if (!date || !roomId) return;

    const rect = (event.activatorEvent as MouseEvent).target?.getBoundingClientRect?.();
    const overRect = document
      .getElementById(`dropzone-${date}-${roomId}`)
      ?.getBoundingClientRect();

    if (!overRect || !rect) return;

    const relativeY =
      (event.activatorEvent as MouseEvent).clientY - overRect.top;
    const minutesFromStart = Math.round(
      relativeY / PIXELS_PER_MINUTE / 30
    ) * 30;
    const totalMinutes = TIMELINE_START_HOUR * 60 + minutesFromStart;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

    onMoveScene(scheduledScene.id, date, timeStr, roomId);
  };

  const activeScheduledScene = scheduledScenes.find(
    (ss) => ss.id === activeId
  );
  const activeScene = activeScheduledScene
    ? scenes.find((s) => s.id === activeScheduledScene.sceneId)
    : null;

  const timeLabels = useMemo(() => {
    const labels = [];
    for (let h = TIMELINE_START_HOUR; h <= TIMELINE_END_HOUR; h += 2) {
      labels.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return labels;
  }, []);

  return (
    <div className="card p-0 overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto scrollbar-thin">
          <div
            className="min-w-max"
            style={{ minWidth: `${dates.length * 280 + 80}px` }}
          >
            <div className="flex border-b border-theater-ink-600">
              <div className="w-20 flex-shrink-0 border-r border-theater-ink-600" />

              {dates.map((date) => (
                <div
                  key={date}
                  className="flex-1 min-w-[280px] border-r border-theater-ink-600 last:border-r-0"
                >
                  <div className="px-3 py-2 text-center border-b border-theater-ink-600 bg-theater-ink-800">
                    <p className="font-serif font-semibold text-theater-parchment-100">
                      {formatDisplayDate(date)}
                    </p>
                    <p className="text-xs text-theater-ink-400">
                      {format(parseISO(date), 'EEEE', { locale: zhCN })}
                    </p>
                  </div>

                  <div className="flex">
                    {rooms.map((room) => (
                      <div
                        key={room.id}
                        className="flex-1 border-r border-theater-ink-600/50 last:border-r-0 px-2 py-1 text-center bg-theater-ink-700/30"
                      >
                        <p className="text-xs font-medium text-theater-parchment-300">
                          {room.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="relative flex">
              <div className="w-20 flex-shrink-0 border-r border-theater-ink-600 bg-theater-ink-800/50">
                {timeLabels.map((time, idx) => (
                  <div
                    key={time}
                    className="absolute right-2 text-xs text-theater-ink-400"
                    style={{
                      top: `${idx * 2 * 60 * PIXELS_PER_MINUTE - 6}px`,
                    }}
                  >
                    {time}
                  </div>
                ))}
              </div>

              {dates.map((date) => (
                <div
                  key={date}
                  className="flex-1 min-w-[280px] border-r border-theater-ink-600 last:border-r-0"
                >
                  <div className="flex h-full">
                    {rooms.map((room) => {
                      const roomScenes = scheduledScenes.filter(
                        (ss) =>
                          ss.roomId === room.id &&
                          isSameDay(parseISO(ss.startTime), parseISO(date))
                      );

                      return (
                        <div
                          key={room.id}
                          id={`dropzone-${date}-${room.id}`}
                          data-type="drop-zone"
                          data-date={date}
                          data-room-id={room.id}
                          className="relative flex-1 border-r border-theater-ink-600/30 last:border-r-0 gantt-grid"
                          style={{ height: `${timelineHeight}px` }}
                        >
                          <SortableContext
                            items={roomScenes.map((ss) => ss.id)}
                            strategy={rectSortingStrategy}
                          >
                            {roomScenes.map((scheduledScene) => (
                              <DraggableSceneBlock
                                key={scheduledScene.id}
                                scheduledScene={scheduledScene}
                                scene={scenes.find(
                                  (s) => s.id === scheduledScene.sceneId
                                )}
                                room={rooms.find(
                                  (r) => r.id === scheduledScene.roomId
                                )}
                                hasConflict={conflictingSceneIds.has(
                                  scheduledScene.id
                                )}
                                actorsInScene={getActorsForScheduledScene(
                                  scheduledScene
                                )}
                                onDelete={() =>
                                  onDeleteScene(scheduledScene.id)
                                }
                              />
                            ))}
                          </SortableContext>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId && activeScheduledScene && activeScene ? (
            <div
              className={`rounded-md p-2 opacity-80 shadow-2xl ${
                conflictingSceneIds.has(activeId)
                  ? 'bg-theater-burgundy-500 border border-theater-burgundy-400'
                  : 'bg-gradient-to-br from-theater-burgundy-700 to-theater-burgundy-800 border border-theater-gold-500/50'
              }`}
              style={{
                width: '200px',
                minHeight: `${Math.max(activeScene.durationMinutes * PIXELS_PER_MINUTE, 40)}px`,
              }}
            >
              <div className="flex items-start gap-2">
                <GripVertical className="w-4 h-4 text-theater-gold-400/60 mt-0.5" />
                <div>
                  <h4 className="font-serif font-semibold text-theater-parchment-100 text-sm">
                    {activeScene.name}
                  </h4>
                  <p className="text-xs text-theater-parchment-300 mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {formatTime(activeScheduledScene.startTime)} -{' '}
                    {formatTime(activeScheduledScene.endTime)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
