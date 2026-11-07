import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const DAY_MS = 86_400_000;

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** 월요일 시작 주 */
export function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // 0 = Mon
  return addDays(x, -day);
}

export function weekdayIndex(d: Date) {
  return (d.getDay() + 6) % 7;
}

export function toKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromKey(k: string) {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}

export const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

export function fmtDate(d: Date | string, opts: "md" | "mdw" | "ymd" = "md") {
  const x = typeof d === "string" ? fromKey(d) : d;
  const md = `${x.getMonth() + 1}월 ${x.getDate()}일`;
  if (opts === "md") return md;
  if (opts === "mdw") return `${md} ${WEEKDAYS[weekdayIndex(x)]}요일`;
  return `${x.getFullYear()}.${String(x.getMonth() + 1).padStart(2, "0")}.${String(x.getDate()).padStart(2, "0")}`;
}

export function num(n: number, digits = 0) {
  return n.toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

/** 원 → "8,420만원" / "1억 1,200만원" */
export function won(n: number) {
  const man = Math.round(n / 10_000);
  if (man >= 10_000) {
    const eok = Math.floor(man / 10_000);
    const rest = man % 10_000;
    return rest ? `${eok}억 ${num(rest)}만원` : `${eok}억원`;
  }
  return `${num(man)}만원`;
}

export function pct(n: number, digits = 0) {
  return `${num(n, digits)}%`;
}

export function signed(n: number, digits = 0, suffix = "%p") {
  const s = n > 0 ? "+" : n < 0 ? "−" : "±";
  return `${s}${num(Math.abs(n), digits)}${suffix}`;
}

export function clamp(n: number, lo = 0, hi = 1) {
  return Math.min(hi, Math.max(lo, n));
}

/** 결정적 의사난수 (mock 데이터 안정화용) */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** 받침 유무에 따라 조사 선택: josa("걷기", "을", "를") → "걷기를" */
export function josa(word: string, withBatchim: string, without: string) {
  const ch = word.charCodeAt(word.length - 1);
  if (ch < 0xac00 || ch > 0xd7a3) return word + without;
  return word + ((ch - 0xac00) % 28 ? withBatchim : without);
}
