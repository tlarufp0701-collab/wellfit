/**
 * WellFit 개인 AI 코치 — mock 분석 엔진
 *
 * 실제 서비스에서는 이 모듈의 함수 시그니처를 유지한 채
 * 내부 구현만 모델 API 호출(예: /api/coach)로 교체하면 된다.
 * 모든 수치는 의료 진단이 아닌 "행동 패턴 기반 AI 추정"이다.
 */
import {
  addDays, clamp, daysBetween, josa, fromKey, startOfDay, startOfWeek, toKey, weekdayIndex, WEEKDAYS,
} from "../format";
import type { CheckIn, DailyBio, ExerciseType, Profile, Session, Slot } from "../data/employee";
import { SLOT_LABEL } from "../data/employee";

export type AdjustKey = "exercise" | "slot" | "goal" | "facility";

export interface CoachContext {
  profile: Profile;
  sessions: Session[];
  bio: DailyBio[];
  checkIn: CheckIn | null;
  weeklyGoal: number;
  preferredSlot: Slot;
  adjustments: Partial<Record<AdjustKey, boolean>>;
  today: Date;
}

/* ------------------------------------------------------------------ */
/* 1. 활동 지표                                                        */
/* ------------------------------------------------------------------ */

export interface ActivityMetrics {
  thisWeek: number;
  last7: number;
  weekly: { start: string; done: number; planned: number }[]; // 최근 12주 + 이번 주 (오래된 → 최신)
  ret4: number;
  ret12: number;
  goalRate: number;
  streakWeeks: number;
  dropouts: number;
  restarts: number;
  totalDone: number;
  totalMinutes: number;
  freqChange: number; // 최근 14일 vs 직전 14일 (%)
  slotAdherence: Record<Slot, { planned: number; done: number; rate: number }>;
  eveningMissRecent: number; // 최근 3주 저녁 결석률
  eveningMissPreDrop: number | null; // 과거 중단 직전 3주 저녁 결석률
  byType: Record<string, number>;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  date: string;
  kind: "start" | "keep" | "drop" | "restart" | "milestone" | "warning";
  title: string;
  detail: string;
}

function inRange(s: Session, from: Date, toExclusive: Date) {
  const d = fromKey(s.date);
  return d >= from && d < toExclusive;
}

export function computeActivity(sessions: Session[], weeklyGoal: number, today: Date): ActivityMetrics {
  const t = startOfDay(today);
  const tomorrow = addDays(t, 1);
  const monday = startOfWeek(t);
  const done = sessions.filter((s) => s.status === "done");

  const weekly: ActivityMetrics["weekly"] = [];
  for (let w = 12; w >= 0; w--) {
    const from = addDays(monday, -7 * w);
    const to = w === 0 ? tomorrow : addDays(from, 7);
    const ws = sessions.filter((s) => inRange(s, from, to));
    weekly.push({ start: toKey(from), done: ws.filter((s) => s.status === "done").length, planned: ws.length });
  }
  const complete = weekly.slice(0, -1); // 지난 12주
  const last4 = complete.slice(-4);
  const ret4 = clamp(last4.reduce((a, w) => a + w.done, 0) / (weeklyGoal * 4)) * 100;
  const ret12 = clamp(complete.reduce((a, w) => a + w.done, 0) / (weeklyGoal * 12)) * 100;

  const from28 = addDays(t, -27);
  const p28 = sessions.filter((s) => inRange(s, from28, tomorrow));
  const goalRate = p28.length ? (p28.filter((s) => s.status === "done").length / p28.length) * 100 : 0;

  const thisWeek = weekly[weekly.length - 1].done;
  const last7 = done.filter((s) => inRange(s, addDays(t, -6), tomorrow)).length;

  let streakWeeks = thisWeek >= 2 ? 1 : 0;
  for (let i = complete.length - 1; i >= 0; i--) {
    if (complete[i].done >= 2) streakWeeks++;
    else break;
  }

  // 중단(10일+ 공백)과 재시작
  const timeline: TimelineEvent[] = [];
  let dropouts = 0;
  let restarts = 0;
  let eveningMissPreDrop: number | null = null;
  if (done.length) {
    timeline.push({
      date: done[0].date, kind: "start", title: "운동 시작",
      detail: `${SLOT_LABEL[done[0].slot]} ${done[0].type}로 첫 인증`,
    });
    let runStart = fromKey(done[0].date);
    let milestoneHit = false;
    for (let i = 1; i < done.length; i++) {
      const prev = fromKey(done[i - 1].date);
      const cur = fromKey(done[i].date);
      const gap = daysBetween(prev, cur);
      if (gap >= 10) {
        dropouts++;
        restarts++;
        const preFrom = addDays(prev, -21);
        const pre = sessions.filter((s) => s.slot === "evening" && inRange(s, preFrom, addDays(prev, 12)));
        eveningMissPreDrop = pre.length ? pre.filter((s) => s.status === "missed").length / pre.length : null;
        timeline.push({
          date: toKey(addDays(prev, 1)), kind: "drop", title: "운동 중단",
          detail: `${gap - 1}일간 활동 없음 · 직전 평일 저녁 결석 반복`,
        });
        timeline.push({
          date: done[i].date, kind: "restart", title: "다시 시작",
          detail: `${SLOT_LABEL[done[i].slot]} ${done[i].type}로 재참여 (+300P)`,
        });
        runStart = cur;
        milestoneHit = false;
      }
      if (!milestoneHit && daysBetween(runStart, cur) >= 27) {
        milestoneHit = true;
        const isAfterRestart = restarts > 0;
        timeline.push({
          date: done[i].date, kind: "milestone",
          title: isAfterRestart ? "재참여 후 4주 지속" : "4주 지속 달성",
          detail: isAfterRestart ? "다시 시작한 루틴을 4주 유지 (+700P)" : "습관 형성 1단계 통과 (+500P)",
        });
      }
    }
  }

  // 시간대별 출석률 (최근 6주)
  const from42 = addDays(t, -41);
  const recent6 = sessions.filter((s) => inRange(s, from42, tomorrow));
  const slots: Slot[] = ["morning", "lunch", "evening", "weekend"];
  const slotAdherence = Object.fromEntries(
    slots.map((slot) => {
      const ss = recent6.filter((s) => s.slot === slot);
      const d = ss.filter((s) => s.status === "done").length;
      return [slot, { planned: ss.length, done: d, rate: ss.length ? (d / ss.length) * 100 : 0 }];
    }),
  ) as ActivityMetrics["slotAdherence"];

  const ev3 = sessions.filter((s) => s.slot === "evening" && inRange(s, addDays(t, -20), tomorrow));
  const eveningMissRecent = ev3.length ? ev3.filter((s) => s.status === "missed").length / ev3.length : 0;

  if (eveningMissRecent >= 0.5) {
    timeline.push({
      date: toKey(t), kind: "warning", title: "주의: 평일 저녁 결석 증가",
      detail: `최근 3주 저녁 결석률 ${Math.round(eveningMissRecent * 100)}% · AI가 시간대 변경을 제안 중`,
    });
  } else if (done.length) {
    timeline.push({ date: toKey(t), kind: "keep", title: "지속 중", detail: `연속 참여 ${streakWeeks}주째` });
  }

  const recent14 = done.filter((s) => inRange(s, addDays(t, -13), tomorrow)).length;
  const prior14 = done.filter((s) => inRange(s, addDays(t, -27), addDays(t, -13))).length;
  const freqChange = prior14 ? ((recent14 - prior14) / prior14) * 100 : 0;

  const byType: Record<string, number> = {};
  done.forEach((s) => (byType[s.type] = (byType[s.type] ?? 0) + 1));

  return {
    thisWeek, last7, weekly, ret4, ret12, goalRate, streakWeeks, dropouts, restarts,
    totalDone: done.length,
    totalMinutes: done.reduce((a, s) => a + s.minutes, 0),
    freqChange, slotAdherence, eveningMissRecent, eveningMissPreDrop, byType,
    timeline: timeline.sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/* ------------------------------------------------------------------ */
/* 2. 바이오/자기평가 지표                                              */
/* ------------------------------------------------------------------ */

export interface BioMetrics {
  sleepRecent: number;
  sleepPrior: number;
  sleepDelta: number;
  stressRecent: number;
  stressNow: number;
  conditionNow: number;
  sleepNow: number;
  stepsRecent: number;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function computeBio(bio: DailyBio[], checkIn: CheckIn | null): BioMetrics {
  const recent = bio.slice(-14);
  const prior = bio.slice(-42, -14);
  const last7 = bio.slice(-7);
  const sleepRecent = avg(recent.map((b) => b.sleep));
  const sleepPrior = avg(prior.map((b) => b.sleep));
  const stressRecent = avg(last7.map((b) => b.stress));
  return {
    sleepRecent,
    sleepPrior,
    sleepDelta: sleepRecent - sleepPrior,
    stressRecent,
    stressNow: checkIn ? checkIn.stress : Math.round(stressRecent),
    conditionNow: checkIn ? checkIn.condition : Math.round(avg(last7.map((b) => b.condition))),
    sleepNow: checkIn ? checkIn.sleep : bio[bio.length - 1]?.sleep ?? 7,
    stepsRecent: avg(last7.map((b) => b.steps)),
  };
}

/* ------------------------------------------------------------------ */
/* 3. 웰니스 점수 / 중단 위험                                           */
/* ------------------------------------------------------------------ */

export interface WellnessScore {
  score: number;
  parts: { label: string; value: number; max: number }[];
  label: string;
}

export function computeWellness(a: ActivityMetrics, b: BioMetrics, weeklyGoal: number): WellnessScore {
  const activity = clamp(0.5 * clamp(a.last7 / weeklyGoal) + 0.5 * (a.ret4 / 100));
  const sleep = clamp((b.sleepNow - 4) / 3.5);
  const stress = clamp((10 - b.stressNow) / 8);
  const cond = clamp((b.conditionNow - 1) / 4);
  const consistency = a.streakWeeks >= 4 ? 4 : a.streakWeeks >= 2 ? 2 : 0;
  const parts = [
    { label: "활동", value: Math.round(activity * 35), max: 35 },
    { label: "수면", value: Math.round(sleep * 22), max: 22 },
    { label: "스트레스", value: Math.round(stress * 20), max: 20 },
    { label: "컨디션", value: Math.round(cond * 19), max: 19 },
    { label: "꾸준함", value: consistency, max: 4 },
  ];
  const score = Math.min(100, parts.reduce((s, p) => s + p.value, 0));
  const label = score >= 80 ? "아주 좋아요" : score >= 70 ? "좋아요" : score >= 55 ? "보통이에요" : "회복이 필요해요";
  return { score, parts, label };
}

export interface RiskFactor {
  label: string;
  detail: string;
  weight: number; // 기여 점수
}

export interface DropoutRisk {
  risk: number; // 0-100, 향후 14일 중단 가능성 (AI 추정)
  sustainability: number; // 현재 루틴 지속 가능성
  level: "good" | "caution" | "danger";
  levelLabel: string;
  trend: "up" | "flat" | "down";
  factors: RiskFactor[];
  mitigation: number;
}

export const ADJUST_EFFECT: Record<AdjustKey, number> = { slot: 12, goal: 8, exercise: 6, facility: 5 };

export function computeRisk(ctx: CoachContext, a: ActivityMetrics, b: BioMetrics): DropoutRisk {
  const t = startOfDay(ctx.today);
  const tomorrow = addDays(t, 1);
  const rec = ctx.sessions.filter((s) => inRange(s, addDays(t, -13), tomorrow));
  const missRate = rec.length ? rec.filter((s) => s.status === "missed").length / rec.length : 0;
  const freqDrop = clamp(-a.freqChange / 100);
  const sleepDrop = clamp(-b.sleepDelta / 1.5);
  const stressEff = 0.6 * b.stressRecent + 0.4 * b.stressNow;
  const stressF = clamp((stressEff - 4) / 5);
  const goalMiss = clamp(1 - a.goalRate / 100);
  const evening = a.eveningMissRecent;
  const similarity =
    a.eveningMissPreDrop === null ? 0 : clamp(1 - Math.abs(a.eveningMissRecent - a.eveningMissPreDrop) * 1.2) * clamp(a.eveningMissRecent * 1.6);

  const factors: RiskFactor[] = [
    { label: "운동빈도 감소", detail: `최근 2주 ${a.freqChange <= 0 ? "" : "+"}${Math.round(a.freqChange)}% (직전 2주 대비)`, weight: freqDrop * 25 },
    { label: "계획 대비 결석", detail: `최근 2주 결석률 ${Math.round(missRate * 100)}%`, weight: missRate * 25 },
    { label: "평일 저녁 결석", detail: `최근 3주 저녁 결석률 ${Math.round(evening * 100)}%`, weight: evening * 15 },
    { label: "과거 중단 패턴 유사", detail: `중단 직전 3주와 행동 패턴 유사도 ${Math.round(similarity * 100)}%`, weight: similarity * 15 },
    { label: "수면 감소", detail: `최근 2주 평균 ${b.sleepRecent.toFixed(1)}시간 (${b.sleepDelta.toFixed(1)}h)`, weight: sleepDrop * 15 },
    { label: "스트레스", detail: `자기평가 평균 ${stressEff.toFixed(1)}/10`, weight: stressF * 10 },
    { label: "목표 미달", detail: `최근 4주 계획 대비 달성 ${Math.round(a.goalRate)}%`, weight: goalMiss * 10 },
  ].sort((x, y) => y.weight - x.weight);

  const raw = factors.reduce((s, f) => s + f.weight, 0) * (100 / 115) * 1.12;
  const mitigation = (Object.keys(ctx.adjustments) as AdjustKey[])
    .filter((k) => ctx.adjustments[k])
    .reduce((s, k) => s + ADJUST_EFFECT[k], 0);
  const risk = Math.round(clamp(raw - mitigation, 5, 95));
  const sustainability = 100 - risk;
  const level = sustainability >= 65 ? "good" : sustainability >= 40 ? "caution" : "danger";
  return {
    risk,
    sustainability,
    level,
    levelLabel: level === "good" ? "양호" : level === "caution" ? "주의 필요" : "위험",
    trend: a.freqChange < -10 || evening > 0.5 ? "up" : a.freqChange > 10 ? "down" : "flat",
    factors,
    mitigation,
  };
}

/* ------------------------------------------------------------------ */
/* 4. 추천                                                             */
/* ------------------------------------------------------------------ */

export interface Recommendation {
  id: string;
  title: string;
  short: string;
  type: ExerciseType;
  slot: Slot;
  minutes: number;
  intensity: "저강도" | "중강도" | "고강도";
  facilityId?: string;
  score: number;
  why: string[];
}

const CANDIDATES: Omit<Recommendation, "score" | "why">[] = [
  { id: "walk", title: "점심시간 30분 빠르게 걷기", short: "30분 빠르게 걷기", type: "걷기", slot: "lunch", minutes: 30, intensity: "저강도" },
  { id: "pilates", title: "점심 40분 매트 필라테스", short: "점심 필라테스 40분", type: "필라테스", slot: "lunch", minutes: 40, intensity: "중강도", facilityId: "f2" },
  { id: "yoga", title: "저녁 수면 개선 요가 50분", short: "수면 개선 요가", type: "요가", slot: "evening", minutes: 50, intensity: "저강도", facilityId: "f3" },
  { id: "gym-light", title: "가벼운 전신 서킷 35분", short: "전신 서킷 35분", type: "헬스", slot: "lunch", minutes: 35, intensity: "중강도", facilityId: "f1" },
  { id: "gym", title: "저녁 고강도 웨이트 60분", short: "웨이트 60분", type: "헬스", slot: "evening", minutes: 60, intensity: "고강도", facilityId: "f1" },
  { id: "swim", title: "출근 전 자유수영 40분", short: "자유수영 40분", type: "수영", slot: "morning", minutes: 40, intensity: "중강도", facilityId: "f4" },
  { id: "walk-weekend", title: "한강 산책로 40분 빠르게 걷기", short: "40분 빠르게 걷기", type: "걷기", slot: "weekend", minutes: 40, intensity: "저강도", facilityId: "f8" },
  { id: "yoga-weekend", title: "주말 오전 빈야사 요가 50분", short: "주말 요가 50분", type: "요가", slot: "weekend", minutes: 50, intensity: "저강도", facilityId: "f3" },
  { id: "run", title: "주말 한강 5K 러닝", short: "5K 러닝", type: "러닝", slot: "weekend", minutes: 40, intensity: "중강도", facilityId: "f8" },
  { id: "f45", title: "F45 팀 트레이닝 45분", short: "F45 45분", type: "크로스핏/F45", slot: "evening", minutes: 45, intensity: "고강도", facilityId: "f5" },
];

export function recommend(ctx: CoachContext, a: ActivityMetrics, b: BioMetrics): Recommendation[] {
  const tired = b.sleepNow < 6.5 || b.conditionNow <= 2 || b.stressNow >= 7 || b.sleepDelta < -0.6;
  const backPain = ctx.profile.pain.some((p) => p.includes("허리"));
  const isWeekend = weekdayIndex(ctx.today) >= 5;
  const lunchGap = a.slotAdherence.lunch.rate - a.slotAdherence.evening.rate;

  return CANDIDATES.map((c) => {
    let score = 50;
    const why: string[] = [];
    const slotRate = a.slotAdherence[c.slot].rate || 60;
    score += (slotRate - 60) * 0.35;
    if (ctx.profile.preferred.includes(c.type)) score += 8;
    if (!ctx.profile.availableSlots.includes(c.slot)) score -= 25;
    if (c.slot === ctx.preferredSlot) score += 10;
    if (isWeekend && c.slot !== "weekend") score -= 30;
    if (!isWeekend && c.slot === "weekend") score -= 30;
    if (tired) {
      if (c.intensity === "고강도") score -= 22;
      if (c.intensity === "저강도") score += 12;
    }
    if (backPain && (c.type === "러닝" || c.type === "크로스핏/F45")) score -= 10;
    if (backPain && (c.type === "필라테스" || c.type === "요가")) score += 5;
    if (ctx.profile.social === "solo" && c.type === "크로스핏/F45") score -= 8;
    if (a.eveningMissRecent > 0.5 && c.slot === "evening") score -= 12;

    if (c.slot === "lunch" && lunchGap > 0) why.push(`점심시간 출석률이 저녁보다 ${Math.round(lunchGap)}%p 높아요`);
    if (tired && c.intensity !== "고강도") why.push("수면·컨디션이 떨어진 날엔 저·중강도가 지속에 유리해요");
    if (ctx.profile.preferred.includes(c.type)) why.push(`선호 운동(${c.type})과 일치`);
    if (backPain && (c.type === "필라테스" || c.type === "요가" || c.type === "걷기")) why.push("허리 부담이 적은 저충격 운동");
    if (c.slot === "evening" && a.eveningMissRecent > 0.5) why.push("최근 평일 저녁 결석이 잦아 우선순위를 낮췄어요");
    if (c.intensity === "고강도" && tired) why.push("오늘 컨디션 기준 고강도는 비추천");
    return { ...c, score: Math.round(clamp(score, 5, 99)), why };
  }).sort((x, y) => y.score - x.score);
}

export function recommendationReasons(a: ActivityMetrics, b: BioMetrics): string[] {
  const reasons: string[] = [];
  const ev = a.slotAdherence.evening;
  if (a.eveningMissRecent >= 0.4) reasons.push(`최근 3주 평일 저녁 운동 결석률 ${Math.round(a.eveningMissRecent * 100)}% (출석 ${ev.done}/${ev.planned}회, 6주 기준)`);
  if (a.freqChange < 0) reasons.push(`최근 2주 운동빈도 ${Math.round(Math.abs(a.freqChange))}% 감소`);
  if (b.sleepDelta < -0.3) reasons.push(`평균 수면시간 ${Math.abs(b.sleepDelta).toFixed(1)}시간 감소 (최근 2주)`);
  const gap = a.slotAdherence.lunch.rate - a.slotAdherence.evening.rate;
  if (gap > 0) reasons.push(`점심시간 활동 지속률이 저녁보다 ${Math.round(gap)}%p 높음`);
  if (b.stressRecent >= 5.5) reasons.push(`스트레스 자기평가 평균 ${b.stressRecent.toFixed(1)}/10`);
  return reasons.slice(0, 4);
}

/* ------------------------------------------------------------------ */
/* 5. 대안 제안 / 주간 플랜                                              */
/* ------------------------------------------------------------------ */

export interface Alternative {
  key: AdjustKey;
  title: string;
  from: string;
  to: string;
  effect: number;
  reason: string;
}

export function alternatives(ctx: CoachContext, a: ActivityMetrics): Alternative[] {
  const gap = Math.round(a.slotAdherence.lunch.rate - a.slotAdherence.evening.rate);
  return [
    {
      key: "slot", title: "시간대 바꾸기", from: "평일 저녁 19:30", to: "점심 12:10 – 12:50", effect: ADJUST_EFFECT.slot,
      reason: `점심 출석률 ${Math.round(a.slotAdherence.lunch.rate)}% vs 저녁 ${Math.round(a.slotAdherence.evening.rate)}% (${gap}%p 차이)`,
    },
    {
      key: "goal", title: "목표 조정", from: `주 ${ctx.weeklyGoal}회`, to: `주 ${Math.max(2, ctx.weeklyGoal - 1)}회 + 걷기 1회`, effect: ADJUST_EFFECT.goal,
      reason: "목표를 작게 성공하면 다음 달 지속률이 높아지는 패턴",
    },
    {
      key: "exercise", title: "운동 바꾸기", from: "고강도 웨이트 60분", to: "필라테스 40분 · 서킷 35분", effect: ADJUST_EFFECT.exercise,
      reason: "재시작 당시 필라테스로 4주 지속에 성공한 이력",
    },
    {
      key: "facility", title: "시설 바꾸기", from: "WellFit Fitness 강남 (0.8km)", to: "코어밸런스 필라테스 (0.5km)", effect: ADJUST_EFFECT.facility,
      reason: "회사 도보 6분 · 점심 40분 클래스 운영 · 복지 적용",
    },
  ];
}

export interface PlanDay {
  day: string;
  date: string;
  title: string;
  minutes: number;
  kind: "workout" | "light" | "rest";
  slot?: Slot;
  status: "done" | "missed" | "today" | "upcoming" | "rest";
}

export function weeklyPlan(ctx: CoachContext): PlanDay[] {
  const monday = startOfWeek(ctx.today);
  const t = startOfDay(ctx.today);
  const lunchFirst = ctx.preferredSlot === "lunch" || ctx.adjustments.slot;
  const goal = ctx.adjustments.goal ? Math.max(2, ctx.weeklyGoal - 1) : ctx.weeklyGoal;
  const workout = ctx.adjustments.exercise
    ? ["점심 필라테스", "전신 서킷", "점심 필라테스", "요가"]
    : ["점심 빠르게 걷기", "점심 필라테스", lunchFirst ? "점심 전신 서킷" : "저녁 헬스 (가볍게)", "한강 걷기·러닝 40분"];
  const allSlots: { d: number; i: number; min: number; slot: Slot }[] = [
    { d: 0, i: 0, min: 30, slot: "lunch" },
    { d: 1, i: 1, min: 40, slot: "lunch" },
    { d: 3, i: 2, min: 35, slot: (lunchFirst ? "lunch" : "evening") as Slot },
    { d: 5, i: 3, min: 40, slot: "weekend" },
    { d: 2, i: 1, min: 40, slot: "lunch" },
    { d: 4, i: 0, min: 30, slot: "lunch" },
  ];
  const pattern = allSlots.slice(0, goal);

  return WEEKDAYS.map((label, d) => {
    const date = addDays(monday, d);
    const key = toKey(date);
    const p = pattern.find((x) => x.d === d);
    const sessionsToday = ctx.sessions.filter((s) => s.date === key);
    const didIt = sessionsToday.some((s) => s.status === "done");
    const isPast = date < t;
    const isToday = key === toKey(t);
    if (!p) {
      return {
        day: label, date: key,
        title: d === 6 ? "완전 휴식" : "스트레칭 10분",
        minutes: d === 6 ? 0 : 10,
        kind: d === 6 ? "rest" : "light",
        status: didIt ? "done" : isToday ? "today" : "rest",
      };
    }
    return {
      day: label, date: key, title: workout[p.i], minutes: p.min, kind: "workout", slot: p.slot,
      status: didIt ? "done" : isToday ? "today" : isPast ? "missed" : "upcoming",
    };
  });
}

/* ------------------------------------------------------------------ */
/* 6. 통합 분석 — UI에서 호출하는 단일 진입점                            */
/* ------------------------------------------------------------------ */

export interface CoachAnalysis {
  activity: ActivityMetrics;
  bio: BioMetrics;
  wellness: WellnessScore;
  risk: DropoutRisk;
  recommendations: Recommendation[];
  reasons: string[];
  alternatives: Alternative[];
  plan: PlanDay[];
  headline: string;
  inputs: { label: string; value: string; source: string }[];
}

export function analyze(ctx: CoachContext): CoachAnalysis {
  const activity = computeActivity(ctx.sessions, ctx.weeklyGoal, ctx.today);
  const bio = computeBio(ctx.bio, ctx.checkIn);
  const wellness = computeWellness(activity, bio, ctx.weeklyGoal);
  const risk = computeRisk(ctx, activity, bio);
  const recommendations = recommend(ctx, activity, bio);
  const reasons = recommendationReasons(activity, bio);
  const weekdayTop = recommend({ ...ctx, today: startOfWeek(ctx.today) }, activity, bio)[0];
  const when = weekdayIndex(ctx.today) >= 5 ? "다음 주에는" : "이번 주에는";
  const headline =
    activity.eveningMissRecent >= 0.5
      ? `최근 평일 저녁 운동 참여가 감소하고 있어요. ${when} ${SLOT_LABEL[weekdayTop.slot]} ${josa(weekdayTop.short, "을", "를")} 추천합니다.`
      : `좋은 흐름이에요. ${when} ${SLOT_LABEL[weekdayTop.slot]} ${josa(weekdayTop.short, "으로", "로")} 루틴을 이어가세요.`;
  const p = ctx.profile;
  const inputs = [
    { label: "나이", value: `${p.age}세 · ${p.gender}`, source: "프로필" },
    { label: "체성분", value: `체지방 ${p.bodyFat}% · 골격근 ${p.muscle}kg`, source: "인바디 연동" },
    { label: "운동 경험", value: p.experience, source: "온보딩 설문" },
    { label: "선호 운동", value: p.preferred.join(", "), source: "온보딩 설문" },
    { label: "운동 성향", value: p.social === "solo" ? "혼자 운동 선호" : p.social === "group" ? "그룹 운동 선호" : "상관없음", source: "온보딩 설문" },
    { label: "통증/불편", value: p.pain.join(", ") || "없음", source: "자기보고" },
    { label: "생활패턴", value: p.lifestyle, source: "온보딩 설문" },
    { label: "가능 시간", value: p.availableSlots.map((s) => SLOT_LABEL[s]).join(" · "), source: "캘린더 설정" },
    { label: "최근 운동빈도", value: `최근 7일 ${activity.last7}회 · 2주 ${activity.freqChange > 0 ? "+" : ""}${Math.round(activity.freqChange)}%`, source: "출석·웨어러블" },
    { label: "출석 변화", value: `저녁 결석률 ${Math.round(activity.eveningMissRecent * 100)}%`, source: "시설 QR 출석" },
    { label: "목표 달성률", value: `${Math.round(activity.goalRate)}%`, source: "목표 기록" },
    { label: "수면", value: `${bio.sleepRecent.toFixed(1)}시간 (${bio.sleepDelta.toFixed(1)}h)`, source: "웨어러블" },
    { label: "스트레스", value: `${bio.stressNow}/10`, source: "오늘 체크인" },
    { label: "컨디션", value: `${bio.conditionNow}/5`, source: "오늘 체크인" },
  ];
  return {
    activity, bio, wellness, risk, recommendations, reasons,
    alternatives: alternatives(ctx, activity),
    plan: weeklyPlan(ctx),
    headline,
    inputs,
  };
}
