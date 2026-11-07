"use client";

import type { ReactNode } from "react";

export const SERIES = { a: "#2563EB", b: "#0D9488", muted: "#CBD5E1", ai: "#7C3AED" };

export const axisProps = {
  tick: { fill: "#64748B", fontSize: 12 },
  axisLine: false,
  tickLine: false,
} as const;

export const gridProps = { stroke: "#EEF2F7", vertical: false } as const;

interface TipPayload {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

/** Recharts 공용 툴팁 */
export function ChartTip({
  active, payload, label, unit = "", format,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: ReactNode;
  unit?: string;
  format?: (v: number, name: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] shadow-float">
      {label !== undefined && label !== "" && <div className="mb-1 font-semibold text-ink">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-slate-600">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}</span>
          <b className="ml-auto pl-3 tabular text-ink">
            {typeof p.value === "number" ? (format ? format(p.value, String(p.name)) : `${p.value}${unit}`) : p.value}
          </b>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-slate-600">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-[3px] w-4 rounded-full" style={{ background: i.dashed ? `repeating-linear-gradient(90deg, ${i.color} 0 4px, transparent 4px 7px)` : i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
