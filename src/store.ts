import type { TrimRecord } from "./types";
import { addDaysISO, todayISO } from "./domain";

const STORAGE_KEY = "hxyfront-62011:trim-records:v1";

export function createId(): string {
  return `rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isTrimRecord(value: unknown): value is TrimRecord {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.horseId === "string" &&
    typeof v.trimDate === "string" &&
    typeof v.nextCheckDate === "string"
  );
}

/** 读旧数据时补齐缺省字段，避免早期版本记录把页面弄崩。 */
function normalize(value: unknown): TrimRecord | null {
  if (!isTrimRecord(value)) return null;
  const raw = value as TrimRecord;
  return {
    id: raw.id,
    horseId: raw.horseId,
    trimDate: raw.trimDate,
    nextCheckDate: raw.nextCheckDate,
    gaitLevel: raw.gaitLevel === "mild" || raw.gaitLevel === "severe" ? raw.gaitLevel : "normal",
    gaitNote: raw.gaitNote ?? "",
    hoofAssessment: raw.hoofAssessment ?? "",
    hooves: {
      LF: raw.hooves?.LF ?? "良好",
      RF: raw.hooves?.RF ?? "良好",
      LH: raw.hooves?.LH ?? "良好",
      RH: raw.hooves?.RH ?? "良好",
    },
    shoeType: raw.shoeType ?? "",
    nailPattern: raw.nailPattern ?? "",
    note: raw.note ?? "",
    recheckDone: raw.recheckDone === true,
    recheckDoneDate: raw.recheckDoneDate ?? null,
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : 0,
  };
}

/** 首次打开时放入几条演示记录，让提醒、换铁、已处理复查都能直接看到效果。 */
function seedRecords(): TrimRecord[] {
  const today = todayISO();
  const base = Date.now();
  const make = (
    index: number,
    fields: Partial<TrimRecord> & Pick<TrimRecord, "horseId" | "trimDate" | "nextCheckDate" | "shoeType">
  ): TrimRecord => ({
    id: `seed-${index}`,
    gaitLevel: "normal",
    gaitNote: "",
    hoofAssessment: "蹄形正常",
    hooves: { LF: "良好", RF: "良好", LH: "良好", RH: "良好" },
    nailPattern: "前蹄每侧4钉、后蹄每侧3钉",
    note: "",
    recheckDone: false,
    recheckDoneDate: null,
    createdAt: base + index,
    ...fields,
  });
  return [
    make(1, {
      horseId: "HORSE-18",
      trimDate: addDaysISO(today, -63),
      nextCheckDate: addDaysISO(today, -21),
      hooves: { LF: "良好", RF: "外侧磨耗", LH: "良好", RH: "良好" },
      shoeType: "铝蹄铁",
      recheckDone: true,
      recheckDoneDate: addDaysISO(today, -21),
    }),
    make(2, {
      horseId: "HORSE-18",
      trimDate: addDaysISO(today, -21),
      nextCheckDate: addDaysISO(today, 5),
      gaitLevel: "mild",
      gaitNote: "右前蹄着地迟疑，慢步时明显",
      hoofAssessment: "蹄踵过低",
      hooves: { LF: "良好", RF: "蹄踵过低", LH: "良好", RH: "良好" },
      shoeType: "加垫蹄铁",
      note: "右前蹄加垫后步态改善，照片已归档",
    }),
    make(3, {
      horseId: "HORSE-27",
      trimDate: addDaysISO(today, -31),
      nextCheckDate: addDaysISO(today, -3),
      gaitLevel: "severe",
      gaitNote: "后蹄迈步明显变短",
      hoofAssessment: "蹄壁裂纹",
      hooves: { LF: "良好", RF: "良好", LH: "蹄壁裂纹", RH: "良好" },
      shoeType: "普通钢蹄铁",
      note: "左后蹄裂纹处已打磨，需密切观察",
    }),
    make(4, {
      horseId: "HORSE-31",
      trimDate: addDaysISO(today, -49),
      nextCheckDate: addDaysISO(today, -7),
      shoeType: "裸蹄（无蹄铁）",
      nailPattern: "无",
      recheckDone: true,
      recheckDoneDate: addDaysISO(today, -7),
    }),
  ];
}

export function loadRecords(): TrimRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return seedRecords();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalize).filter((r): r is TrimRecord => r !== null);
  } catch {
    return [];
  }
}

export function saveRecords(records: TrimRecord[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // 存储满或被禁用时静默失败，页面内数据仍可用
  }
}

export function clearRecords(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 同上
  }
}
