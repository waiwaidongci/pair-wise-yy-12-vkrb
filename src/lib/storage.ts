import { HOOF_KEYS, STORAGE_KEY } from "../constants";
import type { ArchiveState, HoofKey, Horse, TrimRecord } from "../types";

const EMPTY_STATE: ArchiveState = { horses: [], version: 1 };

function sanitizeHoof(value: unknown): { condition: string; nailPositions: string } {
  const v = (value ?? {}) as Record<string, unknown>;
  return {
    condition: typeof v.condition === "string" ? v.condition : "",
    nailPositions: typeof v.nailPositions === "string" ? v.nailPositions : "",
  };
}

function sanitizeRecord(value: unknown): TrimRecord | null {
  const v = (value ?? {}) as Record<string, unknown>;
  if (typeof v.id !== "string" || typeof v.date !== "string") return null;
  const rawHooves = (v.hooves ?? {}) as Record<string, unknown>;
  const hooves = {} as Record<HoofKey, { condition: string; nailPositions: string }>;
  for (const key of HOOF_KEYS) {
    hooves[key] = sanitizeHoof(rawHooves[key]);
  }
  return {
    id: v.id,
    date: v.date,
    gaitIssue: typeof v.gaitIssue === "string" ? v.gaitIssue : "",
    hoofEvaluation: typeof v.hoofEvaluation === "string" ? v.hoofEvaluation : "",
    hooves,
    shoeAfter: typeof v.shoeAfter === "string" ? v.shoeAfter : "",
    shoeBefore: typeof v.shoeBefore === "string" ? v.shoeBefore : "",
    reviewDate: typeof v.reviewDate === "string" ? v.reviewDate : "",
    reviewHandled: Boolean(v.reviewHandled),
    note: typeof v.note === "string" ? v.note : "",
    createdAt: typeof v.createdAt === "number" ? v.createdAt : 0,
  };
}

function sanitizeState(value: unknown): ArchiveState {
  const v = (value ?? {}) as Record<string, unknown>;
  const rawHorses = Array.isArray(v.horses) ? v.horses : [];
  const horses: Horse[] = [];
  for (const raw of rawHorses) {
    const h = (raw ?? {}) as Record<string, unknown>;
    if (typeof h.id !== "string" || typeof h.horseNo !== "string") continue;
    const records = (Array.isArray(h.records) ? h.records : [])
      .map(sanitizeRecord)
      .filter((r): r is TrimRecord => r !== null);
    horses.push({
      id: h.id,
      horseNo: h.horseNo.trim().toUpperCase(),
      category: h.category === "休养马" ? "休养马" : "运动马",
      records,
    });
  }
  return { horses, version: 1 };
}

/** 从 localStorage 读取档案；读取失败时返回空档案而不是抛错 */
export function loadArchive(storage: Storage | null): ArchiveState {
  if (!storage) return EMPTY_STATE;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    return sanitizeState(JSON.parse(raw));
  } catch {
    return EMPTY_STATE;
  }
}

/** 把档案写入 localStorage；容量不足等异常向上抛，由调用方提示 */
export function saveArchive(storage: Storage | null, state: ArchiveState): void {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}
