import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ArchiveState, Horse, HorseCategory, TrimRecord } from "../types";
import { loadArchive, saveArchive } from "./storage";
import { createId } from "./id";
import {
  filterSummaries,
  previousShoeType,
  selectMetrics,
  selectReminders,
  selectSummaries,
  type FilterKey,
} from "./selectors";
import { todayISO } from "./date";

export interface NewRecordDraft {
  horseNo: string;
  category: HorseCategory;
  date: string;
  gaitIssue: string;
  hoofEvaluation: string;
  hooves: TrimRecord["hooves"];
  shoeAfter: string;
  reviewDate: string;
  note: string;
}

function emptyHooves(): TrimRecord["hooves"] {
  return {
    LF: { condition: "", nailPositions: "" },
    RF: { condition: "", nailPositions: "" },
    LH: { condition: "", nailPositions: "" },
    RH: { condition: "", nailPositions: "" },
  };
}

export function emptyDraft(nowISO: string): NewRecordDraft {
  return {
    horseNo: "",
    category: "运动马",
    date: nowISO,
    gaitIssue: "",
    hoofEvaluation: "",
    hooves: emptyHooves(),
    shoeAfter: "",
    reviewDate: "",
    note: "",
  };
}

export function useArchive() {
  const [state, setState] = useState<ArchiveState>(() => loadArchive(typeof localStorage === "undefined" ? null : localStorage));
  const [nowISO] = useState(() => todayISO());
  const [filter, setFilter] = useState<FilterKey>("全部");
  const [keyword, setKeyword] = useState("");
  const [persistError, setPersistError] = useState(false);
  const skipSave = useRef(true); // 首次渲染只读取，不回写

  // 记录层：数据变化后写入浏览器本地
  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    try {
      saveArchive(typeof localStorage === "undefined" ? null : localStorage, state);
      setPersistError(false);
    } catch {
      setPersistError(true);
    }
  }, [state]);

  const summaries = useMemo(() => selectSummaries(state, nowISO), [state, nowISO]);
  const reminders = useMemo(() => selectReminders(state, nowISO), [state, nowISO]);
  const metrics = useMemo(() => selectMetrics(state, nowISO), [state, nowISO]);
  const visibleSummaries = useMemo(
    () => filterSummaries(summaries, filter, keyword),
    [summaries, filter, keyword],
  );

  const findHorse = useCallback(
    (horseNo: string): Horse | undefined => {
      const no = horseNo.trim().toUpperCase();
      return state.horses.find((h) => h.horseNo === no);
    },
    [state.horses],
  );

  /** 登记一条修蹄记录；同马号接在旧记录后面，并自动补换铁前类型 */
  const addRecord = useCallback((draft: NewRecordDraft) => {
    const horseNo = draft.horseNo.trim().toUpperCase();
    if (!horseNo || !draft.date || !draft.shoeAfter) {
      throw new Error("马号、修蹄日期和蹄铁类型为必填项");
    }
    const record: TrimRecord = {
      id: createId(),
      date: draft.date,
      gaitIssue: draft.gaitIssue.trim(),
      hoofEvaluation: draft.hoofEvaluation.trim(),
      hooves: draft.hooves,
      shoeBefore: "",
      shoeAfter: draft.shoeAfter,
      reviewDate: draft.reviewDate,
      reviewHandled: false,
      note: draft.note.trim(),
      createdAt: Date.now(),
    };
    setState((prev) => {
      const horses = [...prev.horses];
      const idx = horses.findIndex((h) => h.horseNo === horseNo);
      if (idx >= 0) {
        const horse = horses[idx];
        record.shoeBefore = previousShoeType(horse.records);
        horses[idx] = { ...horse, records: [...horse.records, record] };
      } else {
        horses.push({ id: createId(), horseNo, category: draft.category, records: [record] });
      }
      return { ...prev, horses };
    });
    return { horseNo, recordId: record.id };
  }, []);

  const updateRecord = useCallback((horseId: string, recordId: string, patch: Partial<TrimRecord>) => {
    setState((prev) => ({
      ...prev,
      horses: prev.horses.map((h) =>
        h.id === horseId
          ? { ...h, records: h.records.map((r) => (r.id === recordId ? { ...r, ...patch } : r)) }
          : h,
      ),
    }));
  }, []);

  /** 复查处理：处理过后不再出现在提醒区；可在历史里撤销 */
  const markReviewHandled = useCallback(
    (horseId: string, recordId: string, handled: boolean) => {
      updateRecord(horseId, recordId, { reviewHandled: handled });
    },
    [updateRecord],
  );

  const deleteRecord = useCallback((horseId: string, recordId: string) => {
    setState((prev) => ({
      ...prev,
      horses: prev.horses
        .map((h) =>
          h.id === horseId ? { ...h, records: h.records.filter((r) => r.id !== recordId) } : h,
        )
        .filter((h) => h.records.length > 0),
    }));
  }, []);

  return {
    nowISO,
    summaries,
    visibleSummaries,
    reminders,
    metrics,
    filter,
    setFilter,
    keyword,
    setKeyword,
    findHorse,
    addRecord,
    markReviewHandled,
    deleteRecord,
    persistError,
  };
}
