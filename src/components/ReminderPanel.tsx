import { describeDue } from "../lib/date";
import type { Reminder } from "../lib/selectors";

interface Props {
  reminders: Reminder[];
  nowISO: string;
  onHandle: (horseId: string, recordId: string) => void;
}

const STATUS_LABEL: Record<Reminder["status"], string> = {
  overdue: "已逾期",
  due: "今天到期",
  upcoming: "临期",
};

export function ReminderPanel({ reminders, nowISO, onHandle }: Props) {
  return (
    <section className="panel reminder-panel">
      <div className="heading">
        <div>
          <p>复查提醒</p>
          <h2>
            到期待办
            {reminders.length > 0 && <span className="count-badge">{reminders.length}</span>}
          </h2>
        </div>
      </div>
      {reminders.length === 0 ? (
        <p className="empty-inline">近期没有到期的复查，处理过的提醒不会再出现。</p>
      ) : (
        <div className="reminder-list">
          {reminders.map((r) => (
            <article key={r.record.id} className={`reminder-item status-${r.status}`}>
              <div className="reminder-main">
                <div className="reminder-title">
                  <span className={`status-tag status-${r.status}`}>{STATUS_LABEL[r.status]}</span>
                  <h3>{r.horseNo}</h3>
                  <span className="muted">{r.category}</span>
                </div>
                <p>
                  复查日期 {r.record.reviewDate} · {describeDue(r.record.reviewDate, nowISO)}
                  {r.record.gaitIssue ? ` · ${r.record.gaitIssue}` : ""}
                </p>
              </div>
              <button className="primary small" onClick={() => onHandle(r.horseId, r.record.id)}>
                标记已处理
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
