export type Todo = { id: number; text: string; done: boolean };

export type ExpenseItem = { id: number; amount: number; note?: string; createdAt: number };

export type CleaningState = Record<string, boolean>;

export type DayLog = {
  wakeTime?: string;
  sleepTime?: string;
  steps?: string;
  studyMinutes?: string;
  weight?: string;
  memo?: string; // 写真の下メモ（photoはIndexedDB）
  todos?: Todo[];
  expenses?: ExpenseItem[];
  cleaning?: CleaningState;
};

const STORAGE_KEY = "my-life-log.v1";

function safeParse<T>(s: string | null, fallback: T): T {
  try {
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadAll(): Record<string, DayLog> {
  return safeParse<Record<string, DayLog>>(localStorage.getItem(STORAGE_KEY), {});
}

export function saveAll(all: Record<string, DayLog>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getDay(all: Record<string, DayLog>, dateKey: string): DayLog {
  return all[dateKey] || {};
}

export function setDay(all: Record<string, DayLog>, dateKey: string, next: DayLog) {
  return { ...all, [dateKey]: next };
}

export function updateDay(all: Record<string, DayLog>, dateKey: string, partial: Partial<DayLog>) {
  const prev = getDay(all, dateKey);
  const next = { ...prev, ...partial };
  return setDay(all, dateKey, next);
}
