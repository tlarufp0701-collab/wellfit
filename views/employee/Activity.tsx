"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Flag, PauseCircle, PlayCircle, Award, AlertTriangle, Repeat } from "lucide-react";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/lib/store";
import { cn, fmtDate, fromKey, toKey, WEEKDAYS } from "@/lib/format";
import { EXERCISE_TYPES, SLOT_LABEL, type Slot } from "@/lib/data/employee";
import { FACILITIES } from "@/lib/data/catalog";
import { Badge, Button, Card, Progress, SectionTitle, Segmented } from "@/components/ui";
import { axisProps, ChartTip, SERIES } from "@/components/charts";
import { useStartWorkout } from "@/components/employee-shell";
import { PageHeader } from "./shared";
import type { TimelineEvent } from "@/lib/ai/coach";

const EVENT_STYLE: Record<TimelineEvent["kind"], { icon: typeof Flag; cls: string }> = {
  start: { icon: Flag, cls: "bg-brand-600 text-white" },
  keep: { icon: PlayCircle, cls: "bg-brand-50 text-brand-700" },
  milestone: { icon: Award, cls: "bg-emerald-500 text-white" },
  drop: { icon: PauseCircle, cls: "bg-slate-300 text-white" },
  restart: { icon: Repeat, cls: "bg-ai-600 text-white" },
  warning: { icon: AlertTriangle, cls: "bg-orange-500 text-white" },
};

export default function Activity() {
  const { sessions, analysis, today, effectiveGoal } = useStore();
  const a = analysis.activity;
  const start = useStartWorkout();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string>(toKey(today));
  const [view, setView] = useState<"calendar" | "timeline">("calendar");

  const byDate = useMemo(() => {
    const m = new Map<string, typeof sessions>();
    sessions.forEach((s) => m.set(s.date, [...(m.get(s.date) ?? []), s]));
    return m;
  }, [sessions]);

  const cells = useMemo(() => {
    const first = new Date(month);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const out: (Date | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= days; d++) out.push(new Date(month.getFullYear(), month.getMonth(), d));
    while (out.length % 7) out.push(null);
    return out;
  }, [month]);

  const monthDone = sessions.filter((s) => s.status === "done" && fromKey(s.date).getMonth() === month.getMonth() && fromKey(s.date).getFullYear() === month.getFullYear());
  const selectedSessions = byDate.get(selected) ?? [];
  const weeklyData = a.weekly.map((w, i) => ({ name: i === a.weekly.length - 1 ? "이번주" : `${fmtDate(w.start).replace("월 ", "/").replace("일", "")}`, done: w.done }));
  const maxType = Math.max(1, ...Object.values(a.byType));

  const stats = [
    { label: "이번 주 운동", value: `${a.thisWeek}회`, sub: `목표 ${effectiveGoal}회` },
    { label: "4주 지속률", value: `${Math.round(a.ret4)}%`, sub: "최근 4주" },
    { label: "12주 지속률", value: `${Math.round(a.ret12)}%`, sub: "최근 12주" },
    { label: "중단 횟수", value: `${a.dropouts}회`, sub: "10일+ 공백" },
    { label: "재참여 횟수", value: `${a.restarts}회`, sub: "중단 후 재시작" },
    { label: "누적 운동", value: `${Math.round(a.totalMinutes / 60)}시간`, sub: `${a.totalDone}회` },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="ACTIVITY"
        title="활동 기록"
        sub="출석·웨어러블·앱 기록이 자동으로 모입니다."
        right={<Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => start()}>기록</Button>}
      />

      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <Card key={s.label} className="p-3">
            <div className="text-[11.5px] font-medium text-slate-500">{s.label}</div>
            <div className="mt-0.5 text-[19px] font-bold tabular">{s.value}</div>
            <div className="text-[11px] text-slate-400">{s.sub}</div>
          </Card>
        ))}
      </div>

      <Segmented
        className="w-full [&>button]:flex-1"
        value={view}
        onChange={setView}
        options={[{ value: "calendar", label: "캘린더" }, { value: "timeline", label: "참여 여정" }]}
      />

      {view === "calendar" ? (
        <>
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <button className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="이전 달" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center">
                <div className="text-[16px] font-bold">{month.getFullYear()}년 {month.getMonth() + 1}월</div>
                <div className="text-[12px] text-slate-500">운동 {monthDone.length}회 · {monthDone.reduce((s, x) => s + x.minutes, 0)}분</div>
              </div>
              <button
                className="rounded-lg p-1.5 hover:bg-slate-100 disabled:opacity-30"
                aria-label="다음 달"
                disabled={month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear()}
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {WEEKDAYS.map((d) => (
                <div key={d} className="pb-1 text-[11.5px] font-semibold text-slate-400">{d}</div>
              ))}
              {cells.map((d, i) => {
                if (!d) return <div key={i} />;
                const k = toKey(d);
                const list = byDate.get(k) ?? [];
                const done = list.some((s) => s.status === "done");
                const missed = !done && list.some((s) => s.status === "missed");
                const isToday = k === toKey(today);
                const future = d > today;
                return (
                  <button
                    key={k}
                    disabled={future}
                    onClick={() => setSelected(k)}
                    className={cn("flex flex-col items-center py-1", future && "opacity-30")}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full text-[13.5px] font-semibold tabular transition",
                        done && "bg-brand-600 text-white",
                        missed && "text-slate-400 ring-1 ring-slate-300 ring-inset",
                        !done && !missed && "text-slate-700",
                        isToday && !done && "ring-2 ring-brand-600 ring-inset",
                        selected === k && "outline-2 outline-offset-2 outline-slate-900/70",
                      )}
                    >
                      {d.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex justify-center gap-4 text-[11.5px] text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-600" />운동함</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full ring-1 ring-slate-300" />예약 후 미참여</span>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-3.5">
              <div className="text-[13px] font-bold">{fmtDate(selected, "mdw")}</div>
              {selectedSessions.length === 0 ? (
                <div className="mt-1 text-[13px] text-slate-500">기록이 없어요.</div>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {selectedSessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-[13px]">
                      <span>
                        <b>{s.type}</b> <span className="text-slate-500">· {SLOT_LABEL[s.slot as Slot]}{s.facilityId ? ` · ${FACILITIES.find((f) => f.id === s.facilityId)?.name.split(" ")[0] ?? ""}` : ""}</span>
                      </span>
                      {s.status === "done" ? <Badge tone="blue">{s.minutes}분</Badge> : <Badge tone="gray">미참여</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle title="주간 운동 횟수" sub="최근 12주 · 점선은 목표" />
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
                  <XAxis dataKey="name" {...axisProps} tick={{ fill: "#94A3B8", fontSize: 10 }} interval={2} />
                  <YAxis {...axisProps} allowDecimals={false} domain={[0, 5]} />
                  <Tooltip cursor={{ fill: "#F1F5F9" }} content={<ChartTip unit="회" />} />
                  <ReferenceLine y={effectiveGoal} stroke="#94A3B8" strokeDasharray="4 4" />
                  <Bar dataKey="done" name="운동" radius={[4, 4, 0, 0]} maxBarSize={18}>
                    {weeklyData.map((d, i) => (
                      <Cell key={i} fill={d.done === 0 ? "#E2E8F0" : i === weeklyData.length - 1 ? SERIES.a : "#93B4FD"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle title="운동 종류" sub="누적 인증 횟수" />
            <div className="space-y-2.5">
              {EXERCISE_TYPES.map((t) => (
                <div key={t} className="flex items-center gap-3 text-[13px]">
                  <span className="w-[86px] shrink-0 font-medium">{t}</span>
                  <Progress value={((a.byType[t] ?? 0) / maxType) * 100} tone={a.byType[t] ? "blue" : "gray"} className="h-2 flex-1" />
                  <span className="w-8 text-right font-semibold tabular text-slate-500">{a.byType[t] ?? 0}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle title="시간대별 출석률" sub="최근 6주 · 예약/계획 대비 실제 참여" />
            <div className="space-y-3">
              {(["lunch", "evening", "weekend", "morning"] as Slot[]).map((slot) => {
                const v = a.slotAdherence[slot];
                if (!v.planned) return null;
                return (
                  <div key={slot}>
                    <div className="mb-1 flex justify-between text-[13px]">
                      <span className="font-semibold">{SLOT_LABEL[slot]}</span>
                      <span className="tabular text-slate-500">{v.done}/{v.planned}회 · <b className="text-ink">{Math.round(v.rate)}%</b></span>
                    </div>
                    <Progress value={v.rate} tone={v.rate < 60 ? "orange" : "green"} />
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-5">
          <SectionTitle title="운동 시작 → 지속 → 중단 → 재시작" sub="나의 참여 여정" />
          <ol className="relative mt-2">
            {a.timeline.map((e, i) => {
              const st = EVENT_STYLE[e.kind];
              const Icon = st.icon;
              return (
                <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < a.timeline.length - 1 && <span className="absolute left-[17px] top-9 h-[calc(100%-28px)] w-0.5 bg-slate-100" />}
                  <span className={cn("relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", st.cls)}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="pt-0.5">
                    <div className="text-[12px] font-medium text-slate-400">{fmtDate(e.date, "ymd")}</div>
                    <div className="text-[15px] font-bold">{e.title}</div>
                    <div className="mt-0.5 text-[13px] text-slate-500">{e.detail}</div>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-5 rounded-xl bg-ai-50 p-3.5 text-[13px] leading-relaxed text-ai-700">
            <b>AI 인사이트</b> · 지난번 중단은 평일 저녁 결석이 3주 이어진 뒤 발생했어요. 재시작은 점심 필라테스로 성공했습니다. 지금도 비슷한 패턴이 보여 점심 루틴을 권해요.
          </div>
        </Card>
      )}
    </div>
  );
}
