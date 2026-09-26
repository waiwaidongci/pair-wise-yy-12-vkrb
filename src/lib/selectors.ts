import { ABNORMAL_KEYWORDS, HOOF_KEYS, UPCOMING_DAYS } from "../constants";
import { daysUntil } from "./date";
import type { ArchiveState, Horse, HorseCategory, TrimRecord } from "../types";

/** 同马记录：修蹄日期新的在前，同日按登记时间 */
export function sortRecords(records: TrimRecord[]): TrimRecord[] {
  return [...records].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.createdAt - a.createdAt;
  });
}

export function getLastRecord(records: TrimRecord[]): TrimRecord | undefined {
  return sortRecords(records)[0];
}

/** 再次修蹄时，换铁前类型 = 上一次记录换上的类型 */
export function previousShoeType(records: TrimRecord[]): string {
  return getLastRecord(records)?.shoeAfter ?? "";
}

export function isAbnormalGait(text: string): boolean {
  return ABNORMAL_KEYWORDS.some((kw) => text.includes(kw));
}

function recordHasAbnormal(r: TrimRecord): boolean {
  if (isAbnormalGait(r.gaitIssue)) return true;
  if (HOOF_KEYS.some((k) => isAbnormalGait(r.hooves[k].condition))) return true;
  return isAbnormalGait(r.hoofEvaluation);
}

export interface HorseSummary {
  horse: Horse;
  latest: TrimRecord | undefined;
  recordCount: number;
  abnormal: boolean;
  shoeChanged: boolean;
  reviewState: "none" | "overdue" | "due" | "upcoming" | "ok" | "handled";
  reviewDays: number | null;
}

function reviewStateOf(r: TrimRecord | undefined, nowISO: string): HorseSummary["reviewState"] {
  if (!r || !r.reviewDate) return "none";
  if (r.reviewHandled) return "handled";
  const n = daysUntil(r.reviewDate, nowISO);
  if (n < 0) return "overdue";
  if (n === 0) return "due";
  if (n <= UPCOMING_DAYS) return "upcoming";
  return "ok";
}

export function selectSummaries(state: ArchiveState, nowISO: string): HorseSummary[] {
  const summaries = state.horses.map((horse) => {
    const latest = getLastRecord(horse.records);
    const reviewState = reviewStateOf(latest, nowISO);
    return {
      horse,
      latest,
      recordCount: horse.records.length,
      abnormal: horse.records.some(recordHasAbnormal),
      shoeChanged: Boolean(latest && latest.shoeBefore && latest.shoeBefore !== latest.shoeAfter),
      reviewState,
      reviewDays: latest?.reviewDate ? daysUntil(latest.reviewDate, nowISO) : null,
    };
  });
  return summaries.sort((a, b) => {
    const da = a.latest?.date ?? "";
    const db = b.latest?.date ?? "";
    if (da !== db) return db.localeCompare(da);
    return (b.latest?.createdAt ?? 0) - (a.latest?.createdAt ?? 0);
  });
}

export interface Reminder {
  horseId: string;
  horseNo: string;
  category: HorseCategory;
  record: TrimRecord;
  status: "overdue" | "due" | "upcoming";
  days: number;
}

/** 只取未处理且已到期/临期的复查；一匹马只提醒最新一次 */
export function selectReminders(state: ArchiveState, nowISO: string): Reminder[] {
  const reminders: Reminder[] = [];
  for (const horse of state.horses) {
    const latest = getLastRecord(horse.records);
    if (!latest || latest.reviewHandled || !latest.reviewDate) continue;
    const n = daysUntil(latest.reviewDate, nowISO);
    if (n < 0) {
      reminders.push({ horseId: horse.id, horseNo: horse.horseNo, category: horse.category, record: latest, status: "overdue", days: n });
    } else if (n === 0) {
      reminders.push({ horseId: horse.id, horseNo: horse.horseNo, category: horse.category, record: latest, status: "due", days: n });
    } else if (n <= UPCOMING_DAYS) {
      reminders.push({ horseId: horse.id, horseNo: horse.horseNo, category: horse.category, record: latest, status: "upcoming", days: n });
    }
  }
  return reminders.sort((a, b) => a.days - b.days);
}

export interface Metrics {
  pendingReview: number;
  abnormalGait: number;
  shoeChanged: number;
  totalHorses: number;
}

export function selectMetrics(state: ArchiveState, nowISO: string): Metrics {
  const summaries = selectSummaries(state, nowISO);
  return {
    pendingReview: summaries.filter((s) => s.reviewState === "overdue" || s.reviewState === "due" || s.reviewState === "upcoming").length,
    abnormalGait: summaries.filter((s) => s.abnormal).length,
    shoeChanged: summaries.filter((s) => s.shoeChanged).length,
    totalHorses: state.horses.length,
  };
}

export type FilterKey = "全部" | "前蹄" | "后蹄" | "运动马" | "休养马";

export function filterSummaries(summaries: HorseSummary[], filter: FilterKey, keyword: string): HorseSummary[] {
  const kw = keyword.trim().toUpperCase();
  return summaries.filter((s) => {
    if (filter === "运动马" && s.horse.category !== "运动马") return false;
    if (filter === "休养马" && s.horse.category !== "休养马") return false;
    if (filter === "前蹄" || filter === "后蹄") {
      const r = s.latest;
      if (!r) return false;
      const isFront = filter === "前蹄";
      const hoofAbnormal = isFront
        ? isAbnormalGait(r.hooves.LF.condition) || isAbnormalGait(r.hooves.RF.condition)
        : isAbnormalGait(r.hooves.LH.condition) || isAbnormalGait(r.hooves.RH.condition);
      const gaitMentions = isFront ? r.gaitIssue.includes("前") : r.gaitIssue.includes("后");
      if (!hoofAbnormal && !(gaitMentions && isAbnormalGait(r.gaitIssue))) return false;
    }
    if (kw && !s.horse.horseNo.includes(kw)) return false;
    return true;
  });
}

export function shoeChangeText(before: string, after: string): string {
  const b = before || "初次装蹄";
  const a = after || "未记录";
  return `${b} → ${a}`;
}
