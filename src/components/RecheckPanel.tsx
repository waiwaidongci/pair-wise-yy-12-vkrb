import { useMemo } from "react";
import type { TrimRecord } from "../types";
import { getDoneRechecks, getPendingRechecks, recheckLabel } from "../domain";

interface RecheckPanelProps {
  records: TrimRecord[];
  onMarkDone: (id: string) => void;
}

export default function RecheckPanel({ records, onMarkDone }: RecheckPanelProps) {
  const pending = useMemo(() => getPendingRechecks(records), [records]);
  const done = useMemo(() => getDoneRechecks(records), [records]);

  return (
    <aside className="panel recheck-panel">
      <div className="heading">
        <div>
          <p>复查提醒</p>
          <h2>到期与临近</h2>
        </div>
        <span className={`badge ${pending.length > 0 ? "overdue" : "done"}`}>
          {pending.length} 项
        </span>
      </div>
      {pending.length === 0 ? (
        <p className="empty">没有到期或临近的复查，可以安心修蹄。</p>
      ) : (
        <ul className="recheck-list">
          {pending.map(({ record, status, days }) => (
            <li key={record.id} className={`recheck-item ${status}`}>
              <div className="recheck-info">
                <div className="recheck-title">
                  <strong>{record.horseId}</strong>
                  <span className={`badge ${status}`}>{recheckLabel(status, days)}</span>
                </div>
                <small>
                  复查日 {record.nextCheckDate} · {record.shoeType}
                </small>
              </div>
              <button onClick={() => onMarkDone(record.id)}>标记已复查</button>
            </li>
          ))}
        </ul>
      )}
      {done.length > 0 && (
        <details className="done-list">
          <summary>已处理复查（{done.length}）</summary>
          <ul>
            {done.map((r) => (
              <li key={r.id}>
                <strong>{r.horseId}</strong>
                <span>
                  复查日 {r.nextCheckDate} · 处理于 {r.recheckDoneDate}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </aside>
  );
}
