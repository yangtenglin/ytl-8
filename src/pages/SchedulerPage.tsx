import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import ScheduleTimeline from '../components/ScheduleTimeline';
import ScorePanel from '../components/ScorePanel';
import CandidateSelector from '../components/CandidateSelector';
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Play,
  Plus,
  Settings,
  Trash2,
  UserX,
  RefreshCw,
  Wrench,
} from 'lucide-react';
import { format, addDays, parseISO, isSameDay } from 'date-fns';
import { GenerateOptions, LeavePeriod, CONFLICT_WEIGHTS } from '../types';
import { formatDisplayDate, formatDisplayDateTime, formatDate, formatTime } from '../utils/time';

export default function SchedulerPage() {
  const navigate = useNavigate();
  const {
    currentProductionId,
    productions,
    scenes,
    actors,
    rooms,
    availability,
    leavePeriods,
    roomUnavailabilities,
    schedules,
    currentScheduleId,
    setCurrentSchedule,
    candidates,
    generateCandidates,
    selectCandidate,
    clearCandidates,
    moveScheduledScene,
    deleteScheduledScene,
    selectedDate,
    setSelectedDate,
    zoomLevel,
    setZoomLevel,
    isGenerating,
    addScheduledScene,
    addLeavePeriod,
    updateLeavePeriod,
    deleteLeavePeriod,
    recalculateScheduleScores,
    updateScheduleWeightConfig,
    roles,
  } = useAppStore();

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showWeightPanel, setShowWeightPanel] = useState(false);
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
  const [leaveForm, setLeaveForm] = useState({
    actorId: '',
    date: selectedDate,
    startTime: '18:00',
    endTime: '22:00',
    reason: '',
  });
  const [generateOptions, setGenerateOptions] = useState<GenerateOptions>({
    productionId: currentProductionId || '',
    startDate: selectedDate,
    endDate: format(addDays(parseISO(selectedDate), 13), 'yyyy-MM-dd'),
    candidateCount: 3,
    dailyStartTime: '18:00',
    dailyEndTime: '22:00',
    breakDurationMinutes: 15,
    weightConfig: { ...CONFLICT_WEIGHTS },
  });

  const currentProduction = useMemo(
    () => productions.find((p) => p.id === currentProductionId),
    [productions, currentProductionId]
  );

  const currentSchedule = useMemo(
    () => schedules.find((s) => s.id === currentScheduleId),
    [schedules, currentScheduleId]
  );

  const productionScenes = useMemo(
    () => scenes.filter((s) => s.productionId === currentProductionId),
    [scenes, currentProductionId]
  );

  const handleGenerate = async () => {
    if (!currentProductionId) return;
    setShowGenerateModal(false);
    await generateCandidates({
      ...generateOptions,
      productionId: currentProductionId,
    });
  };

  const handleSelectCandidate = (candidateId: string) => {
    selectCandidate(candidateId);
  };

  const handleNavigateDate = (direction: number) => {
    const days = zoomLevel === 'day' ? 1 : 7;
    const newDate = format(
      addDays(parseISO(selectedDate), direction * days),
      'yyyy-MM-dd'
    );
    setSelectedDate(newDate);
  };

  const handleAddScene = () => {
    if (!currentScheduleId || productionScenes.length === 0 || rooms.length === 0) return;
    addScheduledScene(
      currentScheduleId,
      productionScenes[0].id,
      rooms[0].id,
      selectedDate,
      '18:00'
    );
  };

  const handleOpenLeaveModal = (leave?: LeavePeriod) => {
    if (leave) {
      setEditingLeaveId(leave.id);
      setLeaveForm({
        actorId: leave.actorId,
        date: formatDate(leave.startTime),
        startTime: formatTime(leave.startTime),
        endTime: formatTime(leave.endTime),
        reason: leave.reason || '',
      });
    } else {
      setEditingLeaveId(null);
      setLeaveForm({
        actorId: actors[0]?.id || '',
        date: selectedDate,
        startTime: '18:00',
        endTime: '22:00',
        reason: '',
      });
    }
    setShowLeaveModal(true);
  };

  const handleSaveLeave = () => {
    if (!leaveForm.actorId) return;

    const startISO = `${leaveForm.date}T${leaveForm.startTime}:00`;
    const endISO = `${leaveForm.date}T${leaveForm.endTime}:00`;

    if (editingLeaveId) {
      updateLeavePeriod(editingLeaveId, {
        actorId: leaveForm.actorId,
        startTime: startISO,
        endTime: endISO,
        reason: leaveForm.reason,
      });
    } else {
      addLeavePeriod({
        actorId: leaveForm.actorId,
        startTime: startISO,
        endTime: endISO,
        reason: leaveForm.reason,
      });
    }
    setShowLeaveModal(false);
    setEditingLeaveId(null);
  };

  const handleDeleteLeave = (id: string) => {
    deleteLeavePeriod(id);
  };

  const handleRecalculate = () => {
    if (currentScheduleId) {
      recalculateScheduleScores(currentScheduleId);
    }
  };

  const filteredLeavePeriods = useMemo(() => {
    return leavePeriods.filter((lp) =>
      isSameDay(parseISO(lp.startTime), parseISO(selectedDate))
    );
  }, [leavePeriods, selectedDate]);

  const filteredRoomUnavailabilities = useMemo(() => {
    return roomUnavailabilities.filter((ru) =>
      isSameDay(parseISO(ru.startTime), parseISO(selectedDate))
    );
  }, [roomUnavailabilities, selectedDate]);

  const getRoomUnavailabilityTypeLabel = (type: string) => {
    switch (type) {
      case 'maintenance':
        return '检修';
      case 'closed':
        return '停用';
      default:
        return '不可用';
    }
  };

  if (!currentProductionId) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-theater-ink-400" />
          <h2 className="text-xl font-serif font-semibold text-theater-parchment-200 mb-2">
            请先选择一个剧目
          </h2>
          <p className="text-theater-ink-400">
            在剧目管理中创建或选择剧目后开始排期
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gradient-gold">
            排期工作台
          </h2>
          <p className="text-theater-ink-300">
            {currentProduction?.title || '未选择剧目'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-theater-ink-700 rounded-md p-1">
            <button
              onClick={() => setZoomLevel('day')}
              className={`px-3 py-1.5 rounded text-sm transition-all ${
                zoomLevel === 'day'
                  ? 'bg-theater-burgundy-700 text-theater-gold-300'
                  : 'text-theater-parchment-300 hover:text-theater-parchment-100'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel('week')}
              className={`px-3 py-1.5 rounded text-sm transition-all ${
                zoomLevel === 'week'
                  ? 'bg-theater-burgundy-700 text-theater-gold-300'
                  : 'text-theater-parchment-300 hover:text-theater-parchment-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNavigateDate(-1)}
              className="p-2 rounded-md bg-theater-ink-700 text-theater-parchment-300 hover:bg-theater-ink-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 py-2 bg-theater-ink-700 rounded-md min-w-[160px] text-center">
              <span className="font-serif font-medium text-theater-parchment-100">
                {formatDisplayDate(selectedDate)}
              </span>
            </div>
            <button
              onClick={() => handleNavigateDate(1)}
              className="p-2 rounded-md bg-theater-ink-700 text-theater-parchment-300 hover:bg-theater-ink-600 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            自动排期
          </button>

          {currentSchedule && (
            <>
              <button
                onClick={handleAddScene}
                className="btn-secondary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加场次
              </button>
              <button
                onClick={() => handleOpenLeaveModal()}
                className="btn-secondary flex items-center gap-2"
              >
                <UserX className="w-4 h-4" />
                请假登记
              </button>
              <button
                onClick={() => navigate('/productions?tab=rooms')}
                className="btn-secondary flex items-center gap-2"
                title="管理排练厅停用/检修时段"
              >
                <Wrench className="w-4 h-4" />
                排练厅停用
              </button>
              <button
                onClick={handleRecalculate}
                className="btn-ghost flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                重算
              </button>
            </>
          )}
        </div>
      </div>

      <CandidateSelector
        candidates={candidates}
        onSelect={handleSelectCandidate}
        onClear={clearCandidates}
        isGenerating={isGenerating}
      />

      {schedules.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-theater-ink-300 mr-2">排期方案:</span>
          {schedules.map((schedule) => (
            <button
              key={schedule.id}
              onClick={() => setCurrentSchedule(schedule.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                currentScheduleId === schedule.id
                  ? 'bg-theater-gold-500 text-theater-ink-900'
                  : 'bg-theater-ink-700 text-theater-parchment-300 hover:bg-theater-ink-600'
              }`}
            >
              {schedule.name}
              <span className="text-xs opacity-75">
                {schedule.conflictScore + schedule.gapScore}分
              </span>
            </button>
          ))}
        </div>
      )}

      {currentSchedule ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <ScheduleTimeline
              scheduledScenes={currentSchedule.scheduledScenes}
              scenes={scenes}
              rooms={rooms}
              actors={actors}
              conflicts={currentSchedule.conflicts}
              startDate={currentSchedule.startDate}
              endDate={currentSchedule.endDate}
              onMoveScene={moveScheduledScene}
              onDeleteScene={deleteScheduledScene}
              zoomLevel={zoomLevel}
              leavePeriods={leavePeriods}
              roomUnavailabilities={roomUnavailabilities}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-theater-ink-400 px-2">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-theater-burgundy-700 border border-theater-burgundy-500" />
                  已安排场次
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-theater-burgundy-500 border border-theater-burgundy-400 animate-conflict-blink" />
                  冲突场次
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-600/60 border border-red-400" />
                  请假时段
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-orange-600/60 border-2 border-orange-400/60" />
                  房间检修
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-600/40 border-2 border-red-400/50" />
                  房间停用
                </span>
              </div>
              <span>拖拽场次块可调整时间和排练室，拖到停用/请假时段会触发冲突警示</span>
            </div>

            {filteredLeavePeriods.length > 0 && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-serif font-semibold text-theater-parchment-200 flex items-center gap-2">
                    <UserX className="w-4 h-4 text-red-400" />
                    当日请假登记
                  </h4>
                </div>
                <div className="space-y-2">
                  {filteredLeavePeriods.map((leave) => {
                    const actor = actors.find((a) => a.id === leave.actorId);
                    return (
                      <div
                        key={leave.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-500/30 flex items-center justify-center">
                            <UserX className="w-4 h-4 text-red-300" />
                          </div>
                          <div>
                            <p className="font-medium text-theater-parchment-100">
                              {actor?.name || '未知演员'}
                            </p>
                            <p className="text-xs text-theater-ink-400">
                              {formatTime(leave.startTime)} -{' '}
                              {formatTime(leave.endTime)}
                              {leave.reason && ` · ${leave.reason}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenLeaveModal(leave)}
                            className="p-1.5 rounded hover:bg-theater-ink-700 text-theater-parchment-300 hover:text-white transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLeave(leave.id)}
                            className="p-1.5 rounded hover:bg-red-500/20 text-theater-parchment-300 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredRoomUnavailabilities.length > 0 && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-serif font-semibold text-theater-parchment-200 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-orange-400" />
                    当日排练厅停用/检修
                  </h4>
                  <button
                    onClick={() => navigate('/productions?tab=rooms')}
                    className="text-xs px-3 py-1 rounded btn-secondary"
                  >
                    管理
                  </button>
                </div>
                <div className="space-y-2">
                  {filteredRoomUnavailabilities.map((ru) => {
                    const room = rooms.find((r) => r.id === ru.roomId);
                    const isMaintenance = ru.type === 'maintenance';
                    return (
                      <div
                        key={ru.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isMaintenance
                            ? 'bg-orange-500/10 border border-orange-500/30'
                            : 'bg-red-500/10 border border-red-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isMaintenance
                                ? 'bg-orange-500/30'
                                : 'bg-red-500/30'
                            }`}
                          >
                            <Wrench
                              className={`w-4 h-4 ${
                                isMaintenance ? 'text-orange-300' : 'text-red-300'
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-theater-parchment-100">
                              {room?.name || '未知房间'}
                              <span
                                className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${
                                  isMaintenance
                                    ? 'border-orange-400/40 text-orange-300'
                                    : 'border-red-400/40 text-red-300'
                                }`}
                              >
                                {getRoomUnavailabilityTypeLabel(ru.type)}
                              </span>
                            </p>
                            <p className="text-xs text-theater-ink-400">
                              {formatTime(ru.startTime)} -{' '}
                              {formatTime(ru.endTime)}
                              {ru.reason && ` · ${ru.reason}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <ScorePanel schedule={currentSchedule} />

            <div className="card p-5 mt-4">
              <button
                onClick={() => setShowWeightPanel(!showWeightPanel)}
                className="w-full flex items-center justify-between"
              >
                <h3 className="section-title mb-0">评分权重</h3>
                <ChevronRight className={`w-4 h-4 text-theater-ink-400 transition-transform ${showWeightPanel ? 'rotate-90' : ''}`} />
              </button>

              {showWeightPanel && currentSchedule && (
                <div className="space-y-3 mt-4">
                  {([
                    { key: 'actor' as const, label: '演员冲突' },
                    { key: 'leave' as const, label: '请假冲突' },
                    { key: 'prop' as const, label: '道具冲突' },
                    { key: 'room-unavailable' as const, label: '房间停用' },
                  ] as const).map(({ key, label }) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-theater-ink-300">{label}</label>
                        <span className="text-xs font-mono text-theater-gold-400">
                          {currentSchedule.weightConfig?.[key] ?? CONFLICT_WEIGHTS[key]}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="500"
                        step="10"
                        className="w-full h-2 bg-theater-ink-700 rounded-lg appearance-none cursor-pointer accent-theater-gold-500"
                        value={currentSchedule.weightConfig?.[key] ?? CONFLICT_WEIGHTS[key]}
                        onChange={(e) => {
                          if (!currentScheduleId) return;
                          updateScheduleWeightConfig(currentScheduleId, {
                            ...currentSchedule.weightConfig,
                            [key]: parseInt(e.target.value),
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-theater-ink-700 flex items-center justify-center">
            <Settings className="w-10 h-10 text-theater-ink-400" />
          </div>
          <h3 className="text-xl font-serif font-semibold text-theater-parchment-200 mb-2">
            开始排期
          </h3>
          <p className="text-theater-ink-400 mb-6 max-w-md mx-auto">
            点击「自动排期」按钮，算法将根据演员档期、道具配置和场次依赖自动生成多个候选排期方案
          </p>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            开始自动排期
          </button>
        </div>
      )}

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md animate-fade-in">
            <h3 className="text-xl font-serif font-semibold text-theater-parchment-100 mb-4">
              自动排期设置
            </h3>

            <div className="space-y-4">
              <div>
                <label className="input-label">排期开始日期</label>
                <input
                  type="date"
                  className="input-field"
                  value={generateOptions.startDate}
                  onChange={(e) =>
                    setGenerateOptions({
                      ...generateOptions,
                      startDate: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="input-label">排期结束日期</label>
                <input
                  type="date"
                  className="input-field"
                  value={generateOptions.endDate}
                  onChange={(e) =>
                    setGenerateOptions({
                      ...generateOptions,
                      endDate: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">每日开始时间</label>
                  <input
                    type="time"
                    className="input-field"
                    value={generateOptions.dailyStartTime}
                    onChange={(e) =>
                      setGenerateOptions({
                        ...generateOptions,
                        dailyStartTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="input-label">每日结束时间</label>
                  <input
                    type="time"
                    className="input-field"
                    value={generateOptions.dailyEndTime}
                    onChange={(e) =>
                      setGenerateOptions({
                        ...generateOptions,
                        dailyEndTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="input-label">生成候选方案数量</label>
                <select
                  className="input-field"
                  value={generateOptions.candidateCount}
                  onChange={(e) =>
                    setGenerateOptions({
                      ...generateOptions,
                      candidateCount: parseInt(e.target.value),
                    })
                  }
                >
                  <option value={2}>2 个方案</option>
                  <option value={3}>3 个方案</option>
                  <option value={5}>5 个方案</option>
                </select>
              </div>

              <div className="pt-3 border-t border-theater-ink-600">
                <h4 className="text-sm font-medium text-theater-parchment-200 mb-3">
                  评分权重配置
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-theater-ink-300">演员冲突</label>
                      <span className="text-xs font-mono text-theater-gold-400">
                        {generateOptions.weightConfig?.actor ?? CONFLICT_WEIGHTS.actor}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="500"
                      step="10"
                      className="w-full h-2 bg-theater-ink-700 rounded-lg appearance-none cursor-pointer accent-theater-gold-500"
                      value={generateOptions.weightConfig?.actor ?? CONFLICT_WEIGHTS.actor}
                      onChange={(e) =>
                        setGenerateOptions({
                          ...generateOptions,
                          weightConfig: {
                            ...generateOptions.weightConfig,
                            actor: parseInt(e.target.value),
                          },
                        })
                      }
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-theater-ink-300">请假冲突</label>
                      <span className="text-xs font-mono text-theater-gold-400">
                        {generateOptions.weightConfig?.leave ?? CONFLICT_WEIGHTS.leave}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="500"
                      step="10"
                      className="w-full h-2 bg-theater-ink-700 rounded-lg appearance-none cursor-pointer accent-theater-gold-500"
                      value={generateOptions.weightConfig?.leave ?? CONFLICT_WEIGHTS.leave}
                      onChange={(e) =>
                        setGenerateOptions({
                          ...generateOptions,
                          weightConfig: {
                            ...generateOptions.weightConfig,
                            leave: parseInt(e.target.value),
                          },
                        })
                      }
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-theater-ink-300">道具冲突</label>
                      <span className="text-xs font-mono text-theater-gold-400">
                        {generateOptions.weightConfig?.prop ?? CONFLICT_WEIGHTS.prop}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="500"
                      step="10"
                      className="w-full h-2 bg-theater-ink-700 rounded-lg appearance-none cursor-pointer accent-theater-gold-500"
                      value={generateOptions.weightConfig?.prop ?? CONFLICT_WEIGHTS.prop}
                      onChange={(e) =>
                        setGenerateOptions({
                          ...generateOptions,
                          weightConfig: {
                            ...generateOptions.weightConfig,
                            prop: parseInt(e.target.value),
                          },
                        })
                      }
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-theater-ink-300">房间停用</label>
                      <span className="text-xs font-mono text-theater-gold-400">
                        {generateOptions.weightConfig?.['room-unavailable'] ?? CONFLICT_WEIGHTS['room-unavailable']}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="500"
                      step="10"
                      className="w-full h-2 bg-theater-ink-700 rounded-lg appearance-none cursor-pointer accent-theater-gold-500"
                      value={generateOptions.weightConfig?.['room-unavailable'] ?? CONFLICT_WEIGHTS['room-unavailable']}
                      onChange={(e) =>
                        setGenerateOptions({
                          ...generateOptions,
                          weightConfig: {
                            ...generateOptions.weightConfig,
                            'room-unavailable': parseInt(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="btn-ghost flex-1"
              >
                取消
              </button>
              <button onClick={handleGenerate} className="btn-primary flex-1">
                开始生成
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md animate-fade-in">
            <h3 className="text-xl font-serif font-semibold text-theater-parchment-100 mb-4 flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-400" />
              {editingLeaveId ? '编辑请假' : '新增请假登记'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="input-label">选择演员</label>
                <select
                  className="input-field"
                  value={leaveForm.actorId}
                  onChange={(e) =>
                    setLeaveForm({ ...leaveForm, actorId: e.target.value })
                  }
                >
                  {actors.map((actor) => (
                    <option key={actor.id} value={actor.id}>
                      {actor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">请假日期</label>
                <input
                  type="date"
                  className="input-field"
                  value={leaveForm.date}
                  onChange={(e) =>
                    setLeaveForm({ ...leaveForm, date: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">开始时间</label>
                  <input
                    type="time"
                    className="input-field"
                    value={leaveForm.startTime}
                    onChange={(e) =>
                      setLeaveForm({ ...leaveForm, startTime: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="input-label">结束时间</label>
                  <input
                    type="time"
                    className="input-field"
                    value={leaveForm.endTime}
                    onChange={(e) =>
                      setLeaveForm({ ...leaveForm, endTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="input-label">请假原因（可选）</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="如：病假、私事等"
                  value={leaveForm.reason}
                  onChange={(e) =>
                    setLeaveForm({ ...leaveForm, reason: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  setEditingLeaveId(null);
                }}
                className="btn-ghost flex-1"
              >
                取消
              </button>
              <button onClick={handleSaveLeave} className="btn-primary flex-1">
                {editingLeaveId ? '保存修改' : '确认登记'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
