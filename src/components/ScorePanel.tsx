import { AlertTriangle, Clock, TrendingUp, Trophy } from 'lucide-react';
import { Schedule } from '../types';
import { getScoreRating } from '../engine/scoring';

interface ScorePanelProps {
  schedule: Schedule;
}

export default function ScorePanel({ schedule }: ScorePanelProps) {
  const totalScore = schedule.conflictScore + schedule.gapScore;
  const rating = getScoreRating(totalScore);

  const errorCount = schedule.conflicts.filter(
    (c) => c.severity === 'error'
  ).length;
  const warningCount = schedule.conflicts.filter(
    (c) => c.severity === 'warning'
  ).length;

  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title mb-0">排期评分</h3>
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full bg-theater-ink-800 ${rating.color}`}
        >
          <Trophy className="w-4 h-4" />
          <span className="text-sm font-medium">{rating.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-theater-ink-800/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertTriangle className="w-4 h-4 text-theater-burgundy-400" />
            <span className="text-xs text-theater-ink-300">冲突分</span>
          </div>
          <div className="text-2xl font-serif font-semibold text-theater-burgundy-400">
            {schedule.conflictScore}
          </div>
        </div>

        <div className="text-center p-3 bg-theater-ink-800/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-4 h-4 text-theater-gold-400" />
            <span className="text-xs text-theater-ink-300">空档分</span>
          </div>
          <div className="text-2xl font-serif font-semibold text-theater-gold-400">
            {schedule.gapScore}
          </div>
        </div>

        <div className="text-center p-3 bg-theater-ink-800/50 rounded-lg border border-theater-gold-500/30">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-theater-gold-300" />
            <span className="text-xs text-theater-ink-300">总分</span>
          </div>
          <div className={`text-2xl font-serif font-semibold ${rating.color}`}>
            {totalScore}
          </div>
        </div>
      </div>

      {schedule.conflicts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-theater-parchment-200">
              冲突详情
            </span>
            <div className="flex gap-2">
              {errorCount > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-theater-burgundy-500/20 text-theater-burgundy-300">
                  {errorCount} 项严重
                </span>
              )}
              {warningCount > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-300">
                  {warningCount} 项警告
                </span>
              )}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin">
            {schedule.conflicts.map((conflict, index) => (
              <div
                key={conflict.id}
                className={`p-3 rounded-lg text-sm animate-fade-in border ${
                  conflict.severity === 'error'
                    ? 'bg-theater-burgundy-500/10 border-theater-burgundy-500/30'
                    : 'bg-yellow-500/10 border-yellow-500/30'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      conflict.severity === 'error'
                        ? 'text-theater-burgundy-400'
                        : 'text-yellow-400'
                    }`}
                  />
                  <p className="text-theater-parchment-200">
                    {conflict.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {schedule.conflicts.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-theater-gold-500/10 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-theater-gold-400" />
          </div>
          <p className="text-theater-parchment-300">
            完美！没有检测到任何冲突
          </p>
        </div>
      )}
    </div>
  );
}
