import { HOOF_KEYS, HOOF_LABELS } from "../constants";
import { sortRecords } from "./selectors";
import type { ArchiveState } from "../types";

function csvCell(value: string): string {
  const v = value ?? "";
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

/** 把档案展开成一行一条修蹄记录的 CSV（带 BOM，Excel 可直接打开） */
export function buildCSV(state: ArchiveState): string {
  const header = [
    "马号",
    "分类",
    "修蹄日期",
    "步态问题",
    "蹄形评估",
    ...HOOF_KEYS.flatMap((k) => [`${HOOF_LABELS[k]}蹄状态`, `${HOOF_LABELS[k]}钉位`]),
    "换铁前",
    "换铁后",
    "下次复查",
    "复查状态",
    "备注",
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const horse of state.horses) {
    for (const r of sortRecords(horse.records)) {
      lines.push(
        [
          horse.horseNo,
          horse.category,
          r.date,
          r.gaitIssue,
          r.hoofEvaluation,
          ...HOOF_KEYS.flatMap((k) => [r.hooves[k].condition, r.hooves[k].nailPositions]),
          r.shoeBefore || "初次装蹄",
          r.shoeAfter,
          r.reviewDate,
          r.reviewHandled ? "已处理" : "待处理",
          r.note,
        ]
          .map(csvCell)
          .join(","),
      );
    }
  }
  return "﻿" + lines.join("\r\n");
}
