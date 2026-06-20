import { ScheduledScene, OPTIMAL_GAP_MINUTES } from '../types';
import { parseISO, differenceInMinutes, isSameDay, sortBy } from 'date-fns';

interface GapInfo {
  gapMinutes: number;
  scene1Id: string;
  scene2Id: string;
  date: string;
  roomId: string;
}

export function calculateGapScore(
  scheduledScenes: ScheduledScene[]
): { score: number; gaps: GapInfo[] } {
  if (scheduledScenes.length < 2) {
    return { score: 0, gaps: [] };
  }

  const gaps: GapInfo[] = [];
  const byRoomAndDay = new Map<string, ScheduledScene[]>();

  for (const ss of scheduledScenes) {
    const key = `${ss.roomId}-${ss.startTime.split('T')[0]}`;
    const list = byRoomAndDay.get(key) || [];
    list.push(ss);
    byRoomAndDay.set(key, list);
  }

  let totalScore = 0;

  for (const [, roomDayScenes] of byRoomAndDay) {
    const sorted = sortBy(roomDayScenes, (ss) => parseISO(ss.startTime));

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      const currentEnd = parseISO(current.endTime);
      const nextStart = parseISO(next.startTime);

      if (!isSameDay(currentEnd, nextStart)) continue;

      const gapMinutes = differenceInMinutes(nextStart, currentEnd);

      if (gapMinutes > OPTIMAL_GAP_MINUTES) {
        const excess = gapMinutes - OPTIMAL_GAP_MINUTES;
        let weight = 1;

        if (excess > 120) weight = 5;
        else if (excess > 60) weight = 2;

        const gapScore = excess * weight;
        totalScore += gapScore;

        gaps.push({
          gapMinutes,
          scene1Id: current.id,
          scene2Id: next.id,
          date: current.startTime.split('T')[0],
          roomId: current.roomId,
        });
      }
    }
  }

  return { score: Math.round(totalScore), gaps };
}

export function calculateTotalScore(
  conflictScore: number,
  gapScore: number
): number {
  return conflictScore + gapScore;
}

export function getScoreRating(score: number): {
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  label: string;
  color: string;
} {
  if (score === 0) {
    return { level: 'excellent', label: '完美', color: 'text-theater-gold-400' };
  }
  if (score < 50) {
    return { level: 'good', label: '良好', color: 'text-green-400' };
  }
  if (score < 150) {
    return { level: 'fair', label: '一般', color: 'text-yellow-400' };
  }
  if (score < 300) {
    return { level: 'poor', label: '较差', color: 'text-orange-400' };
  }
  return { level: 'critical', label: '严重', color: 'text-theater-burgundy-400' };
}
