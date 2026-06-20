import {
  format,
  parse,
  addMinutes,
  startOfDay,
  isSameDay,
  getDay,
  setHours,
  setMinutes,
  parseISO,
  isAfter,
  isBefore,
  differenceInMinutes,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const TIME_FORMAT = 'HH:mm';
export const DATE_FORMAT = 'yyyy-MM-dd';
export const DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";
export const DISPLAY_DATE_FORMAT = 'M月d日';
export const DISPLAY_DATETIME_FORMAT = 'M月d日 HH:mm';

export const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, TIME_FORMAT);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, DATE_FORMAT);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, DATETIME_FORMAT);
}

export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, DISPLAY_DATE_FORMAT, { locale: zhCN });
}

export function formatDisplayDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, DISPLAY_DATETIME_FORMAT, { locale: zhCN });
}

export function parseTime(timeStr: string, baseDate: Date = new Date()): Date {
  return parse(timeStr, TIME_FORMAT, baseDate);
}

export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const date = parse(dateStr, DATE_FORMAT, new Date());
  const time = parse(timeStr, TIME_FORMAT, new Date());
  return setMinutes(
    setHours(date, time.getHours()),
    time.getMinutes()
  );
}

export function isTimeOverlap(
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string
): boolean {
  const s1 = typeof start1 === 'string' ? parseISO(start1) : start1;
  const e1 = typeof end1 === 'string' ? parseISO(end1) : end1;
  const s2 = typeof start2 === 'string' ? parseISO(start2) : start2;
  const e2 = typeof end2 === 'string' ? parseISO(end2) : end2;

  return isBefore(s1, e2) && isAfter(e1, s2);
}

export function getDayOfWeek(date: Date | string): number {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return getDay(d);
}

export function getTimeMinutesFromMidnight(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function createTimeSlots(
  dateStr: string,
  startTime: string,
  endTime: string,
  intervalMinutes: number
): { start: Date; end: Date; timeLabel: string }[] {
  const slots: { start: Date; end: Date; timeLabel: string }[] = [];
  const baseDate = parse(dateStr, DATE_FORMAT, new Date());
  const startMinutes = getTimeMinutesFromMidnight(startTime);
  const endMinutes = getTimeMinutesFromMidnight(endTime);

  let currentMinutes = startMinutes;
  while (currentMinutes < endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    const slotStart = setMinutes(setHours(baseDate, hours), mins);
    const slotEnd = addMinutes(slotStart, intervalMinutes);

    slots.push({
      start: slotStart,
      end: slotEnd,
      timeLabel: format(slotStart, TIME_FORMAT),
    });

    currentMinutes += intervalMinutes;
  }

  return slots;
}

export function calculateMinutesBetween(
  date1: Date | string,
  date2: Date | string
): number {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return Math.abs(differenceInMinutes(d1, d2));
}

export function getDatesInRange(
  startDate: string,
  endDate: string
): string[] {
  const dates: string[] = [];
  const start = parse(startDate, DATE_FORMAT, new Date());
  const end = parse(endDate, DATE_FORMAT, new Date());
  let current = startOfDay(start);

  while (!isAfter(current, end)) {
    dates.push(format(current, DATE_FORMAT));
    current = addMinutes(current, 24 * 60);
  }

  return dates;
}

export function isSameDayCheck(
  date1: Date | string,
  date2: Date | string
): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return isSameDay(d1, d2);
}
