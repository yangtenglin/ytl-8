import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import { GenerateOptions } from '../types';
import { formatDisplayDate } from '../utils/time';

export default function SchedulerPage() {
  const {
    currentProductionId,
    productions,
    scenes,
    actors,
    rooms,
    availability,
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
  } = useAppStore();

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateOptions, setGenerateOptions] = useState<GenerateOptions>({
    productionId: currentProductionId || '',
    startDate: selectedDate,
    endDate: format(addDays(parseISO(selectedDate), 13), 'yyyy-MM-dd'),
    candidateCount: 3,
    dailyStartTime: '18:00',
    dailyEndTime: '22:00',
    breakDurationMinutes: 15,
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
            <button
              onClick={handleAddScene}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              添加场次
            </button>
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
            />

            <div className="flex items-center justify-between text-sm text-theater-ink-400 px-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-theater-burgundy-700 border border-theater-burgundy-500" />
                  已安排场次
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-theater-burgundy-500 border border-theater-burgundy-400 animate-conflict-blink" />
                  冲突场次
                </span>
              </div>
              <span>拖拽场次块可以调整时间和排练室</span>
            </div>
          </div>

          <div className="lg:col-span-1">
            <ScorePanel schedule={currentSchedule} />
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
    </div>
  );
}
