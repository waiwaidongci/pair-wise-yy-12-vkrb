import type { Metrics } from "../domain";

const ITEMS: Array<{ key: keyof Metrics; label: string }> = [
  { key: "pendingRechecks", label: "待复查" },
  { key: "abnormalGait", label: "异常步态" },
  { key: "shoeChanges", label: "更换蹄铁" },
  { key: "horses", label: "马匹档案" },
];

export default function MetricsBar({ metrics }: { metrics: Metrics }) {
  return (
    <section className="metrics">
      {ITEMS.map((item) => (
        <article key={item.key}>
          <small>{item.label}</small>
          <strong>{metrics[item.key]}</strong>
        </article>
      ))}
    </section>
  );
}
