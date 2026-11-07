"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Eye, Lightbulb, Sparkles, TrendingDown, TrendingUp, Users } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { useStore, type ActionStatus } from "@/lib/store";
import { cn } from "@/lib/format";
import { DROPOUT_RISK_TOTAL, MONTHLY, PRESENTEEISM, RISK_GROUPS, TEAMS, monthLabels } from "@/lib/data/company";
import { actionRecommendations, correlation, detectAnomalies, type Insight } from "@/lib/ai/insights";
import { AiTag, Badge, Card, Delta, InfoTip, SectionTitle, useToast, type Tone } from "@/components/ui";
import { axisProps, gridProps, SERIES } from "@/components/charts";

const SEV: Record<Insight["severity"], { tone: Tone; label: string; icon: typeof AlertTriangle }> = {
  high: { tone: "red", label: "주의", icon: AlertTriangle },
  medium: { tone: "orange", label: "관찰", icon: Eye },
  positive: { tone: "green", label: "기회", icon: CheckCircle2 },
};
const STATUSES: ActionStatus[] = ["제안", "검토 중", "실행 예정", "보류"];

export default function AiInsights() {
  const s = useStore();
  const toast = useToast();
  const insights = detectAnomalies();
  const corr = correlation();
  const actions = actionRecommendations();
  const [open, setOpen] = useState<string | null>(insights[0]?.id ?? null);
  const months = monthLabels(s.today);
  const presTrend = months.map((m, i) => ({ m, risk: MONTHLY.presenteeism[i], sick: MONTHLY.sickLeave[i] }));
  const xs = [45, 95];
  const fitLine = xs.map((x) => ({ x, y: corr.fit.intercept + corr.fit.slope * x }));

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-ai-100">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-ai-50 to-white p-6 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ai-600 text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-ai-700">이번 분기 AI 분석 결과</div>
            <p className="mt-0.5 text-[18px] font-bold leading-snug">
              활동·출석·설문 데이터 24,816건에서 담당자가 확인해야 할 패턴 {insights.filter((i) => i.severity !== "positive").length}건과 기회 {insights.filter((i) => i.severity === "positive").length}건을 찾았습니다.
            </p>
            <p className="mt-1 text-[12.5px] text-slate-500">분석 단위: 6개 부서 · {TEAMS.length}개 팀 · 4개 연령대 · 익명 설문 {PRESENTEEISM.surveyN}명 — 개인 단위 데이터는 사용하지 않습니다.</p>
          </div>
        </div>
      </Card>

      {/* A */}
      <section>
        <SectionTitle title="A. 이상 패턴 탐지" sub="전분기·전사 평균 대비 의미 있는 변화를 자동으로 찾습니다" />
        <div className="space-y-2.5">
          {insights.map((i) => {
            const sev = SEV[i.severity];
            const Icon = sev.icon;
            const isOpen = open === i.id;
            return (
              <Card key={i.id} className="overflow-hidden">
                <button className="flex w-full items-start gap-4 p-5 text-left" onClick={() => setOpen(isOpen ? null : i.id)}>
                  <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", sev.tone === "red" ? "bg-red-50 text-red-600" : sev.tone === "orange" ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600")}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={sev.tone}>{sev.label}</Badge>
                      <Badge tone="gray">{i.category}</Badge>
                      <span className="text-[12px] text-slate-400">{i.scope}</span>
                    </div>
                    <p className="mt-1.5 text-[15.5px] font-semibold leading-snug">“{i.title}”</p>
                  </div>
                  <ChevronDown className={cn("mt-1 h-5 w-5 shrink-0 text-slate-400 transition", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:pl-[72px]">
                    <p className="text-[13.5px] text-slate-700">{i.detail}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {i.evidence.map((e) => <span key={e} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[12.5px] text-slate-600">{e}</span>)}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* B */}
      <section>
        <SectionTitle title="B. 중단 위험 그룹" sub="개별 직원이 아닌 익명 그룹 단위로만 제공됩니다" />
        <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
          <Card className="flex flex-col justify-between p-5">
            <div>
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-500"><Users className="h-4 w-4" /> 운동 중단 위험 그룹</div>
              <div className="mt-2 text-[40px] font-bold tracking-tight tabular">{DROPOUT_RISK_TOTAL.count}명</div>
              <div className="flex items-center gap-1.5">
                <Delta value={DROPOUT_RISK_TOTAL.count - DROPOUT_RISK_TOTAL.prev} suffix="명" higherIsBetter={false} />
                <span className="text-[12px] text-slate-400">전월 대비</span>
              </div>
            </div>
            <div className="mt-5 space-y-1.5 text-[13px]">
              <div className="font-semibold text-slate-500">주요 위험요인</div>
              {["최근 2주 운동빈도 감소", "수면 감소", "목표 실패 반복"].map((f) => (
                <div key={f} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />{f}</div>
              ))}
            </div>
            <div className="mt-4"><AiTag label="행동 패턴 기반 AI 추정" /></div>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2">
            {RISK_GROUPS.map((g) => (
              <Card key={g.id} className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-bold">{g.name}</span>
                  <Badge tone={g.tone}>{g.tone === "red" ? "높음" : "중간"}</Badge>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-[26px] font-bold tabular">{g.count}명</span>
                  <Delta value={g.count - g.prev} suffix="명" higherIsBetter={false} />
                </div>
                <ul className="mt-2 space-y-1 text-[12.5px] text-slate-600">
                  {g.factors.map((f) => <li key={f}>· {f}</li>)}
                </ul>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {g.depts.map((d) => <span key={d.dept} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11.5px] font-semibold text-slate-600">{d.dept} {d.share}%</span>)}
                </div>
                <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-ai-50 px-3 py-2 text-[12.5px] text-ai-700">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {g.action}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* C */}
      <section>
        <SectionTitle title="C. 상관관계 분석" sub="팀 단위(익명) 복지·운동 참여율과 업무활력 점수" />
        <Card className="grid gap-6 p-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 16, left: -8, bottom: 16 }}>
                <CartesianGrid {...gridProps} vertical />
                <XAxis type="number" dataKey="x" name="참여율" domain={[45, 95]} unit="%" {...axisProps} label={{ value: "복지·운동 참여율", position: "insideBottom", offset: -10, fill: "#64748B", fontSize: 12 }} />
                <YAxis type="number" dataKey="y" name="업무활력" domain={[45, 85]} {...axisProps} label={{ value: "업무활력", angle: -90, position: "insideLeft", offset: 20, fill: "#64748B", fontSize: 12 }} />
                <ZAxis range={[70, 70]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as { team?: string; x: number; y: number; n?: number };
                    if (!p.team) return null;
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] shadow-float">
                        <div className="font-semibold">{p.team} <span className="font-normal text-slate-400">· {p.n}명</span></div>
                        <div className="text-slate-600">참여율 {p.x}% · 업무활력 {p.y}점</div>
                      </div>
                    );
                  }}
                />
                <Scatter data={fitLine} line={{ stroke: "#94A3B8", strokeDasharray: "5 4", strokeWidth: 1.5 }} shape={() => <g />} legendType="none" isAnimationActive={false} />
                <Scatter data={TEAMS.map((t) => ({ x: t.participation, y: t.vitality, team: t.team, n: t.n }))} fill={SERIES.a} fillOpacity={0.85} stroke="#fff" strokeWidth={1.5} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[13px] font-semibold text-slate-500">피어슨 상관계수</div>
            <div className="mt-1 text-[44px] font-bold tracking-tight tabular">r = {corr.r.toFixed(2)}</div>
            <Badge tone="blue" className="w-fit">중간 이상의 양의 상관 · n = {corr.n}개 팀</Badge>
            <p className="mt-4 text-[14.5px] leading-relaxed">
              “복지 이용률이 높은 집단에서 업무활력 점수가 함께 높게 나타나는 경향이 관찰됩니다.” 참여율 75% 이상 팀의 평균 업무활력은 <b>{corr.highAvg.toFixed(0)}점</b>, 60% 미만 팀은 <b>{corr.lowAvg.toFixed(0)}점</b>입니다.
            </p>
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-3 text-[13px] text-orange-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              이는 상관관계이며 인과관계를 의미하지 않습니다. 업무량·직무 특성 등 다른 요인이 함께 작용할 수 있습니다.
            </div>
          </div>
        </Card>
      </section>

      {/* D */}
      <section>
        <SectionTitle title="D. 프리젠티즘" sub={`출근은 했지만 컨디션 저하로 업무 효율이 떨어진 상태 · 익명 설문 ${PRESENTEEISM.surveyN}명 기반`} />
        <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
          <Card className="p-5">
            <div className="flex items-center gap-1 text-[13px] font-semibold text-slate-500">
              프리젠티즘 위험군
              <InfoTip text="WHO-HPQ 기반 자기평가 문항에서 생산성 저하 응답이 기준 이상인 응답자 비율" />
            </div>
            <div className="mt-2 text-[40px] font-bold tracking-tight tabular">{PRESENTEEISM.risk}%</div>
            <div className="flex items-center gap-1.5">
              <Delta value={PRESENTEEISM.risk - PRESENTEEISM.prevRisk} higherIsBetter={false} />
              <span className="text-[12px] text-slate-400">전분기 대비</span>
            </div>
            <div className="mt-4 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={presTrend} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
                  <XAxis dataKey="m" hide />
                  <YAxis {...axisProps} domain={[10, 30]} tick={{ fill: "#94A3B8", fontSize: 10 }} />
                  <Tooltip formatter={(v) => [`${v}%`, "위험군"]} labelStyle={{ fontSize: 12 }} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Line dataKey="risk" stroke={SERIES.a} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-[11px] text-slate-400">최근 12개월 위험군 추이</div>
          </Card>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PRESENTEEISM.indicators.map((ind) => {
              const diff = ind.value - ind.prev;
              const digits = ind.key === "sickLeave" ? 2 : ind.unit === "점" ? 0 : 1;
              return (
                <Card key={ind.key} className="p-4">
                  <div className="text-[12.5px] font-medium text-slate-500">{ind.label}</div>
                  <div className="mt-1 text-[24px] font-bold tabular">
                    {ind.value}
                    <span className="ml-0.5 text-[12px] font-semibold text-slate-400">{ind.unit}</span>
                  </div>
                  <Delta value={+diff.toFixed(digits)} digits={digits} suffix="" higherIsBetter={ind.higherIsBetter} />
                  <span className="ml-1 text-[11px] text-slate-400">전분기</span>
                </Card>
              );
            })}
            <Card className="col-span-2 p-4 sm:col-span-3">
              <div className="mb-1 text-[12.5px] font-medium text-slate-500">병가 추이 (일/인·월)</div>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={presTrend} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="m" {...axisProps} tick={{ fill: "#94A3B8", fontSize: 10 }} />
                    <YAxis {...axisProps} domain={[0.3, 0.7]} tick={{ fill: "#94A3B8", fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`${v}일`, "병가"]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <ReferenceLine y={0.5} stroke="#E2E8F0" />
                    <Line dataKey="sick" stroke={SERIES.b} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* E */}
      <section>
        <SectionTitle title="E. AI 액션 추천" sub="문제를 보여주는 데서 멈추지 않고 다음 행동을 제안합니다 · 상태를 바꾸면 경영진 리포트에 반영됩니다" />
        <div className="grid gap-3 lg:grid-cols-2">
          {actions.map((a, idx) => {
            const status = s.actionStatus[a.id] ?? "제안";
            return (
              <Card key={a.id} className={cn("flex flex-col p-5", status === "실행 예정" && "border-brand-200 ring-1 ring-brand-100")}>
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-[13px] font-bold text-white">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="text-[16px] font-bold leading-snug">{a.title}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge tone={a.priority === "높음" ? "red" : a.priority === "중간" ? "orange" : "gray"}>우선순위 {a.priority}</Badge>
                      <Badge tone={a.impact === "높음" ? "green" : "blue"}>예상 개선 가능성 {a.impact}</Badge>
                      <Badge tone="gray">{a.owner}</Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex-1 rounded-xl bg-slate-50 p-3.5">
                  <div className="mb-1.5 flex items-center gap-1 text-[12px] font-bold text-ai-700"><Sparkles className="h-3.5 w-3.5" /> 왜 추천했나요?</div>
                  <ul className="space-y-1 text-[13px] text-slate-700">
                    {a.why.map((w) => <li key={w}>· {w}</li>)}
                  </ul>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[12.5px]">
                  <div className="flex items-start gap-1.5 text-slate-600"><TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />{a.expected}</div>
                  <div className="flex items-start gap-1.5 text-slate-600"><TrendingDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />{a.cost}</div>
                </div>
                <div className="mt-4 flex gap-1 rounded-xl bg-slate-100 p-1">
                  {STATUSES.map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        s.setActionStatus(a.id, st);
                        if (st !== status) toast({ title: `‘${a.title}’ → ${st}`, tone: "info" });
                      }}
                      className={cn("flex-1 rounded-lg py-1.5 text-[12.5px] font-semibold transition", status === st ? (st === "실행 예정" ? "bg-brand-600 text-white" : "bg-white text-ink shadow-sm") : "text-slate-500")}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
