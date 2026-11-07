"use client";

import { Calculator, Info, RotateCcw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/lib/store";
import { cn, num, won } from "@/lib/format";
import { MONTHLY, PRESENTEEISM, monthLabels } from "@/lib/data/company";
import { computeRoi, DEFAULT_ROI, type RoiInputs } from "@/lib/ai/insights";
import { Badge, Button, Card, Delta, InfoTip, RangeInput, SectionTitle } from "@/components/ui";
import { axisProps, ChartTip, gridProps, Legend, SERIES } from "@/components/charts";

const SLIDERS: { key: keyof RoiInputs; label: string; min: number; max: number; step: number; fmt: (v: number) => string }[] = [
  { key: "dailyWage", label: "일평균 인건비", min: 150_000, max: 400_000, step: 10_000, fmt: (v) => `${num(v / 10000)}만원` },
  { key: "sickDaysReduced", label: "1인당 월 병가 감소", min: 0, max: 0.15, step: 0.01, fmt: (v) => `${v.toFixed(2)}일` },
  { key: "presenteeismImproved", label: "프리젠티즘 개선 인원", min: 0, max: 150, step: 2, fmt: (v) => `${v}명` },
  { key: "productivityRecovery", label: "생산성 회복률", min: 0, max: 10, step: 0.5, fmt: (v) => `${v}%` },
  { key: "turnoverAvoided", label: "분기 이직 감소 추정", min: 0, max: 5, step: 0.5, fmt: (v) => `${v}명` },
  { key: "attribution", label: "이직 감소 기여 가중치", min: 0, max: 100, step: 5, fmt: (v) => `${v}%` },
  { key: "unusedReduction", label: "복지 미사용 감소", min: 0, max: 20, step: 1, fmt: (v) => `${v}%p` },
];

export default function WellnessReport() {
  const s = useStore();
  const r = computeRoi(s.roi);
  const months = monthLabels(s.today);
  const trend = months.map((m, i) => ({ m, vitality: MONTHLY.vitality[i], pres: MONTHLY.presenteeism[i] }));
  const bar = [
    ...r.costs.map((c) => ({ name: c.label, value: Math.round(c.value / 10000), kind: "cost" })),
    ...r.benefits.map((b) => ({ name: b.label, value: Math.round(b.value / 10000), kind: "benefit" })),
  ];
  const changed = JSON.stringify(s.roi) !== JSON.stringify(DEFAULT_ROI);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-5">
          <div className="text-[13px] font-semibold text-slate-500">총 복지 비용 (분기)</div>
          <div className="mt-1.5 text-[30px] font-bold tracking-tight tabular">{won(r.totalCost)}</div>
          <div className="mt-1 text-[12.5px] text-slate-500">복지지원금 · 플랫폼 · 제휴비용</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-1 text-[13px] font-semibold text-slate-500">
            예상 절감 효과 <InfoTip text="내부 전후 데이터와 회사 설정값을 바탕으로 계산된 추정치입니다." />
          </div>
          <div className="mt-1.5 text-[30px] font-bold tracking-tight tabular">{won(r.totalBenefit)}</div>
          <div className="mt-1 text-[12.5px] text-slate-500">병가 · 프리젠티즘 · 이직 · 미사용 감소</div>
        </Card>
        <Card className={cn("p-5", r.roi >= 0 ? "border-emerald-200 bg-emerald-50/40" : "border-red-200 bg-red-50/40")}>
          <div className="flex items-center gap-1 text-[13px] font-semibold text-slate-500">
            추정 ROI <InfoTip text="내부 전후 데이터와 회사 설정값을 바탕으로 계산된 추정치입니다. 확정된 실제 수익이 아닙니다." />
          </div>
          <div className={cn("mt-1.5 text-[30px] font-bold tracking-tight tabular", r.roi >= 0 ? "text-emerald-700" : "text-red-600")}>
            {r.roi >= 0 ? "+" : ""}{r.roi.toFixed(0)}%
          </div>
          <div className="mt-1 text-[12.5px] text-slate-500">(추정 편익 − 총 비용) ÷ 총 비용 × 100</div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-5">
          <SectionTitle title="투입 vs 성과 추정" sub="단위: 만원 · 분기" action={<Legend items={[{ label: "투입 비용", color: "#94A3B8" }, { label: "추정 편익", color: SERIES.a }]} />} />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bar} layout="vertical" margin={{ top: 0, right: 24, left: 20, bottom: 0 }}>
                <CartesianGrid {...gridProps} horizontal={false} vertical />
                <XAxis type="number" {...axisProps} />
                <YAxis type="category" dataKey="name" {...axisProps} width={100} />
                <Tooltip cursor={{ fill: "#F8FAFC" }} content={<ChartTip format={(v) => `${num(v)}만원`} />} />
                <Bar dataKey="value" name="금액" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {bar.map((b) => <Cell key={b.name} fill={b.kind === "cost" ? "#94A3B8" : SERIES.a} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle title="계산 근거" sub="모든 값은 추정치입니다" />
          <div className="space-y-2.5 text-[13px]">
            {r.costs.map((c) => (
              <div key={c.label} className="flex justify-between"><span className="text-slate-500">{c.label}</span><b className="tabular">{won(c.value)}</b></div>
            ))}
            <div className="flex justify-between border-t border-slate-100 pt-2.5 font-semibold"><span>총 비용</span><span className="tabular">{won(r.totalCost)}</span></div>
            <div className="pt-2" />
            {r.benefits.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between"><span className="text-slate-500">{b.label}</span><b className="tabular">{won(b.value)}</b></div>
                <div className="text-[11.5px] text-slate-400">{b.formula}</div>
              </div>
            ))}
            <div className="flex justify-between border-t border-slate-100 pt-2.5 font-semibold"><span>추정 편익</span><span className="tabular">{won(r.totalBenefit)}</span></div>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[12px] leading-relaxed text-slate-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ROI는 확정적 수익이 아닌 추정치입니다. 회사 설정값을 바꾸면 즉시 다시 계산됩니다.
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle
          title={<span className="flex items-center gap-2"><Calculator className="h-[18px] w-[18px] text-brand-600" /> 회사 설정값</span>}
          sub="재무·인사팀 기준값을 입력하세요"
          action={changed ? <Button variant="ghost" size="sm" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => s.setRoi(DEFAULT_ROI)}>기본값</Button> : null}
        />
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          {SLIDERS.map((sl) => (
            <div key={sl.key}>
              <div className="mb-2 flex justify-between text-[13px]">
                <span className="font-semibold">{sl.label}</span>
                <span className="font-semibold tabular text-brand-700">{sl.fmt(s.roi[sl.key])}</span>
              </div>
              <RangeInput value={s.roi[sl.key]} min={sl.min} max={sl.max} step={sl.step} onChange={(v) => s.setRoi({ [sl.key]: v })} />
            </div>
          ))}
        </div>
      </Card>

      <SectionTitle title="복지 효과 지표" sub="익명 설문 · 근태 데이터 기반" />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="grid grid-cols-2 gap-3">
          <Card className="col-span-2 p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-500">프리젠티즘 위험군</span>
              <Badge tone="green">개선</Badge>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[34px] font-bold tabular">{PRESENTEEISM.risk}%</span>
              <Delta value={PRESENTEEISM.risk - PRESENTEEISM.prevRisk} higherIsBetter={false} />
            </div>
          </Card>
          {PRESENTEEISM.indicators.slice(0, 4).map((i) => (
            <Card key={i.key} className="p-4">
              <div className="text-[12.5px] text-slate-500">{i.label}</div>
              <div className="mt-0.5 text-[20px] font-bold tabular">{i.value}<span className="ml-0.5 text-[12px] text-slate-400">{i.unit}</span></div>
              <Delta value={+(i.value - i.prev).toFixed(1)} digits={i.unit === "점" ? 0 : 1} suffix="" higherIsBetter={i.higherIsBetter} />
            </Card>
          ))}
        </div>
        <Card className="p-5">
          <SectionTitle title="업무활력 · 프리젠티즘 추이" sub="최근 12개월 · 서로 다른 지표는 별도 차트로 표시" />
          <div className="grid grid-rows-2 gap-2">
            <div>
              <div className="text-[12px] font-semibold text-slate-500">업무활력 (점)</div>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 6, right: 8, left: -28, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="m" hide />
                    <YAxis {...axisProps} domain={[50, 75]} tick={{ fill: "#94A3B8", fontSize: 10 }} />
                    <Tooltip content={<ChartTip unit="점" />} />
                    <Line dataKey="vitality" name="업무활력" stroke={SERIES.a} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-slate-500">프리젠티즘 위험군 (%)</div>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 6, right: 8, left: -28, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="m" {...axisProps} tick={{ fill: "#94A3B8", fontSize: 10 }} />
                    <YAxis {...axisProps} domain={[10, 30]} tick={{ fill: "#94A3B8", fontSize: 10 }} />
                    <Tooltip content={<ChartTip unit="%" />} />
                    <Line dataKey="pres" name="위험군" stroke={SERIES.b} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
