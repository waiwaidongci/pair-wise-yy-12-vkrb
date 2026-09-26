import { assert } from "node:console";
import { addDaysISO, todayISO } from "../src/lib/date";
import { selectReminders, selectSummaries, previousShoeType } from "../src/lib/selectors";
import { loadArchive, saveArchive } from "../src/lib/storage";
import type { ArchiveState, TrimRecord } from "../src/types";

function makeRecord(partial: Partial<TrimRecord>): TrimRecord {
  return {
    id: Math.random().toString(36).slice(2),
    date: partial.date ?? todayISO(),
    gaitIssue: partial.gaitIssue ?? "",
    hoofEvaluation: "",
    hooves: {
      LF: { condition: "", nailPositions: "" },
      RF: { condition: "", nailPositions: "" },
      LH: { condition: "", nailPositions: "" },
      RH: { condition: "", nailPositions: "" },
    },
    shoeAfter: partial.shoeAfter ?? "铝蹄铁",
    shoeBefore: partial.shoeBefore ?? "",
    reviewDate: partial.reviewDate ?? "",
    reviewHandled: partial.reviewHandled ?? false,
    note: "",
    createdAt: partial.createdAt ?? Date.now(),
  };
}

// 1) 同马再修蹄：换铁前类型取上一次
const r1 = makeRecord({ shoeAfter: "普通铁蹄铁", createdAt: 1000 });
const horseState: ArchiveState = {
  version: 1,
  horses: [{ id: "h1", horseNo: "HORSE-18", category: "运动马", records: [r1] }],
};
assert(previousShoeType(horseState.horses[0].records) === "普通铁蹄铁", "应取上次换的蹄铁类型");

// 2) 复查提醒：逾期 / 今天 / 临期 出现；远期不出现；处理后消失但记录还在
const now = todayISO();
const state: ArchiveState = {
  version: 1,
  horses: [
    {
      id: "overdue",
      horseNo: "HORSE-01",
      category: "运动马",
      records: [makeRecord({ reviewDate: addDaysISO(now, -3), gaitIssue: "右前跛行" })],
    },
    {
      id: "due",
      horseNo: "HORSE-02",
      category: "休养马",
      records: [makeRecord({ reviewDate: now })],
    },
    {
      id: "upcoming",
      horseNo: "HORSE-03",
      category: "运动马",
      records: [makeRecord({ reviewDate: addDaysISO(now, 5) })],
    },
    {
      id: "far",
      horseNo: "HORSE-04",
      category: "运动马",
      records: [makeRecord({ reviewDate: addDaysISO(now, 30) })],
    },
    {
      id: "handled",
      horseNo: "HORSE-05",
      category: "运动马",
      records: [makeRecord({ reviewDate: addDaysISO(now, -1), reviewHandled: true })],
    },
  ],
};

let reminders = selectReminders(state, now);
assert(reminders.length === 3, `应有 3 条提醒，实际 ${reminders.length}`);
assert(reminders[0].status === "overdue", "逾期排最前");
assert(reminders.every((r) => r.horseNo !== "HORSE-04"), "远期复查不提醒");
assert(reminders.every((r) => r.horseNo !== "HORSE-05"), "已处理不提醒");

const summaries = selectSummaries(state, now);
const handled = summaries.find((s) => s.horse.horseNo === "HORSE-05")!;
assert(handled.reviewState === "handled" && handled.recordCount === 1, "处理后历史仍保留");
const overdue = summaries.find((s) => s.horse.horseNo === "HORSE-01")!;
assert(overdue.abnormal === true, "跛行应标异常步态");

// 处理掉逾期那匹后，提醒减为 2
const state2: ArchiveState = {
  ...state,
  horses: state.horses.map((h) =>
    h.id === "overdue"
      ? { ...h, records: h.records.map((r) => ({ ...r, reviewHandled: true })) }
      : h,
  ),
};
reminders = selectReminders(state2, now);
assert(reminders.length === 2, `处理后应剩 2 条，实际 ${reminders.length}`);

// 3) localStorage 往返
const store = new Map<string, string>();
const fakeStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
} as unknown as Storage;

saveArchive(fakeStorage, state2);
const loaded = loadArchive(fakeStorage);
assert(loaded.horses.length === 5, "持久化往返马匹数一致");
assert(loaded.horses[0].records[0].hooves.LF !== undefined, "四蹄结构完整");
assert(loadArchive(null).horses.length === 0, "无 storage 时返回空档案");

// 损坏数据不炸
const bad = { ...fakeStorage };
(bad as unknown as { getItem: () => string }).getItem = () => "{not json";
assert(loadArchive(bad).horses.length === 0, "损坏数据回退为空档案");

console.log("smoke tests passed");
