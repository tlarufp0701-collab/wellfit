"use client";

import { useState } from "react";
import { ArrowDownUp, ShieldCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/format";
import { AGE_BANDS, COMPANY, DEPT_STATS, crossCells, type DeptStat } from "@/lib/data/company";
import { useAdminFilters } from "@/components/admin-shell";
import { Card, Masked, SectionTitle, Segmented, useToast } from "@/components/ui";
import { axisProps, ChartTip, gridProps, SERIES } from "@/components/charts";

type Col = "usage" | "start" | "ret4" | "ret12" | "drop" | "reeng" | "wellness";
const COLS: { key: Col; label: string; higher: boolean }[] = [
  { key: "usage", label: "참여율", higher: true },
  { key: "start", label: "시작률", higher: true },
  { key: "ret4", label: "4주 지속률", higher: true },
  { key: "ret12", label: "12주 지속률", higher: true },
  { key: "drop", label: "중단률", higher: false },
  { key: "reeng", label: "재참여율", higher: true },
  { key: "wellness", label: "평균 웰니스", higher: true },
];

const avgOf = (k: Col) => DEPT_STATS.reduce((s, d) => s + d[k] * d.headcount, 0) / COMPANY.employees;

export default function Employees() {
  const { minGroup, setMinGroup } = useStore();
  const { dept, setDept } = useAdminFilters();
  const toast = useToast();
  const [metric, setMetric] = useState<Col>("ret4");
  const [sort, setSort] = useState<{ key: Col | "headcount"; dir: 1 | -1 }>({ key: "usage", dir: -1 });
  const [cross, setCross] = useState<"usage" | "reeng" | "ret4">("reeng");

  const rows = [...DEPT_STATS].sort((a, b) => ((a[sort.key] as number) - (b[sort.key] as number)) * sort.dir);
  const meta = COLS.find((c) => c.key === metric)!;
  const avg = avgOf(metric);
  const chart = DEPT_STATS.map((d) => ({ name: d.name, value: d[metric] }));
  const cells = crossCells(cross);
  const crossAvg = avgOf(cross);
  const hidden = cells.reduce((s, r) => s + r.cells.filter((c) => c.n < minGroup).length, 0);

  const cellTone = (d: DeptStat, k: Col) => {
    const diff = d[k] - avgOf(k);
    const good = COLS.find((c) => c.key === k)!.higher ? diff > 0 : diff < 0;
    if (Math.abs(diff) < 3) return "";
    return good ? "text-emerald-700" : "text-red-600";
  };

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-3 border-emerald-100 bg-emerald-50/50 p-4 sm:flex-row sm:items-center">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
        <p className="flex-1 text-[13.5px] text-slate-700">
          <b>개인을 특정할 수 없는 익명 집계입니다.</b> 개별 직원의 이름·건강정보는 제공되지 않으며, {minGroup}명 미만 그룹은 자동으로 비공개 처리됩니다.
        </p>
        <div className="flex items-center gap-2 text-[12.5px] text-slate-500">
          최소 공개 인원
          <Segmented
            size="sm"
            value={minGroup}
            onChange={(v) => {
              setMinGroup(v);
              toast({ title: `최소 공개 기준을 ${v}명으로 변경했어요`, tone: "info" });
            }}
            options={[5, 10, 20].map((v) => ({ value: v, label: `${v}명` }))}
          />
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle
          title="부서별 비교"
          sub={`${meta.label} · 점선 = 전사 평균 ${avg.toFixed(0)}%`}
          action={
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as Col)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-semibold"
            >
              {COLS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          }
        />
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" {...axisProps} interval={0} tick={{ fill: "#64748B", fontSize: 11 }} />
              <YAxis {...axisProps} domain={[0, metric === "drop" ? 30 : 100]} />
              <Tooltip cursor={{ fill: "#F8FAFC" }} content={<ChartTip unit={metric === "wellness" ? "점" : "%"} />} />
              <ReferenceLine y={avg} stroke="#94A3B8" strokeDasharray="4 4" />
              <Bar dataKey="value" name={meta.label} radius={[4, 4, 0, 0]} maxBarSize={44}>
                {chart.map((d) => <Cell key={d.name} fill={dept === "전체" || dept === d.name ? SERIES.a : "#C7D7FB"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5">
          <SectionTitle title="부서별 상세 지표" sub="열 제목을 눌러 정렬 · 행을 눌러 부서 강조 · 초록/빨강은 전사 평균 대비 ±3%p 이상" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[13.5px]">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[12px] text-slate-500">
                <th className="px-5 py-2.5 font-semibold">부서</th>
                {([{ key: "headcount", label: "인원" }, ...COLS] as { key: Col | "headcount"; label: string }[]).map((c) => (
                  <th key={c.key} className="px-3 py-2.5 text-right font-semibold">
                    <button
                      className={cn("inline-flex items-center gap-1", sort.key === c.key && "text-ink")}
                      onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? ((s.dir * -1) as 1 | -1) : -1 }))}
                    >
                      {c.label}
                      <ArrowDownUp className="h-3 w-3" />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr
                  key={d.name}
                  onClick={() => setDept(dept === d.name ? "전체" : d.name)}
                  className={cn("cursor-pointer border-b border-slate-50 tabular hover:bg-slate-50", dept === d.name && "bg-brand-50/60")}
                >
                  <td className="px-5 py-3 font-semibold">{d.name}</td>
                  <td className="px-3 py-3 text-right text-slate-500">{d.headcount}명</td>
                  {COLS.map((c) => (
                    <td key={c.key} className={cn("px-3 py-3 text-right font-semibold", cellTone(d, c.key))}>
                      {d[c.key]}{c.key === "wellness" ? "" : "%"}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-slate-50/60 font-semibold tabular text-slate-600">
                <td className="px-5 py-3">전사 평균</td>
                <td className="px-3 py-3 text-right">{COMPANY.employees.toLocaleString()}명</td>
                {COLS.map((c) => <td key={c.key} className="px-3 py-3 text-right">{avgOf(c.key).toFixed(0)}{c.key === "wellness" ? "" : "%"}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle
          title="부서 × 연령대 교차 분석"
          sub={`${hidden}개 그룹이 최소 인원(${minGroup}명) 미만이라 비공개 처리되었습니다.`}
          action={
            <Segmented
              size="sm" value={cross} onChange={setCross}
              options={[{ value: "usage", label: "참여율" }, { value: "ret4", label: "4주 지속" }, { value: "reeng", label: "재참여율" }]}
            />
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead>
              <tr className="text-left text-[12px] text-slate-500">
                <th className="py-2 pr-3 font-semibold">부서</th>
                {AGE_BANDS.map((b) => <th key={b} className="px-1 py-2 text-center font-semibold">{b}</th>)}
              </tr>
            </thead>
            <tbody>
              {cells.map((row) => (
                <tr key={row.dept}>
                  <td className="py-1 pr-3 font-semibold">{row.dept}</td>
                  {row.cells.map((c) => {
                    const masked = c.n < minGroup;
                    const intensity = Math.max(0, Math.min(1, (c.value - (crossAvg - 15)) / 30));
                    return (
                      <td key={c.band} className="p-1">
                        <div
                          className={cn("flex h-14 flex-col items-center justify-center rounded-lg", masked ? "border border-dashed border-slate-200 bg-slate-50" : "")}
                          style={masked ? undefined : { background: `rgba(37, 99, 235, ${0.08 + intensity * 0.55})` }}
                        >
                          {masked ? (
                            <Masked n={c.n} min={minGroup} compact />
                          ) : (
                            <>
                              <span className={cn("text-[15px] font-bold tabular", intensity > 0.6 ? "text-white" : "text-ink")}>{c.value}%</span>
                              <span className={cn("text-[11px]", intensity > 0.6 ? "text-white/80" : "text-slate-500")}>{c.n}명</span>
                            </>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12px] text-slate-400">
          진할수록 높은 값 · 전사 평균 {crossAvg.toFixed(0)}% · 소규모 그룹은 개인 추정 위험이 있어 수치 대신 ‘비공개’로 표시합니다.
        </p>
      </Card>
    </div>
  );
}
