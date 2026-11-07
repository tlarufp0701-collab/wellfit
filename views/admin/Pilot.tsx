"use client";

import { useState, type ReactNode } from "react";
import { CheckCircle2, Circle, ClipboardCheck, FlaskConical, Pencil, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/lib/store";
import { cn, fmtDate } from "@/lib/format";
import { PILOT } from "@/lib/data/company";
import { Badge, Button, Card, Chip, Progress, SectionTitle, Segmented, useToast } from "@/components/ui";
import { axisProps, ChartTip, gridProps, SERIES } from "@/components/charts";

const USE_OPTIONS = ["매우 그렇다", "그렇다", "보통", "아니다"];
const METRIC_OPTIONS = ["4주·12주 지속률", "중단 위험 예측", "재참여율", "프리젠티즘", "추정 ROI", "부서별 익명 분석", "시설별 효율", "AI 액션 추천"];
const CONTINUE_OPTIONS = ["정식 도입", "파일럿 확대", "추가 검토", "도입 안 함"];
const PRICE_OPTIONS = ["1인 월 3천원", "1인 월 5천원", "1인 월 8천원", "성과 연동형"];

export default function Pilot() {
  const s = useStore();
  const toast = useToast();
  const weeks = s.pilotWeeks;
  const cols = weeks === 8 ? ["Baseline", "Week 4", "Week 8"] : ["Baseline", "Week 4", "Week 8", "Week 12"];
  const [metricKey, setMetricKey] = useState("ret4");
  const [editing, setEditing] = useState(false);
  const fb = s.pilotFeedback;
  const submitted = !!fb.submittedAt && !editing;
  const metric = PILOT.metrics.find((m) => m.key === metricKey)!;
  const chart = cols.map((c, i) => ({ c, v: metric.values[i] }));
  const elapsed = Math.min(weeks, PILOT.startedWeeksAgo);
  const active = PILOT.weeklyActive.slice(0, weeks).map((v, i) => ({ w: `W${i + 1}`, v: i < elapsed ? v : 0 }));

  const criteria = [
    { label: "4주 지속률 +20%p 이상", ok: PILOT.metrics[1].values[2] - PILOT.metrics[1].values[0] >= 20 },
    { label: "중단률 절반 이하", ok: PILOT.metrics[2].values[2] <= PILOT.metrics[2].values[0] / 2 },
    { label: "업무활력 +5점 이상", ok: PILOT.metrics[5].values[2] - PILOT.metrics[5].values[0] >= 5 },
    { label: "HR 담당자 활용 의향 ‘그렇다’ 이상", ok: fb.use === "매우 그렇다" || fb.use === "그렇다" },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50"><FlaskConical className="h-6 w-6 text-brand-600" /></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[20px] font-bold">{weeks}주 파일럿</span>
                <Badge tone={elapsed >= weeks ? "green" : "blue"}>{elapsed >= weeks ? "완료" : `진행 중 · W${elapsed}`}</Badge>
              </div>
              <div className="mt-0.5 text-[13px] text-slate-500">{PILOT.depts}</div>
            </div>
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-6 lg:justify-end">
            <div>
              <div className="flex items-center gap-1 text-[12.5px] text-slate-500"><Users className="h-3.5 w-3.5" /> 파일럿 참가 임직원</div>
              <div className="text-[24px] font-bold tabular">{PILOT.participants}명</div>
            </div>
            <div className="w-44">
              <div className="mb-1 flex justify-between text-[12.5px] text-slate-500"><span>진행률</span><span className="tabular">{elapsed}/{weeks}주</span></div>
              <Progress value={(elapsed / weeks) * 100} />
            </div>
            <Segmented value={weeks} onChange={(v) => s.setPilotWeeks(v)} options={[{ value: 8 as const, label: "8주" }, { value: 12 as const, label: "12주" }]} />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5">
          <SectionTitle title="시작 전 vs 파일럿 중 비교" sub="같은 80명의 Baseline(시작 전 설문·기존 복지 이용 데이터) 대비 변화 · 행을 누르면 차트로 봅니다" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13.5px]">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-[12px] text-slate-500">
                <th className="px-5 py-2.5 text-left font-semibold">지표</th>
                {cols.map((c) => <th key={c} className="px-3 py-2.5 text-right font-semibold">{c}</th>)}
                <th className="px-5 py-2.5 text-right font-semibold">변화</th>
              </tr>
            </thead>
            <tbody>
              {PILOT.metrics.map((m) => {
                const last = m.values[cols.length - 1];
                const diff = last - m.values[0];
                const good = diff === 0 ? null : (diff > 0) === m.higherIsBetter;
                const isPct = m.unit === "%";
                return (
                  <tr key={m.key} onClick={() => setMetricKey(m.key)} className={cn("cursor-pointer border-b border-slate-50 tabular hover:bg-slate-50", metricKey === m.key && "bg-brand-50/50")}>
                    <td className="px-5 py-3 font-semibold">{m.label}</td>
                    {cols.map((c, i) => (
                      <td key={c} className={cn("px-3 py-3 text-right", i === cols.length - 1 ? "font-bold" : i === 0 ? "text-slate-400" : "")}>
                        {m.values[i]}{isPct ? "%" : m.unit === "/5" ? "" : ""}
                      </td>
                    ))}
                    <td className={cn("px-5 py-3 text-right font-bold", good === null ? "text-slate-500" : good ? "text-emerald-600" : "text-red-600")}>
                      {diff > 0 ? "+" : ""}{Number.isInteger(diff) ? diff : diff.toFixed(1)}{isPct ? "%p" : m.unit === "점" ? "점" : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title={metric.label} sub="Baseline 대비 추이" />
          <div className="no-scrollbar -mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1">
            {PILOT.metrics.map((m) => <Chip key={m.key} active={m.key === metricKey} onClick={() => setMetricKey(m.key)} className="py-1 text-[12px]">{m.label.replace("(자기평가)", "")}</Chip>)}
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="c" {...axisProps} />
                <YAxis {...axisProps} domain={["auto", "auto"]} />
                <Tooltip content={<ChartTip unit={metric.unit === "%" ? "%" : metric.unit === "점" ? "점" : ""} />} />
                <Line dataKey="v" name={metric.label} stroke={SERIES.a} strokeWidth={2} dot={{ r: 5, fill: SERIES.a, strokeWidth: 2, stroke: "#fff" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle title="주간 활동 참가자" sub={`${PILOT.participants}명 중 해당 주 1회 이상 운동`} />
          <div className="h-[268px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={active} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="w" {...axisProps} />
                <YAxis {...axisProps} domain={[0, 80]} />
                <Tooltip cursor={{ fill: "#F8FAFC" }} content={<ChartTip unit="명" />} />
                <Bar dataKey="v" name="활동 인원" fill={SERIES.a} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card className="p-5">
          <SectionTitle title="파일럿 성공 기준" sub="계약 시 합의한 검증 항목" />
          <div className="space-y-3">
            {criteria.map((c) => (
              <div key={c.label} className="flex items-center gap-2.5 text-[14px]">
                {c.ok ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-slate-300" />}
                <span className={c.ok ? "font-semibold" : "text-slate-500"}>{c.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-[13px] text-slate-600">
            {criteria.filter((c) => c.ok).length}/{criteria.length}개 기준 충족
            {criteria.every((c) => c.ok) && <b className="mt-1 block text-emerald-700">정식 도입 제안 조건을 충족했습니다.</b>}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle
            title={<span className="flex items-center gap-2"><ClipboardCheck className="h-[18px] w-[18px] text-brand-600" /> HR 담당자 피드백</span>}
            sub="파일럿 검증 설문 · 응답은 저장되어 다음 미팅에 활용됩니다"
            action={submitted ? <Button variant="ghost" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditing(true)}>수정</Button> : null}
          />
          {submitted ? (
            <div className="space-y-3 text-[14px]">
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700"><b>제출 완료</b> · {fmtDate(fb.submittedAt!.slice(0, 10), "ymd")}</div>
              <Answer q="다음 분기 복지 의사결정에 활용 의향" a={fb.use} />
              <Answer q="가장 가치 있는 지표" a={fb.metrics.join(", ")} />
              <Answer q="파일럿 이후 계획" a={fb.continueIntent} />
              <Answer q="적정 가격" a={fb.priceFit} />
              {fb.comment && <Answer q="의견" a={fb.comment} />}
            </div>
          ) : (
            <div className="space-y-5">
              <Question n={1} q="이 데이터를 다음 분기 복지 의사결정에 활용하시겠습니까?">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {USE_OPTIONS.map((o) => <Chip key={o} active={fb.use === o} onClick={() => s.setPilotFeedback({ use: o })}>{o}</Chip>)}
                </div>
              </Question>
              <Question n={2} q="기업에서 가장 가치 있는 지표는 무엇입니까? (복수 선택)">
                <div className="flex flex-wrap gap-2">
                  {METRIC_OPTIONS.map((o) => (
                    <Chip key={o} active={fb.metrics.includes(o)} onClick={() => s.setPilotFeedback({ metrics: fb.metrics.includes(o) ? fb.metrics.filter((x) => x !== o) : [...fb.metrics, o] })}>{o}</Chip>
                  ))}
                </div>
              </Question>
              <Question n={3} q="파일럿 종료 후 계획은?">
                <div className="flex flex-wrap gap-2">
                  {CONTINUE_OPTIONS.map((o) => <Chip key={o} active={fb.continueIntent === o} onClick={() => s.setPilotFeedback({ continueIntent: o })}>{o}</Chip>)}
                </div>
              </Question>
              <Question n={4} q="적정하다고 생각하는 가격은?">
                <div className="flex flex-wrap gap-2">
                  {PRICE_OPTIONS.map((o) => <Chip key={o} active={fb.priceFit === o} onClick={() => s.setPilotFeedback({ priceFit: o })}>{o}</Chip>)}
                </div>
              </Question>
              <Question n={5} q="추가로 필요한 기능이나 의견">
                <textarea
                  value={fb.comment}
                  onChange={(e) => s.setPilotFeedback({ comment: e.target.value })}
                  rows={3}
                  placeholder="예: 부서장용 요약 리포트가 있으면 좋겠습니다."
                  className="w-full rounded-xl border border-slate-200 p-3 text-[14px] outline-none focus:border-brand-500"
                />
              </Question>
              <Button
                size="lg"
                className="w-full"
                disabled={!fb.use || fb.metrics.length === 0}
                onClick={() => {
                  s.setPilotFeedback({ submittedAt: new Date().toISOString().slice(0, 10) });
                  setEditing(false);
                  toast({ title: "피드백이 제출되었어요", desc: "감사합니다. 검증 리포트에 반영됩니다." });
                }}
              >
                피드백 제출
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Question({ n, q, children }: { n: number; q: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[14px] font-semibold"><span className="mr-1.5 text-brand-600">Q{n}.</span>{q}</div>
      {children}
    </div>
  );
}

function Answer({ q, a }: { q: string; a?: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 pb-2.5 sm:flex-row sm:gap-4">
      <span className="w-48 shrink-0 text-[13px] text-slate-500">{q}</span>
      <span className="font-semibold">{a || "—"}</span>
    </div>
  );
}
