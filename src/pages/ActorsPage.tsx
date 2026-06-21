import { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  Plus,
  Edit2,
  Trash2,
  User,
  Phone,
  Calendar,
  Clock,
  X,
  Check,
  Star,
  Ban,
  CheckCircle2,
  Users,
  UserRound,
} from 'lucide-react';
import { Actor, AvailabilitySlot, AvailabilityType, Role } from '../types';

const DAYS_OF_WEEK = ['日', '一', '二', '三', '四', '五', '六'];
const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00', '21:00',
];

export default function ActorsPage() {
  const {
    actors,
    roles,
    productions,
    availability,
    addActor,
    updateActor,
    deleteActor,
    setActorAvailability,
  } = useAppStore();

  const [selectedActorId, setSelectedActorId] = useState<string | null>(
    actors[0]?.id || null
  );
  const [showActorModal, setShowActorModal] = useState(false);
  const [editingActor, setEditingActor] = useState<Partial<Actor> & { id?: string }>({
    name: '',
    contact: '',
    roleAssignments: [],
  });
  const [availabilityType, setAvailabilityType] = useState<AvailabilityType>('available');

  const selectedActor = useMemo(
    () => actors.find((a) => a.id === selectedActorId),
    [actors, selectedActorId]
  );

  const actorAvailability = useMemo(
    () => availability.filter((av) => av.actorId === selectedActorId),
    [availability, selectedActorId]
  );

  const availabilityGrid = useMemo(() => {
    const grid: Record<string, AvailabilityType> = {};
    actorAvailability.forEach((slot) => {
      const startHour = parseInt(slot.startTime.split(':')[0]);
      const endHour = parseInt(slot.endTime.split(':')[0]);
      for (let hour = startHour; hour < endHour; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        grid[`${slot.dayOfWeek}-${time}`] = slot.type;
      }
    });
    return grid;
  }, [actorAvailability]);

  const getActorRoles = (actor: Actor) => {
    return actor.roleAssignments.map((ra) => {
      const role = roles.find((r) => r.id === ra.roleId);
      const production = productions.find((p) => p.id === ra.productionId);
      return { role, production };
    }).filter((item): item is { role: Role; production: typeof productions[0] } => 
      item.role !== undefined && item.production !== undefined
    );
  };

  const handleSaveActor = () => {
    if (!editingActor.name?.trim()) return;

    const actorData = {
      name: editingActor.name,
      contact: editingActor.contact || '',
      roleAssignments: editingActor.roleAssignments || [],
    };

    if (editingActor.id) {
      updateActor(editingActor.id, actorData);
    } else {
      addActor(actorData);
    }
    setShowActorModal(false);
    resetActorForm();
  };

  const handleEditActor = (actor: Actor) => {
    setEditingActor({ ...actor });
    setShowActorModal(true);
  };

  const handleDeleteActor = (id: string) => {
    if (confirm('确定要删除这名演员吗？相关的档期也会被清除。')) {
      deleteActor(id);
      if (selectedActorId === id) {
        setSelectedActorId(actors.find((a) => a.id !== id)?.id || null);
      }
    }
  };

  const resetActorForm = () => {
    setEditingActor({
      name: '',
      contact: '',
      roleAssignments: [],
    });
  };

  const toggleAvailability = (dayOfWeek: number, time: string) => {
    if (!selectedActorId) return;

    const key = `${dayOfWeek}-${time}`;
    const currentType = availabilityGrid[key];
    const nextType = availabilityType;

    if (currentType === nextType) {
      const hour = parseInt(time.split(':')[0]);
      const newSlots = actorAvailability
        .map((slot) => {
          if (slot.dayOfWeek !== dayOfWeek) return slot;
          const startHour = parseInt(slot.startTime.split(':')[0]);
          const endHour = parseInt(slot.endTime.split(':')[0]);
          if (hour >= startHour && hour < endHour) {
            const segments: Omit<AvailabilitySlot, 'id' | 'actorId'>[] = [];
            if (startHour < hour) {
              segments.push({
                dayOfWeek: slot.dayOfWeek,
                startTime: `${startHour.toString().padStart(2, '0')}:00`,
                endTime: `${hour.toString().padStart(2, '0')}:00`,
                type: slot.type,
              });
            }
            if (hour + 1 < endHour) {
              segments.push({
                dayOfWeek: slot.dayOfWeek,
                startTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
                endTime: `${endHour.toString().padStart(2, '0')}:00`,
                type: slot.type,
              });
            }
            return segments;
          }
          return slot;
        })
        .flat() as Omit<AvailabilitySlot, 'id' | 'actorId'>[];

      setActorAvailability(selectedActorId, newSlots);
    } else {
      const hour = parseInt(time.split(':')[0]);
      const newSlots: Omit<AvailabilitySlot, 'id' | 'actorId'>[] = [];
      let processed = false;

      actorAvailability.forEach((slot) => {
        if (slot.dayOfWeek !== dayOfWeek || slot.type !== nextType) {
          if (slot.dayOfWeek === dayOfWeek) {
            const startHour = parseInt(slot.startTime.split(':')[0]);
            const endHour = parseInt(slot.endTime.split(':')[0]);
            if (hour >= startHour && hour < endHour) {
              if (startHour < hour) {
                newSlots.push({
                  dayOfWeek: slot.dayOfWeek,
                  startTime: slot.startTime,
                  endTime: `${hour.toString().padStart(2, '0')}:00`,
                  type: slot.type,
                });
              }
              if (hour + 1 < endHour) {
                newSlots.push({
                  dayOfWeek: slot.dayOfWeek,
                  startTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
                  endTime: slot.endTime,
                  type: slot.type,
                });
              }
              processed = true;
              return;
            }
          }
          newSlots.push(slot);
          return;
        }

        const startHour = parseInt(slot.startTime.split(':')[0]);
        const endHour = parseInt(slot.endTime.split(':')[0]);

        if (hour === endHour) {
          newSlots.push({
            ...slot,
            endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
          });
          processed = true;
        } else if (hour + 1 === startHour) {
          newSlots.push({
            ...slot,
            startTime: `${hour.toString().padStart(2, '0')}:00`,
          });
          processed = true;
        } else if (hour >= startHour && hour < endHour) {
          newSlots.push(slot);
          processed = true;
        } else {
          newSlots.push(slot);
        }
      });

      if (!processed) {
        newSlots.push({
          dayOfWeek: dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          startTime: time,
          endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
          type: nextType,
        });
      }

      const mergedSlots = mergeAdjacentSlots(newSlots);
      setActorAvailability(selectedActorId, mergedSlots);
    }
  };

  const mergeAdjacentSlots = (
    slots: Omit<AvailabilitySlot, 'id' | 'actorId'>[]
  ): Omit<AvailabilitySlot, 'id' | 'actorId'>[] => {
    const sorted = [...slots].sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.startTime.localeCompare(b.startTime);
    });

    const merged: Omit<AvailabilitySlot, 'id' | 'actorId'>[] = [];
    for (const slot of sorted) {
      const last = merged[merged.length - 1];
      if (
        last &&
        last.dayOfWeek === slot.dayOfWeek &&
        last.type === slot.type &&
        last.endTime === slot.startTime
      ) {
        last.endTime = slot.endTime;
      } else {
        merged.push({ ...slot });
      }
    }
    return merged;
  };

  const toggleRoleAssignment = (roleId: string, productionId: string) => {
    if (!editingActor.roleAssignments) return;

    const exists = editingActor.roleAssignments.some(
      (ra) => ra.roleId === roleId && ra.productionId === productionId
    );

    if (exists) {
      setEditingActor({
        ...editingActor,
        roleAssignments: editingActor.roleAssignments.filter(
          (ra) => !(ra.roleId === roleId && ra.productionId === productionId)
        ),
      });
    } else {
      setEditingActor({
        ...editingActor,
        roleAssignments: [
          ...editingActor.roleAssignments,
          { roleId, productionId },
        ],
      });
    }
  };

  const getAvailabilityColor = (type?: AvailabilityType) => {
    switch (type) {
      case 'available':
        return 'bg-emerald-600/60 border-emerald-400/60';
      case 'preferred':
        return 'bg-theater-gold-500/60 border-theater-gold-400/60';
      case 'unavailable':
        return 'bg-red-900/40 border-red-700/40';
      default:
        return 'bg-theater-ink-800/60 border-theater-ink-600/60 hover:bg-theater-ink-700/60';
    }
  };

  const getAvailabilityIcon = (type?: AvailabilityType) => {
    switch (type) {
      case 'available':
        return <CheckCircle2 className="w-3 h-3 text-emerald-300" />;
      case 'preferred':
        return <Star className="w-3 h-3 text-theater-gold-300" />;
      case 'unavailable':
        return <Ban className="w-3 h-3 text-red-400" />;
      default:
        return null;
    }
  };

  const clearDayAvailability = (dayOfWeek: number) => {
    if (!selectedActorId) return;
    const newSlots = actorAvailability.filter((s) => s.dayOfWeek !== dayOfWeek);
    setActorAvailability(selectedActorId, newSlots.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      type: s.type,
    })));
  };

  const clearAllAvailability = () => {
    if (!selectedActorId || !confirm('确定要清除这名演员的所有档期吗？')) return;
    setActorAvailability(selectedActorId, []);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* 左侧演员列表 */}
      <div className="w-80 flex-shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">演员档案</h2>
          <button
            onClick={() => {
              resetActorForm();
              setShowActorModal(true);
            }}
            className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-sm"
          >
            <Plus className="w-4 h-4" />
            新增
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {actors.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="w-12 h-12 text-theater-ink-400 mx-auto mb-3" />
              <p className="text-theater-parchment-400">暂无演员</p>
              <p className="text-sm text-theater-ink-400 mt-1">点击右上角新增演员</p>
            </div>
          ) : (
            actors.map((actor) => (
              <div
                key={actor.id}
                onClick={() => setSelectedActorId(actor.id)}
                className={`card p-4 cursor-pointer transition-all ${
                  selectedActorId === actor.id
                    ? 'border-theater-gold-500/60 bg-theater-burgundy-900/30'
                    : 'hover:bg-theater-ink-700/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-theater-burgundy-600 to-theater-burgundy-800 flex items-center justify-center">
                      <User className="w-5 h-5 text-theater-gold-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-theater-parchment-100">
                        {actor.name}
                      </h3>
                      <p className="text-sm text-theater-ink-300 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {actor.contact || '未填写联系方式'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditActor(actor);
                      }}
                      className="p-1.5 rounded hover:bg-theater-ink-600 text-theater-parchment-300 hover:text-theater-parchment-100 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteActor(actor.id);
                      }}
                      className="p-1.5 rounded hover:bg-red-900/50 text-theater-parchment-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {getActorRoles(actor).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-theater-ink-600/50">
                    <p className="text-xs text-theater-ink-400 mb-2 flex items-center gap-1">
                      <UserRound className="w-3 h-3" />
                      饰演角色
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {getActorRoles(actor).map(({ role, production }) => (
                        <span
                          key={`${role.id}-${production.id}`}
                          className="text-xs px-2 py-0.5 rounded-full bg-theater-burgundy-800/50 text-theater-parchment-300 border border-theater-burgundy-600/50"
                        >
                          {role.name} · {production.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右侧档期设置 */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedActor ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-theater-gold-400" />
                  {selectedActor.name} 的档期设置
                </h2>
                <p className="text-sm text-theater-ink-300 mt-1">
                  点击格子设置档期，先选择下方的档期类型
                </p>
              </div>
              <button
                onClick={clearAllAvailability}
                className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                清除全部
              </button>
            </div>

            {/* 档期类型选择 */}
            <div className="card p-4 mb-4">
              <p className="text-sm text-theater-parchment-300 mb-3">选择档期类型，然后点击下方格子：</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setAvailabilityType('available')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    availabilityType === 'available'
                      ? 'bg-emerald-600/40 border-emerald-400 text-emerald-200'
                      : 'bg-theater-ink-700/50 border-theater-ink-600 text-theater-parchment-300 hover:bg-theater-ink-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  可排练
                </button>
                <button
                  onClick={() => setAvailabilityType('preferred')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    availabilityType === 'preferred'
                      ? 'bg-theater-gold-500/40 border-theater-gold-400 text-theater-gold-200'
                      : 'bg-theater-ink-700/50 border-theater-ink-600 text-theater-parchment-300 hover:bg-theater-ink-700'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  优先时间
                </button>
                <button
                  onClick={() => setAvailabilityType('unavailable')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    availabilityType === 'unavailable'
                      ? 'bg-red-900/40 border-red-500 text-red-200'
                      : 'bg-theater-ink-700/50 border-theater-ink-600 text-theater-parchment-300 hover:bg-theater-ink-700'
                  }`}
                >
                  <Ban className="w-4 h-4" />
                  不可用
                </button>
              </div>
            </div>

            {/* 档期周视图 */}
            <div className="card flex-1 overflow-auto p-4">
              <div className="min-w-[800px]">
                {/* 表头 */}
                <div className="grid grid-cols-8 gap-1 mb-2">
                  <div className="p-2 text-center text-sm text-theater-ink-400 font-medium">
                    <Clock className="w-4 h-4 mx-auto" />
                  </div>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <div
                      key={day}
                      className="p-2 text-center relative group"
                    >
                      <span className={`text-sm font-medium ${
                        index === 0 || index === 6 ? 'text-theater-burgundy-400' : 'text-theater-parchment-300'
                      }`}>
                        周{day}
                      </span>
                      <button
                        onClick={() => clearDayAvailability(index)}
                        className="absolute top-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-900/50 text-theater-ink-400 hover:text-red-400 transition-all"
                        title="清除当天"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* 时间格子 */}
                {TIME_SLOTS.map((time) => (
                  <div key={time} className="grid grid-cols-8 gap-1 mb-1">
                    <div className="p-2 text-center text-xs text-theater-ink-400 flex items-center justify-center">
                      {time}
                    </div>
                    {DAYS_OF_WEEK.map((_, dayIndex) => {
                      const key = `${dayIndex}-${time}`;
                      const type = availabilityGrid[key];
                      return (
                        <button
                          key={key}
                          onClick={() => toggleAvailability(dayIndex, time)}
                          className={`p-2 rounded border transition-all ${
                            getAvailabilityColor(type)
                          } hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center`}
                        >
                          {getAvailabilityIcon(type)}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* 图例 */}
              <div className="mt-6 pt-4 border-t border-theater-ink-600/50">
                <p className="text-xs text-theater-ink-400 mb-3">图例说明：</p>
                <div className="flex flex-wrap gap-4 text-xs text-theater-parchment-300">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-emerald-600/60 border border-emerald-400/60 flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                    </div>
                    <span>可排练</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-theater-gold-500/60 border border-theater-gold-400/60 flex items-center justify-center">
                      <Star className="w-3 h-3 text-theater-gold-300" />
                    </div>
                    <span>优先时间（排期时优先考虑）</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-red-900/40 border border-red-700/40 flex items-center justify-center">
                      <Ban className="w-3 h-3 text-red-400" />
                    </div>
                    <span>不可用</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-theater-ink-800/60 border border-theater-ink-600/60" />
                    <span>未设置（默认不可用）</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="card flex-1 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="w-16 h-16 text-theater-ink-400 mx-auto mb-4" />
              <p className="text-lg text-theater-parchment-300">请选择一名演员</p>
              <p className="text-sm text-theater-ink-400 mt-2">
                从左侧列表选择演员，或点击新增创建演员档案
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 演员编辑模态框 */}
      {showActorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl max-h-[80vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-semibold text-gradient-gold">
                {editingActor.id ? '编辑演员' : '新增演员'}
              </h3>
              <button
                onClick={() => {
                  setShowActorModal(false);
                  resetActorForm();
                }}
                className="p-2 rounded-lg hover:bg-theater-ink-700 text-theater-parchment-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-theater-parchment-300 mb-2">
                  演员姓名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editingActor.name || ''}
                  onChange={(e) => setEditingActor({ ...editingActor, name: e.target.value })}
                  className="input-field w-full"
                  placeholder="请输入演员姓名"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theater-parchment-300 mb-2">
                  联系方式
                </label>
                <input
                  type="text"
                  value={editingActor.contact || ''}
                  onChange={(e) => setEditingActor({ ...editingActor, contact: e.target.value })}
                  className="input-field w-full"
                  placeholder="电话、微信等"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theater-parchment-300 mb-3">
                  <span className="flex items-center gap-2">
                    <UserRound className="w-4 h-4" />
                    角色分配
                  </span>
                </label>
                {productions.length === 0 ? (
                  <p className="text-sm text-theater-ink-400">请先在剧目管理中创建剧目和角色</p>
                ) : (
                  <div className="space-y-4">
                    {productions.map((production) => {
                      const productionRoles = roles.filter((r) => r.productionId === production.id);
                      if (productionRoles.length === 0) return null;
                      return (
                        <div key={production.id} className="p-3 rounded-lg bg-theater-ink-800/50">
                          <p className="text-sm font-medium text-theater-gold-400 mb-2">
                            {production.title}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {productionRoles.map((role) => {
                              const isAssigned = editingActor.roleAssignments?.some(
                                (ra) => ra.roleId === role.id && ra.productionId === production.id
                              );
                              return (
                                <button
                                  key={role.id}
                                  onClick={() => toggleRoleAssignment(role.id, production.id)}
                                  className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-all border ${
                                    isAssigned
                                      ? 'bg-theater-burgundy-700/60 border-theater-burgundy-500/60 text-theater-gold-300'
                                      : 'bg-theater-ink-700/50 border-theater-ink-600/50 text-theater-parchment-300 hover:bg-theater-ink-700'
                                  }`}
                                >
                                  {isAssigned && <Check className="w-3.5 h-3.5" />}
                                  {role.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-theater-ink-600/50">
              <button
                onClick={() => {
                  setShowActorModal(false);
                  resetActorForm();
                }}
                className="btn-secondary px-5 py-2"
              >
                取消
              </button>
              <button
                onClick={handleSaveActor}
                className="btn-primary px-5 py-2 flex items-center gap-2"
                disabled={!editingActor.name?.trim()}
              >
                <Check className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
