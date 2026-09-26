import { useMemo, useState } from "react";
import type { TrimRecord } from "../types";
import {
  GAIT_LABELS,
  HOOF_KEYS,
  HOOF_LABELS,
  daysUntil,
  getHorseHistory,
  getHorseIds,
  recheckLabel,
  recheckStatus,
  shoeChangeAt,
} from "../domain";

interface HorseListProps {
  records: TrimRecord[];
  onMarkDone: (id: string) => void;
}

export default function HorseList({ records, onMarkDone }: HorseListProps) {
  const [query, setQuery] = useState("");

  const horses = useMemo(() => {
    const q = query.trim().toLowerCase();
    return getHorseIds(records)
      .filter((id) => !q || id.toLowerCase().includes(q))
      .map((id) => ({ id, history: getHorseHistory(records, id) }))
      .sort((a, b) => {
        const lastA = a.history[a.history.length - 1];
        const lastB = b.history[b.history.length - 1];
        return (lastB?.trimDate ?? "").localeCompare(lastA?.trimDate ?? "");
      });
  }, [records, query]);

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>马匹档案</p>
          <h2>修蹄历史与换铁记录</h2>
        </div>
        <input
          className="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索马匹编号"
        />
      </div>
      {horses.length === 0 ? (
        <p className="empty">
          {records.length === 0
            ? "还没有档案，先在上方登记第一匹马的修蹄记录。"
            : "没有匹配的马匹编号。"}
        </p>
      ) : (
        <div className="horse-list">
          {horses.map(({ id, history }) => {
            const latest = history[history.length - 1];
            const pendingCount = history.filter(
              (r) => !r.recheckDone && recheckStatus(r) !== "scheduled"
            ).length;
            return (
              <article key={id} className="horse-card">
                <header className="horse-head">
                  <div>
                    <h3>{id}</h3>
                    <span className="meta">
                      共 {history.length} 次修蹄 · 当前蹄铁「{latest.shoeType}」
                    </span>
                  </div>
                  {pendingCount > 0 && (
                    <span className="badge overdue">{pendingCount} 项待复查</span>
                  )}
                </header>
                <div className="history">
                  {history.map((record, index) => {
                    const change = shoeChangeAt(records, record);
                    const status = recheckStatus(record);
                    const days = daysUntil(record.nextCheckDate);
                    return (
                      <div key={record.id} className="history-item">
                        <b className="idx">{String(index + 1).padStart(2, "0")}</b>
                        <div className="history-body">
                          <div className="history-top">
                            <strong>{record.trimDate}</strong>
                            {record.gaitLevel !== "normal" && (
                              <span className={`badge gait-${record.gaitLevel}`}>
                                {GAIT_LABELS[record.gaitLevel]}
                              </span>
                            )}
                            <span className={`badge ${status}`}>
                              {record.recheckDone
                                ? `已复查 ${record.recheckDoneDate ?? ""}`
                                : recheckLabel(status, days)}
                            </span>
                            {!record.recheckDone && status !== "scheduled" && (
                              <button className="mini" onClick={() => onMarkDone(record.id)}>
                                标记已复查
                              </button>
                            )}
                          </div>
                          {record.gaitNote && <p className="meta">步态：{record.gaitNote}</p>}
                          <p className="meta">蹄形评估：{record.hoofAssessment}</p>
                          <div className="hoof-chips">
                            {HOOF_KEYS.map((key) => (
                              <span
                                key={key}
                                className={`hoof-chip ${record.hooves[key] === "良好" ? "" : "bad"}`}
                              >
                                {HOOF_LABELS[key]} · {record.hooves[key]}
                              </span>
                            ))}
                          </div>
                          <p className="meta">
                            蹄铁：{record.shoeType}
                            {change && (
                              <span className="badge change">
                                换铁 {change.from} → {change.to}
                              </span>
                            )}
                          </p>
                          <p className="meta">钉位：{record.nailPattern}</p>
                          {record.note && <p className="meta">备注：{record.note}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
