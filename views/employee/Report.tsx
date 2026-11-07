"use client";

import { useMemo, useState } from "react";
import { Lock, Moon, Sparkles, Zap, Dumbbell, Footprints } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/lib/store";
import { addDays, clamp, fmtDate, fromKey, startOfWeek, toKey } from "@/lib/format";
import { buildBio } from "@/lib/data/employee";
import { AiTag, Card, Delta, SectionTitle, Segmented } from "@/components/ui";
import { axisProps, ChartTip, gridProps, Legend, SERIES } from "@/components/charts";
import { PageHeader } from "./shared";

export default function Report() {
  const s = useStore();
  const [range, setRange] = useState<4 | 12>(12);
  const bio = useMemo(() => buildBio(s.today), [s.today]);

  const weeks = useMemo(() => {
    const monday = startOfWeek(s.today);
    const out: { label: string; score: number; sessions: number; sleep: number; stress: number; condition: number; steps: number }[] = [];
    for (let w = 12; w >= 1; w--) {
      const from = addDays(monday, -7 * w);
      const to = addDays(from, 7);
      const b = bio.filter((x) => fromKey(x.date) >= from && fromKey(x.date) < to);
      const n = s.sessions.filter((x) => x.status === "done" && fromKey(x.date) >= from && fromKey(x.date) < to).length;
      const avg = (k: "sleep" | "stress" | "condition" | "steps") => b.reduce((acc, x) => acc + x[k], 0) / Math.max(1, b.length);
      const sleep = avg("sleep");
      const stress = avg("stress");
      const condition = avg("condition");
      const score = Math.round(
        clamp(n / s.weeklyGoal) * 35 + clamp((sleep - 4) / 3.5) * 22 + clamp((10 - stress) / 8) * 20 + clamp((condition - 1) / 4) * 19 + (n >= 2 ? 4 : 0),
      );
      out.push({ label: fmtDate(from).replace("월 ", "/").replace("일", ""), score, sessions: n, sleep: +sleep.toFixed(1), stress: +stress.toFixed(1), condition: +condition.toFixed(1), steps: Math.round(avg("steps")) });
    }
    return out;
  }, [bio, s.sessions, s.today, s.weeklyGoal]);

  const view = weeks.slice(-range);
  const half = Math.floor(view.length / 2);
  const first = view.slice(0, half);
  const second = view.slice(half);
  const mean = (arr: typeof view, k: keyof (typeof view)[number]) => arr.reduce((a, x) => a + (x[k] as number), 0) / Math.max(1, arr.length);

  const cards = [
    { label: "주당 운동", icon: Dumbbell, unit: "회", now: mean(second, "sessions"), before: mean(first, "sessions"), good: true, d: 1 },
    { label: "평균 수면", icon: Moon, unit: "h", now: mean(second, "sleep"), before: mean(first, "sleep"), good: true, d: 1 },
    { label: "스트레스", icon: Zap, unit: "/10", now: mean(second, "stress"), before: mean(first, "stress"), good: false, d: 1 },
    { label: "일 걸음", icon: Footprints, unit: "보", now: mean(second, "steps"), before: mean(first, "steps"), good: true, d: 0 },
  ];

  const active = weeks.filter((w) => w.sessions >= 3);
  const lazy = weeks.filter((w) => w.sessions < 3);
  const condGap = mean(active, "condition") - mean(lazy, "condition");

  const body = [
    { label: "체중", unit: "kg", values: [80.1, 79.2, s.profile.weight], good: false },
    { label: "체지방률", unit: "%", values: [25.6, 24.8, s.profile.bodyFat], good: false },
    { label: "골격근량", unit: "kg", values: [32.6, 32.9, s.profile.muscle], good: true },
  ];

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="MY REPORT" title="내 변화 리포트" sub={`${toKey(addDays(s.today, -7 * range)).replaceAll("-", ".")} – 오늘`} back="/employee" />

      <Segmented className="w-full [&>button]:flex-1" value={range} onChange={setRange} options={[{ value: 4, label: "최근 4주" }, { value: 12, label: "최근 12주" }]} />

      <Card className="p-5">
        <SectionTitle title="웰니스 점수 추이" sub="주간 평균 · 행동 지표 기반" />
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={view} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} tick={{ fill: "#94A3B8", fontSize: 10 }} interval={range === 12 ? 2 : 0} />
              <YAxis {...axisProps} domain={[40, 100]} />
              <Tooltip content={<ChartTip unit="점" />} />
              <Line dataKey="score" name="웰니스 점수" stroke={SERIES.a} strokeWidth={2} dot={{ r: 3, fill: SERIES.a, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2.5">
        {cards.map((c) => {
          const Icon = c.icon;
          const diff = c.now - c.before;
          return (
            <Card key={c.label} className="p-4">
              <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500"><Icon className="h-3.5 w-3.5" />{c.label}</div>
              <div className="mt-1 text-[20px] font-bold tabular">
                {c.d ? c.now.toFixed(c.d) : Math.round(c.now).toLocaleString()}
                <span className="ml-0.5 text-[13px] font-semibold text-slate-400">{c.unit}</span>
              </div>
              <Delta value={c.d ? +diff.toFixed(1) : Math.round(diff)} digits={c.d} suffix={c.unit === "보" ? "보" : c.unit === "h" ? "h" : ""} higherIsBetter={c.good} />
              <span className="ml-1 text-[11px] text-slate-400">전반 대비</span>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <SectionTitle title="수면 · 스트레스" sub="주간 평균" />
        <div className="mb-2"><Legend items={[{ label: "수면(시간)", color: SERIES.a }, { label: "스트레스(/10)", color: SERIES.b }]} /></div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={view} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} tick={{ fill: "#94A3B8", fontSize: 10 }} interval={range === 12 ? 2 : 0} />
              <YAxis {...axisProps} domain={[3, 9]} />
              <Tooltip content={<ChartTip />} />
              <Line dataKey="sleep" name="수면" stroke={SERIES.a} strokeWidth={2} dot={false} />
              <Line dataKey="stress" name="스트레스" stroke={SERIES.b} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle title="체성분 변화" sub="인바디 연동 · 최근 3회 측정" />
        <div className="space-y-3">
          {body.map((b) => {
            const diff = b.values[2] - b.values[0];
            return (
              <div key={b.label} className="flex items-center justify-between">
                <span className="text-[14px] font-semibold">{b.label}</span>
                <span className="flex items-center gap-3 text-[13px] tabular text-slate-500">
                  {b.values.map((v, i) => (
                    <span key={i} className={i === 2 ? "text-[15px] font-bold text-ink" : ""}>{v}</span>
                  ))}
                  <Delta value={+diff.toFixed(1)} digits={1} suffix={b.unit} higherIsBetter={b.good} />
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="border-ai-100 p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] font-bold text-ai-700"><Sparkles className="h-4 w-4" /> AI가 발견한 나의 패턴</span>
          <AiTag label="개인 패턴 · 상관관계" />
        </div>
        <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-slate-700">
          <li>• 주 3회 이상 운동한 주에는 컨디션 자기평가가 평균 <b>{condGap > 0 ? "+" : ""}{condGap.toFixed(1)}점</b> 높았어요.</li>
          <li>• 점심 운동을 한 날은 저녁 운동한 날보다 결석이 적었어요.</li>
          <li>• 최근 2주 수면이 줄면서 저녁 운동 결석이 늘었어요. 수면 회복을 먼저 챙겨보세요.</li>
        </ul>
        <p className="mt-3 text-[11.5px] text-slate-400">개인 데이터의 동시 변화(상관관계)이며, 인과관계나 의학적 판단을 의미하지 않습니다.</p>
      </Card>

      <div className="flex gap-3 rounded-2xl bg-slate-100/80 p-4 text-[12.5px] leading-relaxed text-slate-600">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <div>
          <b className="text-ink">이 리포트는 나에게만 보입니다.</b> 회사에는 개인을 식별할 수 없는 부서·조직 단위 익명 집계만 전달되며, 최소 인원 미만 그룹은 공개되지 않습니다.
        </div>
      </div>
    </div>
  );
}
