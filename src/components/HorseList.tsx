import { useState } from "react";
import { HOOF_KEYS, HOOF_LABELS } from "../constants";
import { describeDue, formatDate } from "../lib/date";
import { isAbnormalGait, shoeChangeText, type FilterKey, type HorseSummary } from "../lib/selectors";

const FILTERS: FilterKey[] = ["全部", "前蹄", "后蹄", "运动马", "休养马"];

const REVIEW_BADGE: Record<HorseSummary["reviewState"], { text: string; cls: string } | null> = {
  overdue: { text: "复查逾期", cls: "badge-red" },
  due: { text: "今天复查", cls: "badge-red" },
  upcoming: { text: "近期复查", cls: "badge-amber" },
  ok: { text: "复查已排期", cls: "badge-muted" },
  handled: { text: "复查已处理", cls: "badge-green" },
  none: null,
};

interface Props {
  summaries: HorseSummary[];
  total: number;
  nowISO: string;
  filter: FilterKey;
  keyword: string;
  expandedNo: string | null;
  onFilterChange: (f: FilterKey) => void;
  onKeywordChange: (k: string) => void;
  onToggleExpand: (horseId: string) => void;
  onHandleReview: (horseId: string, recordId: string, handled: boolean) => void;
  onDelete: (horseId: string, recordId: string) => void;
  onExport: () => void;
}

export function HorseList({
  summaries,
  total,
  nowISO,
  filter,
  keyword,
  expandedNo,
  onFilterChange,
  onKeywordChange,
  onToggleExpand,
  onHandleReview,
  onDelete,
  onExport,
}: Props) {
  return (
    <section className="panel list-panel">
      <div className="heading">
        <div>
          <p>马匹档案</p>
          <h2>
            修蹄记录列表
            <span className="count-badge">{total}</span>
          </h2>
        </div>
        <button onClick={onExport}>导出CSV</button>
      </div>

      <div className="list-toolbar">
        <div className="chips">
          {FILTERS.map((f) => (
            <button key={f} className={filter === f ? "chip-active" : ""} onClick={() => onFilterChange(f)}>
              {f}
            </button>
          ))}
        </div>
        <input
          className="search-input"
          value={keyword}
          placeholder="按马号搜索"
          onChange={(e) => onKeywordChange(e.target.value)}
        />
      </div>

      {summaries.length === 0 ? (
        <div className="empty-block">
          {total === 0
            ? "还没有档案。在左侧登记第一条修蹄记录，保存后立即出现在这里。"
            : "当前筛选条件下没有马匹。"}
        </div>
      ) : (
        <div className="horse-list">
          {summaries.map((s) => {
            const expanded = expandedNo === s.horse.id;
            const badge = REVIEW_BADGE[s.reviewState];
            return (
              <article key={s.horse.id} className="horse-card">
                <button className="horse-head" onClick={() => onToggleExpand(s.horse.id)}>
                  <div className="horse-id">
                    <h3>{s.horse.horseNo}</h3>
                    <span className="muted">
                      {s.horse.category} · {s.recordCount} 次修蹄
                    </span>
                  </div>
                  <div className="horse-badges">
                    {s.abnormal && <span className="badge badge-red">异常步态</span>}
                    {s.shoeChanged && <span className="badge badge-brown">已换铁</span>}
                    {badge && <span className={`badge ${badge.cls}`}>{badge.text}</span>}
                    {s.latest && (
                      <span className="muted">
                        最近 {formatDate(s.latest.date)}
                        {s.reviewState === "overdue" || s.reviewState === "due" || s.reviewState === "upcoming"
                          ? ` · 复查${describeDue(s.latest!.reviewDate, nowISO)}`
                          : ""}
                      </span>
                    )}
                    <span className={`expand-mark ${expanded ? "open" : ""}`}>▾</span>
                  </div>
                </button>

                {expanded && (
                  <HorseTimeline
                    summary={s}
                    nowISO={nowISO}
                    onHandleReview={onHandleReview}
                    onDelete={onDelete}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function HorseTimeline({
  summary,
  nowISO,
  onHandleReview,
  onDelete,
}: {
  summary: HorseSummary;
  nowISO: string;
  onHandleReview: (horseId: string, recordId: string, handled: boolean) => void;
  onDelete: (horseId: string, recordId: string) => void;
}) {
  const sorted = [...summary.horse.records].sort((a, b) =>
    a.date !== b.date ? b.date.localeCompare(a.date) : b.createdAt - a.createdAt,
  );

  return (
    <div className="timeline">
      {sorted.map((r, idx) => {
        const abnormal =
          isAbnormalGait(r.gaitIssue) ||
          HOOF_KEYS.some((k) => isAbnormalGait(r.hooves[k].condition)) ||
          isAbnormalGait(r.hoofEvaluation);
        const abnormalHooves = HOOF_KEYS.filter((k) => isAbnormalGait(r.hooves[k].condition));
        return (
          <div key={r.id} className="timeline-item">
            <div className="timeline-date">
              <b>{String(idx + 1).padStart(2, "0")}</b>
              <span>{formatDate(r.date)}</span>
            </div>
            <div className="timeline-body">
              <div className="timeline-tags">
                {abnormal && <span className="badge badge-red">异常标记</span>}
                {r.reviewDate && (
                  <span className={`badge ${r.reviewHandled ? "badge-green" : "badge-amber"}`}>
                    复查 {formatDate(r.reviewDate)}
                    {!r.reviewHandled ? ` · ${describeDue(r.reviewDate, nowISO)}` : " · 已处理"}
                  </span>
                )}
                <span className="badge badge-muted">{r.shoeAfter || "未填蹄铁类型"}</span>
              </div>
              {r.gaitIssue && (
                <p>
                  <em>步态问题：</em>
                  {r.gaitIssue}
                </p>
              )}
              {r.hoofEvaluation && (
                <p>
                  <em>蹄形评估：</em>
                  {r.hoofEvaluation}
                </p>
              )}
              <div className="hoof-mini-grid">
                {HOOF_KEYS.map((k) => (
                  <div key={k} className={`hoof-mini ${isAbnormalGait(r.hooves[k].condition) ? "is-abnormal" : ""}`}>
                    <span>{HOOF_LABELS[k]}</span>
                    <b>{r.hooves[k].condition || "正常"}</b>
                    <small>{r.hooves[k].nailPositions || "钉位未记"}</small>
                  </div>
                ))}
              </div>
              {abnormalHooves.length > 0 && (
                <p className="muted small">异常蹄：{abnormalHooves.map((k) => HOOF_LABELS[k]).join("、")}</p>
              )}
              <p>
                <em>换铁历史：</em>
                {shoeChangeText(r.shoeBefore, r.shoeAfter)}
                {r.shoeBefore && r.shoeBefore !== r.shoeAfter && <span className="badge badge-brown">换型</span>}
              </p>
              {r.note && (
                <p>
                  <em>备注：</em>
                  {r.note}
                </p>
              )}
              <div className="timeline-actions">
                {r.reviewDate &&
                  (r.reviewHandled ? (
                    <button
                      className="link-btn"
                      onClick={() => onHandleReview(summary.horse.id, r.id, false)}
                      title="撤销后会重新进入提醒区"
                    >
                      撤销复查处理
                    </button>
                  ) : (
                    <button className="link-btn" onClick={() => onHandleReview(summary.horse.id, r.id, true)}>
                      标记复查已处理
                    </button>
                  ))}
                <DeleteButton onConfirm={() => onDelete(summary.horse.id, r.id)} count={sorted.length} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DeleteButton({ onConfirm, count }: { onConfirm: () => void; count: number }) {
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <button className="link-btn danger" onClick={() => setArmed(true)}>
        删除
      </button>
    );
  }
  return (
    <span className="confirm-inline">
      确认删除？{count === 1 && "该马最后一条记录将一并移除档案。"}
      <button
        className="link-btn danger"
        onClick={() => {
          onConfirm();
          setArmed(false);
        }}
      >
        确认
      </button>
      <button className="link-btn" onClick={() => setArmed(false)}>
        取消
      </button>
    </span>
  );
}
