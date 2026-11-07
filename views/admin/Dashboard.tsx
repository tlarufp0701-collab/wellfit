"use client";

import { ArrowRight, Sparkles, TrendingUp, Undo2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/lib/store";
import { AppLink } from "@/lib/nav";
import { cn, num } from "@/lib/format";
import {
  COMPANY, DEPT_STATS, DEPTS, FUNNEL, KPI_META, KPI_ORDER, MONTHLY, PERIOD_COMPARE, RECOVERY, monthLabels, type DeptName,
} from "@/lib/data/company";
import { detectAnomalies, kpisFor } from "@/lib/ai/insights";
import { useAdminFilters } from "@/components/admin-shell";
import { Badge, Card, Chip, Delta, InfoTip, SectionTitle } from "@/components/ui";
import { axisProps, ChartTip, gridProps, Legend, SERIES } from "@/components/charts";

const MONTHS_BY_PERIOD = { month: 6, quarter: 9, half: 12, year: 12 } as const;

export default function AdminDashboard() {
  const { today } = useStore();
  const { period, dept, setDept } = useAdminFilters();
  const k = kpisFor(period, dept);
  const insights = detectAnomalies().slice(0, 3);

  const n = MONTHS_BY_PERIOD[period];
  const labels = monthLabels(today).slice(-n);
  const shift = dept === "전체" ? { ret4: 0, ret12: 0 } : (() => {
    const d = DEPT_STATS.find((x) => x.name === dept)!;
    return { ret4: d.ret4 - 58, ret12: d.ret12 - 48 };
  })();
  const trend = labels.map((m, i) => ({
    m,
    ret4: MONTHLY.ret4.slice(-n)[i] + shift.ret4,
    ret12: MONTHLY.ret12.slice(-n)[i] + shift.ret12,
  }));

  const deptBars = DEPT_STATS.map((d) => ({ name: d.name, value: d.usage, n: d.headcount }));
  const companyUsage = Math.round(DEPT_STATS.reduce((s, d) => s + d.usage * d.headcount, 0) / COMPANY.employees);

  const funnel = (() => {
    if (dept === "전체") return FUNNEL;
    const d = DEPT_STATS.find((x) => x.name === dept)!;
    const target = Math.round(d.headcount * 0.95);
    const start = Math.round(target * (d.start / 100));
    return [
      { stage: "전체 대상", value: target },
      { stage: "복지 신청", value: Math.round(target * (d.usage / 100)) },
      { stage: "운동 시작", value: start },
      { stage: "4주 지속", value: Math.round(start * (d.ret4 / 100)) },
      { stage: "12주 지속", value: Math.round(start * (d.ret12 / 100)) },
    ];
  })();
  const recovery = dept === "전체" ? RECOVERY : (() => {
    const dropped = funnel[2].value - funnel[3].value;
    const d = DEPT_STATS.find((x) => x.name === dept)!;
    return { dropped, reengaged: Math.round(dropped * (d.reeng / 100)) };
  })();

  const usageDiff = k.current.usage - k.previous.usage;

  return (
    <div className="space-y-6">
      {/* 10초 요약 */}
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <div className="text-[12.5px] font-semibold text-slate-500">{dept === "전체" ? "전사" : dept} 요약 · {PERIOD_COMPARE[period]}</div>
          <p className="mt-0.5 text-[16px] font-semibold leading-snug sm:text-[17px]">
            복지는 <span className="text-emerald-600">잘 사용되고 있습니다.</span> 이용률 {k.current.usage}%({usageDiff >= 0 ? "+" : ""}{usageDiff}%p), 12주 지속률 {k.current.ret12}%.{" "}
            {dept === "전체" || dept === "개발" ? <span className="text-orange-600">단, 개발팀 4주 지속률 하락에 주의가 필요합니다.</span> : null}
          </p>
        </div>
        <AppLink href="/admin/ai-insights" className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-ai-50 px-3.5 py-2 text-[13px] font-semibold text-ai-700 hover:bg-ai-100">
          <Sparkles className="h-4 w-4" /> AI 인사이트 5건
        </AppLink>
      </Card>

      {/* 부서 필터 */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {(["전체", ...DEPTS] as (DeptName | "전체")[]).map((d) => (
          <Chip key={d} active={dept === d} onClick={() => setDept(d)}>{d === "전체" ? "전사" : d}</Chip>
        ))}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {KPI_ORDER.map((key) => {
          const meta = KPI_META[key];
          const diff = k.current[key] - k.previous[key];
          return (
            <Card key={key} className="p-4">
              <div className="flex items-center gap-1 text-[12.5px] font-medium text-slate-500">
                {meta.label}
                <InfoTip text={meta.desc} />
              </div>
              <div className="mt-1.5 text-[26px] font-bold tracking-tight tabular">{k.current[key]}%</div>
              <div className="mt-0.5 flex items-center gap-1">
                <Delta value={diff} higherIsBetter={meta.higherIsBetter} />
                <span className="text-[11px] text-slate-400">{PERIOD_COMPARE[period].replace(" 대비", "")}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="부서별 참여율" sub={`복지 이용률 · 점선 = 전사 평균 ${companyUsage}%`} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptBars} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="name" {...axisProps} interval={0} tick={{ fill: "#64748B", fontSize: 11 }} />
                <YAxis {...axisProps} domain={[0, 100]} unit="%" />
                <Tooltip cursor={{ fill: "#F8FAFC" }} content={<ChartTip unit="%" />} />
                <ReferenceLine y={companyUsage} stroke="#94A3B8" strokeDasharray="4 4" />
                <Bar dataKey="value" name="참여율" radius={[4, 4, 0, 0]} maxBarSize={40} onClick={(d) => setDept((d as unknown as { name: DeptName }).name)} className="cursor-pointer">
                  {deptBars.map((d) => (
                    <Cell key={d.name} fill={dept === "전체" || dept === d.name ? SERIES.a : "#C7D7FB"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle title="월별 지속률" sub={`최근 ${n}개월 · ${dept === "전체" ? "전사" : dept}`} action={<Legend items={[{ label: "4주", color: SERIES.a }, { label: "12주", color: SERIES.b }]} />} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="m" {...axisProps} />
                <YAxis {...axisProps} domain={[20, 80]} unit="%" />
                <Tooltip content={<ChartTip unit="%" />} />
                <Line dataKey="ret4" name="4주 지속률" stroke={SERIES.a} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                <Line dataKey="ret12" name="12주 지속률" stroke={SERIES.b} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <SectionTitle title="참여 Journey Funnel" sub="대상자 → 신청 → 시작 → 지속 단계별 전환" />
          <div className="space-y-2.5">
            {funnel.map((f, i) => {
              const pctOfTotal = (f.value / funnel[0].value) * 100;
              const conv = i > 0 ? (f.value / funnel[i - 1].value) * 100 : 100;
              return (
                <div key={f.stage} className="grid grid-cols-[84px_1fr_auto] items-center gap-3">
                  <span className="text-[13px] font-semibold">{f.stage}</span>
                  <div className="relative h-9 overflow-hidden rounded-lg bg-slate-50">
                    <div className={cn("flex h-full items-center rounded-lg px-3 text-[13px] font-bold text-white transition-all", i < 3 ? "bg-brand-600" : "bg-teal-600")} style={{ width: `${Math.max(pctOfTotal, 12)}%` }}>
                      {num(f.value)}
                    </div>
                  </div>
                  <span className="w-24 text-right text-[12px] tabular text-slate-500">
                    {i === 0 ? "100%" : <>대상 대비 <b className="text-ink">{Math.round(pctOfTotal)}%</b><br />전단계 {Math.round(conv)}%</>}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="flex flex-col p-5">
          <SectionTitle title="재참여" sub="중단 후 다시 돌아온 임직원" />
          <div className="flex flex-1 flex-col justify-center gap-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <span className="text-[13.5px] text-slate-600">중단 (10일+ 미활동)</span>
              <b className="text-[20px] tabular">{num(recovery.dropped)}명</b>
            </div>
            <div className="flex justify-center"><Undo2 className="h-5 w-5 -scale-x-100 text-ai-500" /></div>
            <div className="flex items-center justify-between rounded-xl bg-ai-50 p-4">
              <span className="text-[13.5px] text-ai-700">재참여</span>
              <b className="text-[20px] tabular text-ai-700">{num(recovery.reengaged)}명 · {Math.round((recovery.reengaged / recovery.dropped) * 100)}%</b>
            </div>
            <p className="text-[12px] leading-relaxed text-slate-500">재시작 +300P 리워드와 AI 대안 제안(시간대·운동 변경)이 재참여의 62%에 관여했습니다.</p>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle
          title={<span className="flex items-center gap-2"><Sparkles className="h-[18px] w-[18px] text-ai-600" /> AI가 찾은 주요 패턴</span>}
          action={<AppLink href="/admin/ai-insights" className="flex items-center gap-1 text-[13px] font-semibold text-ai-700">전체 보기 <ArrowRight className="h-4 w-4" /></AppLink>}
        />
        <div className="grid gap-3 md:grid-cols-3">
          {insights.map((i) => (
            <div key={i.id} className="rounded-xl border border-slate-200 p-4">
              <Badge tone={i.severity === "high" ? "red" : i.severity === "medium" ? "orange" : "green"}>
                {i.severity === "high" ? "주의" : i.severity === "medium" ? "관찰" : "긍정"} · {i.category}
              </Badge>
              <p className="mt-2 text-[14px] font-semibold leading-snug">{i.title}</p>
              <p className="mt-1 text-[12px] text-slate-500">{i.scope}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
