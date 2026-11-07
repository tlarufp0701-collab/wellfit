"use client";

import { useState } from "react";
import {
  ArrowRight, Brain, Check, ChevronDown, Clock, Dumbbell, MapPin, Play, RefreshCw, Shuffle, Sparkles, Target, TrendingUp, AlertTriangle, Database,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn, josa } from "@/lib/format";
import { SLOT_LABEL } from "@/lib/data/employee";
import type { AdjustKey } from "@/lib/ai/coach";
import { AiTag, Badge, Button, Card, Progress, Ring, SectionTitle, useToast, type Tone } from "@/components/ui";
import { useStartWorkout } from "@/components/employee-shell";
import { CheckInSheet, PageHeader, WhyList } from "./shared";

const ALT_ICON: Record<AdjustKey, typeof Clock> = { slot: Clock, goal: Target, exercise: Dumbbell, facility: MapPin };

export default function AiCoach() {
  const s = useStore();
  const { analysis } = s;
  const { risk, recommendations } = analysis;
  const start = useStartWorkout();
  const toast = useToast();
  const [showAllInputs, setShowAllInputs] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);

  const rec = recommendations[s.recIndex % Math.min(4, recommendations.length)];
  const highAlt = recommendations.find((r) => r.intensity === "고강도");
  const todayLine =
    rec.intensity !== "고강도" && highAlt
      ? `오늘은 고강도 ${highAlt.type}보다 ${josa(rec.short, "을", "를")} 추천합니다.`
      : `오늘은 ${josa(rec.title, "을", "를")} 추천합니다.`;
  const riskTone: Tone = risk.level === "good" ? "green" : risk.level === "caution" ? "orange" : "red";
  const inputs = showAllInputs ? analysis.inputs : analysis.inputs.slice(0, 6);
  const now = new Date();

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="AI WELLNESS COACH" title="AI 웰니스 코치" sub="나의 신체·생활·행동 데이터 14가지를 종합해 오늘 할 운동을 정합니다." />

      {/* 분석 구조 */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[15px] font-bold">
            <Database className="h-[18px] w-[18px] text-ai-600" /> AI가 분석한 데이터
          </div>
          <span className="text-[12px] text-slate-400">
            {now.getHours()}:{String(now.getMinutes()).padStart(2, "0")} 업데이트
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 whitespace-nowrap text-[11.5px] font-semibold text-slate-500">
          <span className="rounded-lg bg-slate-100 px-2 py-1">입력 14개</span>
          <ArrowRight className="h-3.5 w-3.5" />
          <span className="rounded-lg bg-ai-50 px-2 py-1 text-ai-700">행동 패턴 분석</span>
          <ArrowRight className="h-3.5 w-3.5" />
          <span className="rounded-lg bg-brand-50 px-2 py-1 text-brand-700">추천 · 예측 · 플랜</span>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {inputs.map((i) => (
            <div key={i.label} className="flex items-center gap-3 py-2.5 text-[13.5px]">
              <span className="w-20 shrink-0 text-slate-500">{i.label}</span>
              <span className="min-w-0 flex-1 truncate font-semibold">{i.value}</span>
              <span className="shrink-0 text-[11.5px] text-slate-400">{i.source}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => setShowAllInputs((v) => !v)} icon={<ChevronDown className={cn("h-4 w-4 transition", showAllInputs && "rotate-180")} />}>
            {showAllInputs ? "접기" : "14개 모두 보기"}
          </Button>
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => setCheckInOpen(true)} icon={<RefreshCw className="h-4 w-4" />}>
            오늘 체크인 수정
          </Button>
        </div>
      </Card>

      {/* 1. 오늘의 추천 */}
      <Card className="overflow-hidden border-ai-100">
        <div className="bg-gradient-to-b from-ai-50 to-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-bold text-ai-700">① 오늘의 추천</span>
            <AiTag />
          </div>
          <p className="mt-2 text-[19px] font-bold leading-snug">{todayLine}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone="purple">{SLOT_LABEL[rec.slot]}</Badge>
            <Badge tone="gray">{rec.minutes}분</Badge>
            <Badge tone={rec.intensity === "고강도" ? "orange" : "green"}>{rec.intensity}</Badge>
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <Button size="lg" icon={<Play className="h-4 w-4" />} onClick={() => start({ type: rec.type, slot: rec.slot, minutes: rec.minutes, facilityId: rec.facilityId, title: rec.title })}>
              지금 시작하기
            </Button>
            <Button size="lg" variant="outline" icon={<Shuffle className="h-4 w-4" />} onClick={s.nextRecommendation}>
              다른 추천
            </Button>
          </div>
        </div>
        <div className="border-t border-slate-100 p-5">
          <div className="mb-2.5 text-[12.5px] font-semibold text-slate-500">AI 후보 랭킹 (오늘 기준 적합도)</div>
          <div className="space-y-2.5">
            {recommendations.slice(0, 5).map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 text-[13px]">
                <span className={cn("w-4 text-center font-bold", r.id === rec.id ? "text-ai-600" : "text-slate-400")}>{i + 1}</span>
                <span className={cn("w-36 truncate", r.id === rec.id ? "font-bold" : "text-slate-600")}>{r.short}</span>
                <Progress value={r.score} tone={r.id === rec.id ? "purple" : "gray"} className="h-1.5 flex-1" />
                <span className="w-7 text-right font-semibold tabular text-slate-500">{r.score}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 2. 추천 근거 */}
      <Card className="p-5">
        <div className="mb-3 text-[12.5px] font-bold text-ai-700">② 추천 근거</div>
        <WhyList items={analysis.reasons} />
      </Card>

      {/* 3·4. 지속 가능성 / 중단 위험 */}
      <div className="grid grid-cols-2 gap-2.5">
        <Card className="p-4">
          <div className="text-[12.5px] font-bold text-ai-700">③ 운동 지속 가능성</div>
          <div className="mt-3 flex justify-center">
            <Ring value={risk.sustainability} size={104} stroke={9} tone={riskTone}>
              <div className="text-[24px] font-bold tabular">{risk.sustainability}%</div>
            </Ring>
          </div>
          <div className="mt-3 text-center">
            <Badge tone={riskTone}>{risk.levelLabel}</Badge>
            <div className="mt-1.5 text-[11.5px] text-slate-400">현재 루틴 기준</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[12.5px] font-bold text-ai-700">④ 중단 위험</div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-[30px] font-bold tabular">{risk.risk}%</span>
            {risk.trend === "up" && <TrendingUp className="h-5 w-5 text-red-500" />}
          </div>
          <p className="mt-1 text-[13px] font-semibold leading-snug">
            {risk.trend === "up" ? "향후 14일 내 운동 중단 가능성이 증가하고 있습니다." : "향후 14일 중단 가능성이 안정적이에요."}
          </p>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
            <AlertTriangle className="h-3 w-3" /> AI 추정 · 행동 패턴 기반
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle title="위험 요인 기여도" sub="어떤 행동 변화가 중단 가능성을 높였는지" className="mb-4" />
        <div className="space-y-3">
          {risk.factors.slice(0, 5).map((f) => (
            <div key={f.label}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
                <span className="shrink-0 font-semibold">{f.label}</span>
                <span className="truncate text-right text-[12px] text-slate-500">{f.detail}</span>
              </div>
              <Progress value={(f.weight / 25) * 100} tone={f.weight > 12 ? "red" : f.weight > 6 ? "orange" : "gray"} className="h-1.5" />
            </div>
          ))}
        </div>
        {risk.mitigation > 0 && (
          <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-[13px] font-medium text-emerald-700">
            적용한 대안으로 중단 위험이 {risk.mitigation}%p 낮아졌어요.
          </div>
        )}
        <p className="mt-4 text-[11.5px] leading-relaxed text-slate-400">
          이 수치는 출석·활동·자기평가 데이터를 바탕으로 한 행동 패턴 기반 AI 추정치이며, 의료적 진단이나 건강 상태 판정이 아닙니다.
        </p>
      </Card>

      {/* 5. 대안 제안 */}
      <div>
        <SectionTitle title="⑤ 대안 제안" sub="적용하면 플랜과 지속 가능성이 바로 다시 계산돼요" />
        <div className="space-y-2.5">
          {analysis.alternatives.map((a) => {
            const Icon = ALT_ICON[a.key];
            const on = !!s.adjustments[a.key];
            return (
              <Card key={a.key} className={cn("p-4 transition", on && "border-brand-200 bg-brand-50/40")}>
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", on ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600")}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[15px] font-bold">{a.title}</span>
                      <span className="text-[12.5px] font-bold text-emerald-600">지속 가능성 +{a.effect}%p</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px]">
                      <span className="text-slate-400 line-through decoration-slate-300">{a.from}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold">{a.to}</span>
                    </div>
                    <div className="mt-1 text-[12px] text-slate-500">{a.reason}</div>
                  </div>
                </div>
                <Button
                  variant={on ? "secondary" : "primary"}
                  size="sm"
                  className="mt-3 w-full"
                  icon={on ? <Check className="h-4 w-4" /> : undefined}
                  onClick={() => {
                    s.toggleAdjustment(a.key);
                    toast({ title: on ? `${a.title} 취소` : `${a.title} 적용 완료`, desc: on ? "원래 루틴으로 돌아갔어요" : "주간 플랜과 지속 가능성을 다시 계산했어요" });
                  }}
                >
                  {on ? "적용됨 · 되돌리기" : "적용하기"}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 6. 주간 플랜 */}
      <Card className="p-5">
        <SectionTitle
          title="⑥ 이번 주 AI 플랜"
          sub={`주 ${s.effectiveGoal}회 · ${s.adjustments.slot ? "점심 중심" : "기존 시간대"} 루틴`}
          action={<Brain className="h-5 w-5 text-ai-600" />}
        />
        <div className="divide-y divide-slate-100">
          {analysis.plan.map((d) => (
            <div key={d.date} className="flex items-center gap-3 py-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl text-[13px] font-bold",
                  d.status === "today" ? "bg-brand-600 text-white" : d.status === "done" ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-500",
                )}
              >
                {d.day}
              </div>
              <div className="min-w-0 flex-1">
                <div className={cn("text-[14px] font-semibold", d.kind === "rest" && "text-slate-400")}>{d.title}</div>
                <div className="text-[12px] text-slate-400">{d.minutes ? `${d.minutes}분` : "회복"}{d.slot ? ` · ${SLOT_LABEL[d.slot]}` : ""}</div>
              </div>
              {d.status === "done" && <Badge tone="green" icon={<Check className="h-3 w-3" />}>완료</Badge>}
              {d.status === "missed" && <Badge tone="gray">놓침</Badge>}
              {d.status === "today" && d.kind !== "rest" && (
                <Button size="sm" onClick={() => start({ type: d.title.includes("필라테스") ? "필라테스" : d.title.includes("헬스") || d.title.includes("서킷") ? "헬스" : d.title.includes("러닝") ? "러닝" : d.title.includes("요가") ? "요가" : "걷기", slot: d.slot ?? "lunch", minutes: d.minutes || 10, title: d.title })}>
                  시작
                </Button>
              )}
              {d.status === "upcoming" && <span className="text-[12px] text-slate-400">예정</span>}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-start gap-2 rounded-2xl bg-slate-100/80 p-4 text-[12px] leading-relaxed text-slate-500">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-ai-600" />
        WellFit AI는 운동 습관 형성을 돕는 코칭 도구입니다. 통증이 지속되거나 건강 이상이 의심되면 전문 의료진과 상담하세요.
      </div>

      <CheckInSheet open={checkInOpen} onClose={() => setCheckInOpen(false)} />
    </div>
  );
}
