import { useMemo, useState } from "react";
import {
  HOOF_CONDITIONS,
  HOOF_KEYS,
  HOOF_LABELS,
  HORSE_CATEGORIES,
  NAIL_PRESETS,
  SHOE_TYPES,
} from "../constants";
import { addDaysISO } from "../lib/date";
import { shoeChangeText, type HorseSummary } from "../lib/selectors";
import type { HoofKey, HorseCategory } from "../types";
import { emptyDraft, type NewRecordDraft } from "../lib/useArchive";

interface Props {
  nowISO: string;
  horseNos: string[];
  findHorse: (no: string) => { category: HorseCategory; records: unknown[] } | undefined;
  summaries: HorseSummary[];
  onSubmit: (draft: NewRecordDraft) => { horseNo: string };
  onSaved: (horseNo: string) => void;
}

export function RecordForm({ nowISO, horseNos, findHorse, summaries, onSubmit, onSaved }: Props) {
  const [draft, setDraft] = useState<NewRecordDraft>(() => emptyDraft(nowISO));
  const [error, setError] = useState("");

  const horseNo = draft.horseNo.trim().toUpperCase();
  const existing = horseNo ? findHorse(horseNo) : undefined;
  const lastShoe = useMemo(() => {
    const summary = summaries.find((s) => s.horse.horseNo === horseNo);
    return summary?.latest?.shoeAfter ?? "";
  }, [summaries, horseNo]);

  const set = <K extends keyof NewRecordDraft>(key: K, value: NewRecordDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setHoof = (key: HoofKey, patch: Partial<NewRecordDraft["hooves"][HoofKey]>) =>
    setDraft((d) => ({ ...d, hooves: { ...d.hooves, [key]: { ...d.hooves[key], ...patch } } }));

  const handleSubmit = () => {
    const payload: NewRecordDraft = {
      ...draft,
      category: existing ? (existing.category as HorseCategory) : draft.category,
    };
    try {
      const { horseNo: savedNo } = onSubmit(payload);
      setDraft(emptyDraft(nowISO));
      setError("");
      onSaved(savedNo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    }
  };

  return (
    <section className="panel form-panel">
      <div className="heading">
        <div>
          <p>登记修蹄</p>
          <h2>新修整记录</h2>
        </div>
      </div>

      {existing && (
        <div className="inline-notice">
          已识别档案马 <b>{horseNo}</b>（{existing.category}，已有 {existing.records.length} 条记录）
          {lastShoe ? `，上次换的是「${lastShoe}」` : ""}，本次记录会接到旧记录后面。
        </div>
      )}
      {error && <div className="inline-error">{error}</div>}

      <div className="field-grid">
        <label className="span-2">
          <span>马号 *</span>
          <input
            list="horse-no-list"
            value={draft.horseNo}
            placeholder="如 HORSE-18"
            onChange={(e) => set("horseNo", e.target.value)}
          />
          <datalist id="horse-no-list">
            {horseNos.map((no) => (
              <option key={no} value={no} />
            ))}
          </datalist>
        </label>

        <label>
          <span>马匹分类</span>
          <select
            value={existing ? existing.category : draft.category}
            disabled={Boolean(existing)}
            onChange={(e) => set("category", e.target.value as HorseCategory)}
          >
            {HORSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>修蹄日期 *</span>
          <input type="date" value={draft.date} onChange={(e) => set("date", e.target.value)} />
        </label>

        <label className="span-2">
          <span>步态问题</span>
          <input
            value={draft.gaitIssue}
            placeholder="如 右前蹄外侧磨耗、运步轻微不稳；无异常可留空"
            onChange={(e) => set("gaitIssue", e.target.value)}
          />
        </label>

        <label className="span-2">
          <span>蹄形评估</span>
          <input
            value={draft.hoofEvaluation}
            placeholder="整体蹄形、蹄角度、蹄叉状态等"
            onChange={(e) => set("hoofEvaluation", e.target.value)}
          />
        </label>
      </div>

      <div className="sub-heading">四蹄状态与钉位</div>
      <div className="hoof-grid">
        {HOOF_KEYS.map((key) => (
          <fieldset key={key} className="hoof-card">
            <legend>{HOOF_LABELS[key]}蹄</legend>
            <label>
              <span>蹄状态</span>
              <input
                list="hoof-condition-list"
                value={draft.hooves[key].condition}
                placeholder="正常 / 裂蹄 / 磨耗…"
                onChange={(e) => setHoof(key, { condition: e.target.value })}
              />
            </label>
            <label>
              <span>钉位</span>
              <input
                list="nail-preset-list"
                value={draft.hooves[key].nailPositions}
                placeholder="如 标准4钉"
                onChange={(e) => setHoof(key, { nailPositions: e.target.value })}
              />
            </label>
          </fieldset>
        ))}
        <datalist id="hoof-condition-list">
          {HOOF_CONDITIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <datalist id="nail-preset-list">
          {NAIL_PRESETS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="field-grid">
        <label>
          <span>蹄铁类型（换上）*</span>
          <select value={draft.shoeAfter} onChange={(e) => set("shoeAfter", e.target.value)}>
            <option value="">请选择</option>
            {SHOE_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>换铁前类型</span>
          <input value={lastShoe ? shoeChangeText(lastShoe, draft.shoeAfter || "?") : "初次装蹄"} disabled />
        </label>
        <label>
          <span>下次复查日期</span>
          <input
            type="date"
            value={draft.reviewDate}
            min={draft.date}
            onChange={(e) => set("reviewDate", e.target.value)}
          />
        </label>
        <label>
          <span>快捷复查</span>
          <select
            value=""
            onChange={(e) => {
              const days = Number(e.target.value);
              if (draft.date && days > 0) set("reviewDate", addDaysISO(draft.date, days));
            }}
          >
            <option value="">按修蹄日期推算…</option>
            <option value="7">7 天后</option>
            <option value="14">14 天后</option>
            <option value="21">21 天后</option>
            <option value="30">30 天后</option>
          </select>
        </label>
        <label className="span-2">
          <span>照片备注 / 说明</span>
          <textarea
            rows={2}
            value={draft.note}
            placeholder="照片编号、处理说明、用药情况等"
            onChange={(e) => set("note", e.target.value)}
          />
        </label>
      </div>

      <div className="form-actions">
        <button className="primary" onClick={handleSubmit}>
          保存记录
        </button>
        <button onClick={() => setDraft(emptyDraft(nowISO))}>清空重填</button>
      </div>
    </section>
  );
}
