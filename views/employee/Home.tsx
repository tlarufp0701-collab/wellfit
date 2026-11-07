"use client";

import { useState } from "react";
import { ChevronRight, Flame, Gift, Moon, Play, RefreshCw, Shuffle, Smile, Sparkles, Target, TrendingUp, Trophy, Zap, CalendarCheck, BarChart3 } from "lucide-react";
import { useStore } from "@/lib/store";
import { AppLink } from "@/lib/nav";
import { cn, fmtDate, num, toKey } from "@/lib/format";
import { SLOT_LABEL } from "@/lib/data/employee";
import { REWARD_ITEMS } from "@/lib/data/catalog";
import { AiTag, Badge, Button, Card, Progress, Ring, Sheet } from "@/components/ui";
import { useStartWorkout } from "@/components/employee-shell";
import { CheckInSheet, WhyList } from "./shared";

export default function EmployeeHome() {
  const s = useStore();
  const { analysis, profile, today } = s;
  const { wellness, activity, risk } = analysis;
  const start = useStartWorkout();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);

  const recs = analysis.recommendations;
  const rec = recs[s.recIndex % Math.min(4, recs.length)];
  const doneToday = s.sessions.some((x) => x.date === toKey(today) && x.status === "done");
  const goal = s.effectiveGoal;
  const wish = REWARD_ITEMS.find((r) => r.id === s.wishlist) ?? REWARD_ITEMS[REWARD_ITEMS.length - 1];
  const remain = Math.max(0, wish.price - s.points);
  const scoreTone = wellness.score >= 70 ? "blue" : wellness.score >= 55 ? "orange" : "red";

  const kpis = [
    { label: "이번 주 운동", value: `${activity.thisWeek}회`, icon: CalendarCheck },
    { label: "4주 지속률", value: `${Math.round(activity.ret4)}%`, icon: TrendingUp },
    { label: "목표 달성률", value: `${Math.round(activity.goalRate)}%`, icon: Target },
    { label: "연속 참여", value: `${activity.streakWeeks}주`, icon: Flame },
  ];

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[13px] font-semibold text-brand-600">{fmtDate(today, "mdw")}</div>
          <h1 className="mt-1 text-[26px] font-bold tracking-tight">안녕하세요, {profile.name}님</h1>
          <div className="mt-0.5 text-[13.5px] text-slate-500">{profile.company} · {profile.dept}</div>
        </div>
        <AppLink href="/employee/report" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-[15px] font-bold text-brand-700" aria-label="내 리포트">
          {profile.name.slice(1, 2)}
        </AppLink>
      </div>

      {/* 오늘의 컨디션 */}
      <button onClick={() => setCheckInOpen(true)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-left shadow-card">
        <span className="text-[13px] font-semibold text-slate-500">오늘의 컨디션</span>
        {s.checkIn ? (
          <span className="flex flex-1 items-center gap-3 text-[13px] font-semibold text-ink">
            <span className="flex items-center gap-1"><Moon className="h-3.5 w-3.5 text-brand-600" />{s.checkIn.sleep}h</span>
            <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-orange-500" />{s.checkIn.stress}/10</span>
            <span className="flex items-center gap-1"><Smile className="h-3.5 w-3.5 text-emerald-600" />{s.checkIn.condition}/5</span>
          </span>
        ) : (
          <span className="flex-1 text-[13px] font-semibold text-brand-600">30초 체크인하고 +10P</span>
        )}
        <ChevronRight className="h-4 w-4 text-slate-400" />
      </button>

      {/* 웰니스 점수 */}
      <Card className="p-5">
        <div className="flex items-center gap-5">
          <Ring value={wellness.score} size={108} stroke={10} tone={scoreTone}>
            <div className="text-[30px] font-bold leading-none tabular">{wellness.score}</div>
            <div className="mt-1 text-[11px] font-medium text-slate-400">/ 100</div>
          </Ring>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-slate-500">오늘의 웰니스 점수</div>
            <div className="mt-0.5 text-[19px] font-bold">{wellness.label}</div>
            <div className="mt-2.5 space-y-1.5">
              {wellness.parts.slice(0, 3).map((p) => (
                <div key={p.label} className="flex items-center gap-2 text-[12px]">
                  <span className="w-14 shrink-0 text-slate-500">{p.label}</span>
                  <Progress value={(p.value / p.max) * 100} className="h-1.5" tone={p.value / p.max < 0.55 ? "orange" : "blue"} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <button onClick={() => setScoreOpen(true)} className="mt-3 w-full text-right text-[12.5px] font-semibold text-slate-400 hover:text-slate-600">
          점수 계산 방식 보기
        </button>
      </Card>

      {/* AI 코치 */}
      <Card className="overflow-hidden border-ai-100">
        <div className="bg-gradient-to-b from-ai-50/80 to-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[14px] font-bold text-ai-700">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ai-600 text-white"><Sparkles className="h-4 w-4" /></span>
              AI 웰니스 코치
            </div>
            <AiTag label="행동 패턴 기반" />
          </div>
          <p className="mt-3 text-[15.5px] font-semibold leading-relaxed text-ink">{analysis.headline}</p>

          <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-semibold text-slate-500">{doneToday ? "오늘 운동 완료 · 추가 추천" : "오늘의 추천"}</div>
              <Badge tone={rec.intensity === "고강도" ? "orange" : "green"}>{rec.intensity}</Badge>
            </div>
            <div className="mt-1 text-[17px] font-bold">{rec.title}</div>
            <div className="mt-0.5 text-[13px] text-slate-500">{SLOT_LABEL[rec.slot]} · {rec.minutes}분 · AI 적합도 {rec.score}점</div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" size="md" icon={<Sparkles className="h-4 w-4 text-ai-600" />} onClick={() => setWhyOpen(true)}>
              추천 이유 보기
            </Button>
            <Button variant="outline" size="md" icon={<Shuffle className="h-4 w-4" />} onClick={s.nextRecommendation}>
              다른 운동 추천
            </Button>
          </div>
          <Button
            size="lg"
            className="mt-2 w-full"
            icon={<Play className="h-4 w-4" />}
            onClick={() => start({ type: rec.type, slot: rec.slot, minutes: rec.minutes, facilityId: rec.facilityId, title: rec.title })}
          >
            지금 시작하기
          </Button>
        </div>
      </Card>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-2.5">
        {kpis.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </div>
            <div className="mt-1 text-[22px] font-bold tabular">{value}</div>
          </Card>
        ))}
      </div>

      {/* 현재 목표 */}
      <AppLink href="/employee/goals" className="block">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[15px] font-bold">
              <Target className="h-[18px] w-[18px] text-brand-600" /> 현재 목표 · 주 {goal}회 운동
            </div>
            <span className="text-[15px] font-bold text-brand-600 tabular">{activity.thisWeek}/{goal}회</span>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {analysis.plan.map((d) => (
              <div key={d.date} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-lg text-[11px] font-bold",
                    d.status === "done" && "bg-brand-600 text-white",
                    d.status === "today" && "border-2 border-brand-600 text-brand-600",
                    d.status === "missed" && "bg-slate-100 text-slate-400",
                    (d.status === "upcoming" || d.status === "rest") && "bg-slate-50 text-slate-300",
                  )}
                >
                  {d.status === "done" ? "✓" : d.kind === "workout" ? "●" : ""}
                </div>
                <span className={cn("text-[11px]", d.status === "today" ? "font-bold text-brand-600" : "text-slate-400")}>{d.day}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-slate-500">
            {activity.thisWeek >= goal ? "이번 주 목표를 달성했어요! 🎉" : `목표까지 ${goal - activity.thisWeek}회 남았어요. 달성 시 +200P`}
          </p>
        </Card>
      </AppLink>

      {/* 다음 리워드 */}
      <AppLink href="/employee/rewards" className="block">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50">
            <Gift className="h-6 w-6 text-brand-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-medium text-slate-500">다음 리워드 · {wish.name}</div>
            <div className="mt-0.5 text-[17px] font-bold">{remain > 0 ? `${num(remain)}P 남음` : "지금 교환 가능!"}</div>
            <Progress value={(s.points / wish.price) * 100} className="mt-2 h-1.5" />
          </div>
          <div className="text-right">
            <div className="text-[11.5px] text-slate-400">보유</div>
            <div className="text-[15px] font-bold tabular">{num(s.points)}P</div>
          </div>
        </Card>
      </AppLink>

      {/* 바로가기 */}
      <div className="grid grid-cols-2 gap-2.5">
        <AppLink href="/employee/goals" className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-4 text-[14px] font-semibold shadow-card">
          <Trophy className="h-[18px] w-[18px] text-orange-500" /> 목표 · 챌린지
        </AppLink>
        <AppLink href="/employee/report" className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-4 text-[14px] font-semibold shadow-card">
          <BarChart3 className="h-[18px] w-[18px] text-brand-600" /> 내 변화 리포트
        </AppLink>
      </div>

      <CheckInSheet open={checkInOpen} onClose={() => setCheckInOpen(false)} />

      <Sheet open={whyOpen} onClose={() => setWhyOpen(false)} title="AI가 이렇게 추천한 이유">
        <div className="space-y-5">
          <div className="rounded-2xl bg-ai-50 p-4">
            <div className="text-[12.5px] font-semibold text-ai-700">추천</div>
            <div className="mt-0.5 text-[16px] font-bold">{rec.title}</div>
          </div>
          <div>
            <div className="mb-2 text-[13px] font-semibold text-slate-500">내 데이터에서 찾은 근거</div>
            <WhyList items={[...analysis.reasons, ...rec.why].filter((v, i, a) => a.indexOf(v) === i).slice(0, 6)} />
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-500">현재 루틴 지속 가능성</span>
              <Badge tone={risk.level === "good" ? "green" : risk.level === "caution" ? "orange" : "red"}>{risk.levelLabel}</Badge>
            </div>
            <div className="mt-1 text-[24px] font-bold tabular">{risk.sustainability}%</div>
            <p className="mt-1 text-[12px] text-slate-400">행동 패턴 기반 AI 추정치이며 의료적 진단이 아닙니다.</p>
          </div>
          <AppLink href="/employee/ai-coach" onClick={() => setWhyOpen(false)} className="flex items-center justify-center gap-1 text-[14px] font-semibold text-ai-700">
            <RefreshCw className="h-4 w-4" /> AI 코치에서 전체 분석 보기
          </AppLink>
        </div>
      </Sheet>

      <Sheet open={scoreOpen} onClose={() => setScoreOpen(false)} title="웰니스 점수 구성">
        <p className="mb-4 text-[13px] text-slate-500">활동·수면·스트레스·컨디션·꾸준함을 조합한 행동 지표입니다. 의료적 진단이 아닙니다.</p>
        <div className="space-y-3">
          {wellness.parts.map((p) => (
            <div key={p.label}>
              <div className="mb-1 flex justify-between text-[13.5px]">
                <span className="font-semibold">{p.label}</span>
                <span className="tabular text-slate-500">{p.value} / {p.max}</span>
              </div>
              <Progress value={(p.value / p.max) * 100} tone={p.value / p.max < 0.55 ? "orange" : "blue"} />
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
          <span className="text-[14px] font-semibold">합계</span>
          <span className="text-[20px] font-bold tabular">{wellness.score}</span>
        </div>
      </Sheet>
    </div>
  );
}
