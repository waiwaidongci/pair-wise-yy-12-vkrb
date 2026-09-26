import type { Metrics } from "../lib/selectors";

const ITEMS: { key: keyof Metrics; label: string; tone: "green" | "red" | "brown" | "blue" }[] = [
  { key: "pendingReview", label: "待复查", tone: "green" },
  { key: "abnormalGait", label: "异常步态", tone: "red" },
  { key: "shoeChanged", label: "更换蹄铁", tone: "brown" },
  { key: "totalHorses", label: "马匹档案", tone: "blue" },
];

export function MetricsBar({ metrics }: { metrics: Metrics }) {
  return (
    <section className="metrics">
      {ITEMS.map((item) => (
        <article key={item.key} className={`tone-${item.tone}`}>
          <small>{item.label}</small>
          <strong>{metrics[item.key]}</strong>
        </article>
      ))}
    </section>
  );
}
