import {
  ScheduleCandidate,
} from '../types';
import { getScoreRating } from '../engine/scoring';
import { Trophy, Clock, AlertTriangle, Check } from 'lucide-react';

interface CandidateSelectorProps {
  candidates: ScheduleCandidate[];
  onSelect: (candidateId: string) => void;
  onClear: () => void;
  isGenerating: boolean;
}

export default function CandidateSelector({
  candidates,
  onSelect,
  onClear,
  isGenerating,
}: CandidateSelectorProps) {
  if (candidates.length === 0 && !isGenerating) return null;

  return (
    <div className="card p-5 mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title mb-0">
          {isGenerating ? '正在生成候选方案...' : '候选方案'}
        </h3>
        {!isGenerating && candidates.length > 0 && (
          <button onClick={onClear} className="btn-ghost text-sm py-1 px-3">
            清除
          </button>
        )}
      </div>

      {isGenerating ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-theater-gold-500/30 border-t-theater-gold-500 rounded-full animate-spin" />
            <p className="text-theater-parchment-300">
              算法正在计算最优排期方案...
            </p>
            <p className="text-xs text-theater-ink-400 mt-1">
              这可能需要几秒钟时间
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((candidate, index) => {
            const rating = getScoreRating(candidate.totalScore);
            const errorCount = candidate.schedule.conflicts.filter(
              (c) => c.severity === 'error'
            ).length;
            const warningCount = candidate.schedule.conflicts.filter(
              (c) => c.severity === 'warning'
            ).length;

            return (
              <div
                key={candidate.id}
                className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer group ${
                  index === 0
                    ? 'border-theater-gold-500 bg-theater-gold-500/5 shadow-theater-glow'
                    : 'border-theater-ink-500/50 bg-theater-ink-800/50 hover:border-theater-burgundy-500/50 hover:bg-theater-ink-700/50'
                }`}
                onClick={() => onSelect(candidate.id)}
              >
                {index === 0 && (
                  <div className="absolute -top-3 left-4 px-2 py-0.5 bg-theater-gold-500 text-theater-ink-900 text-xs font-semibold rounded-full flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    最优
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-serif font-semibold text-theater-parchment-100">
                      {candidate.schedule.name}
                    </h4>
                    <p className="text-xs text-theater-ink-400">
                      {candidate.schedule.scheduledScenes.length} 场排练
                    </p>
                  </div>
                  <div
                    className={`text-2xl font-serif font-bold ${rating.color}`}
                  >
                    {candidate.totalScore}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3 text-sm">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-theater-burgundy-400" />
                    <span className="text-theater-parchment-300">
                      {candidate.schedule.conflictScore}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-theater-gold-400" />
                    <span className="text-theater-parchment-300">
                      {candidate.schedule.gapScore}
                    </span>
                  </div>
                  {errorCount > 0 && (
                    <span className="text-xs text-theater-burgundy-400">
                      {errorCount} 冲突
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span className="text-xs text-yellow-400">
                      {warningCount} 警告
                    </span>
                  )}
                </div>

                <div className={`text-xs font-medium ${rating.color}`}>
                  排名 #{candidate.rank} · {rating.label}
                </div>

                <div className="absolute inset-0 bg-theater-gold-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <div className="px-4 py-2 bg-theater-gold-500 text-theater-ink-900 font-medium rounded-md flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    选择此方案
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
