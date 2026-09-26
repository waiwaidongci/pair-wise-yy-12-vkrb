import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { GaitLevel, HoofKey, TrimRecord } from "../types";
import {
  DEFAULT_RECHECK_INTERVAL_DAYS,
  GAIT_LABELS,
  HOOF_KEYS,
  HOOF_LABELS,
  addDaysISO,
  getHorseHistory,
  todayISO,
} from "../domain";
import { createId } from "../store";

const HOOF_CONDITIONS = ["良好", "外侧磨耗", "内侧磨耗", "蹄壁裂纹", "蹄叉腐烂", "白线分离", "蹄踵过低"];
const SHOE_TYPE_SUGGESTIONS = ["普通钢蹄铁", "铝蹄铁", "加垫蹄铁", "蛋形蹄铁", "裸蹄（无蹄铁）", "定制蹄铁"];
const ASSESSMENT_SUGGESTIONS = ["蹄形正常", "蹄踵过低", "蹄尖过长", "内外侧不均衡", "蹄壁干燥", "蹄球受压"];
const GAIT_LEVELS: GaitLevel[] = ["normal", "mild", "severe"];

interface FormState {
  horseId: string;
  trimDate: string;
  nextCheckDate: string;
  gaitLevel: GaitLevel;
  gaitNote: string;
  hoofAssessment: string;
  hooves: Record<HoofKey, string>;
  shoeType: string;
  nailPattern: string;
  note: string;
}

function emptyForm(): FormState {
  const today = todayISO();
  return {
    horseId: "",
    trimDate: today,
    nextCheckDate: addDaysISO(today, DEFAULT_RECHECK_INTERVAL_DAYS),
    gaitLevel: "normal",
    gaitNote: "",
    hoofAssessment: "",
    hooves: { LF: "良好", RF: "良好", LH: "良好", RH: "良好" },
    shoeType: "",
    nailPattern: "",
    note: "",
  };
}

interface TrimFormProps {
  records: TrimRecord[];
  onAdd: (record: TrimRecord) => void;
}

export default function TrimForm({ records, onAdd }: TrimFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [savedHorse, setSavedHorse] = useState("");

  const knownHorses = useMemo(
    () => Array.from(new Set(records.map((r) => r.horseId))).sort(),
    [records]
  );

  const horseId = form.horseId.trim();
  const history = useMemo(
    () => (horseId ? getHorseHistory(records, horseId) : []),
    [records, horseId]
  );
  const lastRecord = history[history.length - 1];

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /** 输入已有马号时，带出上次的蹄铁、钉位和蹄形，方便接着修。 */
  const handleHorseId = (value: string) => {
    setForm((prev) => {
      const next = { ...prev, horseId: value };
      const h = getHorseHistory(records, value.trim());
      const last = h[h.length - 1];
      if (last) {
        next.shoeType = last.shoeType;
        next.nailPattern = last.nailPattern;
        next.hoofAssessment = last.hoofAssessment;
      }
      return next;
    });
  };

  const handleTrimDate = (value: string) => {
    setForm((prev) => ({
      ...prev,
      trimDate: value,
      nextCheckDate: value ? addDaysISO(value, DEFAULT_RECHECK_INTERVAL_DAYS) : "",
    }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!horseId) {
      setError("请填写马匹编号");
      return;
    }
    if (!form.trimDate || !form.nextCheckDate) {
      setError("请选择修蹄日期和下次复查日期");
      return;
    }
    onAdd({
      id: createId(),
      horseId,
      trimDate: form.trimDate,
      nextCheckDate: form.nextCheckDate,
      gaitLevel: form.gaitLevel,
      gaitNote: form.gaitNote.trim(),
      hoofAssessment: form.hoofAssessment.trim() || "蹄形正常",
      hooves: { ...form.hooves },
      shoeType: form.shoeType.trim() || "未填写",
      nailPattern: form.nailPattern.trim() || "未填写",
      note: form.note.trim(),
      recheckDone: false,
      recheckDoneDate: null,
      createdAt: Date.now(),
    });
    setForm(emptyForm());
    setError("");
    setSavedHorse(horseId);
    window.setTimeout(() => setSavedHorse(""), 4000);
  };

  return (
    <section className="panel form-panel">
      <div className="heading">
        <div>
          <p>修蹄登记</p>
          <h2>新增修蹄记录</h2>
        </div>
        <button type="submit" form="trim-form" className="primary">
          保存记录
        </button>
      </div>
      <form id="trim-form" onSubmit={submit}>
        <div className="field-grid">
          <label>
            <span>马匹编号 *</span>
            <input
              value={form.horseId}
              onChange={(e) => handleHorseId(e.target.value)}
              placeholder="如 HORSE-18"
              list="known-horses"
            />
            <datalist id="known-horses">
              {knownHorses.map((id) => (
                <option key={id} value={id} />
              ))}
            </datalist>
          </label>
          <label>
            <span>修蹄日期</span>
            <input
              type="date"
              value={form.trimDate}
              onChange={(e) => handleTrimDate(e.target.value)}
            />
          </label>
          {lastRecord && (
            <p className="hint full">
              {horseId} 已有 {history.length} 次记录，上次 {lastRecord.trimDate} 使用「
              {lastRecord.shoeType}」，本次将接在其后并自动对比换铁。
            </p>
          )}
          <label>
            <span>步态评估</span>
            <select
              value={form.gaitLevel}
              onChange={(e) => update("gaitLevel", e.target.value as GaitLevel)}
            >
              {GAIT_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {GAIT_LABELS[level]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>步态问题描述</span>
            <input
              value={form.gaitNote}
              onChange={(e) => update("gaitNote", e.target.value)}
              placeholder="如：右前蹄着地迟疑"
            />
          </label>
          <label>
            <span>蹄形评估</span>
            <input
              value={form.hoofAssessment}
              onChange={(e) => update("hoofAssessment", e.target.value)}
              placeholder="如：蹄踵过低"
              list="assessment-suggestions"
            />
            <datalist id="assessment-suggestions">
              {ASSESSMENT_SUGGESTIONS.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>
          <label>
            <span>下次复查日期（默认 6 周后）</span>
            <input
              type="date"
              value={form.nextCheckDate}
              onChange={(e) => update("nextCheckDate", e.target.value)}
            />
          </label>
          <div className="hoof-grid full">
            {HOOF_KEYS.map((key) => (
              <label key={key}>
                <span>{HOOF_LABELS[key]}状态</span>
                <select
                  value={form.hooves[key]}
                  onChange={(e) =>
                    update("hooves", { ...form.hooves, [key]: e.target.value })
                  }
                >
                  {HOOF_CONDITIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <label>
            <span>蹄铁类型</span>
            <input
              value={form.shoeType}
              onChange={(e) => update("shoeType", e.target.value)}
              placeholder="如：铝蹄铁"
              list="shoe-type-suggestions"
            />
            <datalist id="shoe-type-suggestions">
              {SHOE_TYPE_SUGGESTIONS.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>
          <label>
            <span>钉位</span>
            <input
              value={form.nailPattern}
              onChange={(e) => update("nailPattern", e.target.value)}
              placeholder="如：前蹄每侧4钉、后蹄每侧3钉"
            />
          </label>
          <label className="full">
            <span>照片与备注</span>
            <textarea
              value={form.note}
              onChange={(e) => update("note", e.target.value)}
              placeholder="照片归档位置、教练意见、用药等"
            />
          </label>
        </div>
        <div className="form-foot">
          {error && <span className="error">{error}</span>}
          {savedHorse && <span className="saved">✓ 已保存 {savedHorse} 的记录，下方列表已更新</span>}
        </div>
      </form>
    </section>
  );
}
