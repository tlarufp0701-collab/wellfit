"use client";

import { useState } from "react";
import { Check, Minus, Plus, Sparkles, Target, Trophy, Users, CalendarRange } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn, num } from "@/lib/format";
import { CHALLENGES } from "@/lib/data/catalog";
import { AiTag, Badge, Button, Card, Progress, Ring, SectionTitle, Sheet, useToast } from "@/components/ui";
import { PageHeader } from "./shared";

export default function Goals() {
  const s = useStore();
  const a = s.analysis.activity;
  const toast = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(s.weeklyGoal);
  const goal = s.effectiveGoal;
  const habitWeeks = Math.min(12, a.streakWeeks);
  const aiGoal = a.goalRate < 70 ? Math.max(2, s.weeklyGoal - 1) : s.weeklyGoal;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="GOALS" title="목표 · 챌린지" sub="작게 시작해서 오래 가는 목표를 함께 만들어요." back="/employee" />

      <SectionTitle title="개인 목표" />
      <Card className="p-5">
        <div className="flex items-center gap-5">
          <Ring value={(a.thisWeek / goal) * 100} size={96} stroke={9} tone={a.thisWeek >= goal ? "green" : "blue"}>
            <div className="text-[22px] font-bold tabular">{a.thisWeek}/{goal}</div>
            <div className="text-[11px] text-slate-400">이번 주</div>
          </Ring>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-500">
              <Target className="h-4 w-4 text-brand-600" /> 주간 목표
            </div>
            <div className="mt-0.5 text-[20px] font-bold">주 {goal}회 운동</div>
            {s.adjustments.goal && <div className="mt-0.5 text-[12px] font-semibold text-ai-600">AI 대안 적용 중 (원래 주 {s.weeklyGoal}회)</div>}
            <Button
              variant="secondary" size="sm" className="mt-3"
              onClick={() => {
                setDraft(s.weeklyGoal);
                setEditOpen(true);
              }}
            >
              목표 변경
            </Button>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3 text-[13px] text-slate-600">
          달성하면 <b className="text-ink">+200P</b> · 최근 4주 계획 대비 달성률 <b className="text-ink">{Math.round(a.goalRate)}%</b>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-500">
            <CalendarRange className="h-4 w-4 text-brand-600" /> 습관 목표
          </div>
          <Badge tone="blue">{habitWeeks}/12주</Badge>
        </div>
        <div className="mt-1 text-[20px] font-bold">3개월 운동습관 만들기</div>
        <div className="mt-4 grid grid-cols-12 gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={cn("h-7 rounded-md", i < habitWeeks ? "bg-brand-600" : i === habitWeeks ? "bg-brand-100" : "bg-slate-100")} />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11.5px] text-slate-400">
          <span>1주</span>
          <span>4주 +500P</span>
          <span>12주 +1,500P</span>
        </div>
        <p className="mt-3 text-[13px] text-slate-600">매주 2회 이상이면 한 주가 채워져요. {12 - habitWeeks}주만 더 이어가면 습관 형성 구간을 통과해요.</p>
      </Card>

      <SectionTitle title="회사 챌린지" sub="함께하면 지속률이 평균 1.4배 높아요" className="pt-2" />
      <div className="space-y-3">
        {CHALLENGES.map((c) => {
          const joined = s.joinedChallenges.includes(c.id);
          const progress = c.id === "c3" ? (Math.min(c.target, c.myContribution + (s.adjustments.slot ? 1 : 0)) / c.target) * 100 : (c.progress / c.target) * 100;
          return (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Badge tone={c.scope === "전사" ? "blue" : "purple"}>{c.scope}</Badge>
                    <span className="text-[12px] text-slate-400">D-{c.daysLeft} · {num(c.participants)}명 참여</span>
                  </div>
                  <div className="mt-1.5 text-[17px] font-bold">{c.title}</div>
                  <div className="text-[13px] text-slate-500">{c.desc}</div>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50">
                  <Trophy className="h-5 w-5 text-orange-500" />
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-[13px]">
                  <span className="font-semibold">{c.id === "c3" ? "내 진행" : c.scope === "부서" ? "우리 부서 진행" : "전사 진행"}</span>
                  <span className="tabular text-slate-500">
                    {c.id === "c3" ? `${c.myContribution}/${c.target}회` : c.unit === "%" ? `${c.progress}%` : `${num(c.progress)}/${num(c.target)}${c.unit}`}
                  </span>
                </div>
                <Progress value={progress} tone="orange" />
                {c.id === "c1" && <div className="mt-1.5 text-[12px] text-slate-500">내 기여 {c.myContribution}만 보</div>}
              </div>

              {c.leaderboard && (
                <div className="mt-4 rounded-xl bg-slate-50 p-3.5">
                  <div className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500">
                    <Users className="h-3.5 w-3.5" /> 부서별 달성률 (익명 · 개인 순위 없음)
                  </div>
                  <div className="space-y-1.5">
                    {c.leaderboard.map((l, i) => (
                      <div key={l.dept} className="flex items-center gap-2 text-[12.5px]">
                        <span className="w-4 font-bold text-slate-400">{i + 1}</span>
                        <span className={cn("w-16", l.dept === s.profile.dept && "font-bold text-brand-700")}>{l.dept}</span>
                        <Progress value={l.value} tone={l.dept === s.profile.dept ? "blue" : "gray"} className="h-1.5 flex-1" />
                        <span className="w-9 text-right tabular">{l.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-brand-700">성공 시 +{num(c.reward)}P</span>
                <Button
                  size="sm"
                  variant={joined ? "secondary" : "primary"}
                  icon={joined ? <Check className="h-4 w-4" /> : undefined}
                  onClick={() => {
                    s.toggleChallenge(c.id);
                    toast({ title: joined ? "챌린지 참여를 취소했어요" : `'${c.title}' 참여 완료`, tone: joined ? "info" : "success" });
                  }}
                >
                  {joined ? "참여 중" : "참여하기"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="주간 목표 변경"
        footer={
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              s.setWeeklyGoal(draft);
              setEditOpen(false);
              toast({ title: `주 ${draft}회로 목표를 변경했어요`, desc: "AI 플랜과 지속 가능성이 다시 계산됩니다" });
            }}
          >
            저장
          </Button>
        }
      >
        <div className="flex items-center justify-center gap-6 py-6">
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 disabled:opacity-40" disabled={draft <= 1} onClick={() => setDraft((d) => d - 1)} aria-label="줄이기">
            <Minus className="h-5 w-5" />
          </button>
          <div className="text-center">
            <div className="text-[44px] font-bold tabular">{draft}</div>
            <div className="text-[13px] text-slate-500">회 / 주</div>
          </div>
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 disabled:opacity-40" disabled={draft >= 7} onClick={() => setDraft((d) => d + 1)} aria-label="늘리기">
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="rounded-2xl bg-ai-50 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-ai-700"><Sparkles className="h-4 w-4" /> AI 권장 목표</span>
            <AiTag />
          </div>
          <p className="mt-1.5 text-[13.5px] text-slate-700">
            최근 4주 계획 대비 달성률이 {Math.round(a.goalRate)}%예요. <b>주 {aiGoal}회</b>로 시작해 3주 연속 성공하면 한 단계 올리는 것을 추천해요.
          </p>
          {draft !== aiGoal && (
            <button className="mt-2 text-[13px] font-semibold text-ai-700" onClick={() => setDraft(aiGoal)}>
              주 {aiGoal}회로 설정하기
            </button>
          )}
        </div>
      </Sheet>
    </div>
  );
}
