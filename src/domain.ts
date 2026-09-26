import type { GaitLevel, HoofKey, TrimRecord } from "./types";

export const HOOF_KEYS: HoofKey[] = ["LF", "RF", "LH", "RH"];

export const HOOF_LABELS: Record<HoofKey, string> = {
  LF: "左前蹄",
  RF: "右前蹄",
  LH: "左后蹄",
  RH: "右后蹄",
};

export const GAIT_LABELS: Record<GaitLevel, string> = {
  normal: "步态正常",
  mild: "轻度异常",
  severe: "明显异常",
};

const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_RECHECK_INTERVAL_DAYS = 42;
export const RECHECK_SOON_DAYS = 7;

export function todayISO(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function addDaysISO(dateISO: string, days: number): string {
  const base = Date.parse(`${dateISO}T00:00:00Z`);
  return new Date(base + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysUntil(dateISO: string, today: string = todayISO()): number {
  return Math.round(
    (Date.parse(`${dateISO}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS
  );
}

export type RecheckStatus = "done" | "overdue" | "today" | "soon" | "scheduled";

export function recheckStatus(record: TrimRecord, today: string = todayISO()): RecheckStatus {
  if (record.recheckDone) return "done";
  const days = daysUntil(record.nextCheckDate, today);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= RECHECK_SOON_DAYS) return "soon";
  return "scheduled";
}

export function recheckLabel(status: RecheckStatus, days: number): string {
  switch (status) {
    case "done":
      return "已复查";
    case "overdue":
      return `逾期 ${Math.abs(days)} 天`;
    case "today":
      return "今天到期";
    case "soon":
      return `${days} 天后到期`;
    default:
      return "未到复查期";
  }
}

export interface PendingRecheck {
  record: TrimRecord;
  status: RecheckStatus;
  days: number;
}

/** 需要在提醒区标出的复查：已逾期、今天到期、7 天内临近。 */
export function getPendingRechecks(
  records: TrimRecord[],
  today: string = todayISO()
): PendingRecheck[] {
  return records
    .filter((r) => !r.recheckDone)
    .map((record) => ({
      record,
      status: recheckStatus(record, today),
      days: daysUntil(record.nextCheckDate, today),
    }))
    .filter((p) => p.status === "overdue" || p.status === "today" || p.status === "soon")
    .sort((a, b) => a.record.nextCheckDate.localeCompare(b.record.nextCheckDate));
}

export function getDoneRechecks(records: TrimRecord[]): TrimRecord[] {
  return records
    .filter((r) => r.recheckDone)
    .sort((a, b) => (b.recheckDoneDate ?? "").localeCompare(a.recheckDoneDate ?? ""));
}

export function getHorseIds(records: TrimRecord[]): string[] {
  return Array.from(new Set(records.map((r) => r.horseId)));
}

/** 同一匹马的修蹄记录按时间先后串成一条链，新记录接在旧记录后面。 */
export function getHorseHistory(records: TrimRecord[], horseId: string): TrimRecord[] {
  return records
    .filter((r) => r.horseId === horseId)
    .sort((a, b) => a.trimDate.localeCompare(b.trimDate) || a.createdAt - b.createdAt);
}

export function latestRecord(records: TrimRecord[], horseId: string): TrimRecord | undefined {
  const history = getHorseHistory(records, horseId);
  return history[history.length - 1];
}

export interface ShoeChange {
  horseId: string;
  date: string;
  from: string;
  to: string;
}

/** 某次修蹄相对上一同马记录是否换了蹄铁，换过则给出前后类型。 */
export function shoeChangeAt(records: TrimRecord[], record: TrimRecord): ShoeChange | null {
  const history = getHorseHistory(records, record.horseId);
  const index = history.findIndex((r) => r.id === record.id);
  if (index <= 0) return null;
  const prev = history[index - 1];
  if (prev.shoeType === record.shoeType) return null;
  return { horseId: record.horseId, date: record.trimDate, from: prev.shoeType, to: record.shoeType };
}

export function getShoeChanges(records: TrimRecord[]): ShoeChange[] {
  return records
    .map((r) => shoeChangeAt(records, r))
    .filter((c): c is ShoeChange => c !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export interface Metrics {
  horses: number;
  pendingRechecks: number;
  abnormalGait: number;
  shoeChanges: number;
}

export function computeMetrics(records: TrimRecord[], today: string = todayISO()): Metrics {
  const horseIds = getHorseIds(records);
  const abnormalGait = horseIds.filter((id) => {
    const latest = latestRecord(records, id);
    return latest !== undefined && latest.gaitLevel !== "normal";
  }).length;
  return {
    horses: horseIds.length,
    pendingRechecks: getPendingRechecks(records, today).length,
    abnormalGait,
    shoeChanges: getShoeChanges(records).length,
  };
}
