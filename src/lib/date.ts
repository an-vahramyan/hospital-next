// Работа с датами в ЛОКАЛЬНОМ времени сервера (не UTC)
const pad = (n: number) => String(n).padStart(2, "0");

export function toLocalDateString(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** "2026-10-24" + "09:30" → Date (локальное время) */
export function atLocalTime(dateStr: string, hhmm: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = hhmm.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}

export function dayRange(dateStr: string): { start: Date; end: Date } {
  const start = atLocalTime(dateStr, "00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export const isDateString = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Все слоты дня по рабочему графику врача (без учёта занятости) */
export function buildDaySlots(dateStr: string, workStart: string, workEnd: string, slotMinutes: number): Date[] {
  const slots: Date[] = [];
  const end = atLocalTime(dateStr, workEnd);
  for (let t = atLocalTime(dateStr, workStart); addMinutes(t, slotMinutes) <= end; t = addMinutes(t, slotMinutes)) {
    slots.push(t);
  }
  return slots;
}
