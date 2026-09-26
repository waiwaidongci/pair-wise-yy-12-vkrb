export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDaysISO(baseISO: string, days: number): string {
  const d = new Date(`${baseISO}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** 返回 ISO 日期与今天相差的天数：负数已过期，0 为今天 */
export function daysUntil(iso: string, nowISO: string): number {
  const target = new Date(`${iso}T00:00:00`).getTime();
  const now = new Date(`${nowISO}T00:00:00`).getTime();
  return Math.round((target - now) / 86_400_000);
}

export function describeDue(iso: string, nowISO: string): string {
  const n = daysUntil(iso, nowISO);
  if (n < 0) return `已逾期 ${-n} 天`;
  if (n === 0) return "今天到期";
  return `还有 ${n} 天`;
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  return iso;
}
