"use client";

import { useState } from "react";
import { Check, Gift, Lock, Sparkles, Star, Ticket, Coffee, Shirt, Dumbbell, Footprints, GlassWater, CupSoda } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn, fmtDate, num } from "@/lib/format";
import { EARN_RULES, REWARD_ITEMS, CHALLENGES, type RewardItem } from "@/lib/data/catalog";
import { Badge, Button, Card, Progress, SectionTitle, Segmented, Sheet, useToast, type Tone } from "@/components/ui";
import { PageHeader } from "./shared";

const STAGE_TONE: Record<string, Tone> = { 시작: "blue", 지속: "green", 재참여: "purple", 목표달성: "orange", 팀: "gray" };
const ITEM_ICON: Record<string, typeof Gift> = {
  r1: Footprints, r2: GlassWater, r3: Shirt, r4: CupSoda, r5: Coffee, r6: Ticket, r7: Dumbbell, r8: Sparkles,
};

export default function Rewards() {
  const s = useStore();
  const a = s.analysis.activity;
  const toast = useToast();
  const [tab, setTab] = useState<"earn" | "shop" | "coupon" | "history">("earn");
  const [confirm, setConfirm] = useState<RewardItem | null>(null);
  const [issued, setIssued] = useState<{ name: string; code: string } | null>(null);

  const restartMilestone = a.timeline.some((e) => e.kind === "milestone" && e.title.includes("재참여"));
  const teamProgress = CHALLENGES.find((c) => c.id === "c2")!.progress;
  const ruleStatus: Record<string, { state: "done" | "progress" | "open"; text: string; pct?: number }> = {
    e1: { state: "open", text: `누적 ${a.totalDone}회 인증` },
    e2: a.thisWeek >= s.effectiveGoal ? { state: "done", text: "이번 주 달성!" } : { state: "progress", text: `이번 주 ${a.thisWeek}/${s.effectiveGoal}회`, pct: (a.thisWeek / s.effectiveGoal) * 100 },
    e3: a.streakWeeks >= 4 ? { state: "done", text: "달성 완료" } : { state: "progress", text: `${a.streakWeeks}/4주`, pct: (a.streakWeeks / 4) * 100 },
    e4: a.streakWeeks >= 12 ? { state: "done", text: "달성 완료" } : { state: "progress", text: `${a.streakWeeks}/12주`, pct: (a.streakWeeks / 12) * 100 },
    e5: a.restarts > 0 ? { state: "done", text: `${a.restarts}회 달성` } : { state: "open", text: "쉬었다가 돌아오면 보상" },
    e6: restartMilestone ? { state: "done", text: "달성 완료" } : { state: "open", text: "재시작 후 4주 유지" },
    e7: { state: "progress", text: `부서 챌린지 ${teamProgress}%`, pct: teamProgress },
  };

  const mission = s.mission;
  const totalDone = s.sessions.filter((x) => x.status === "done").length;
  const missionProgress = mission ? Math.min(mission.need, totalDone - mission.baseDone) : 0;
  const missionNeed = a.thisWeek >= 3 ? 2 : 3 - a.thisWeek;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="REWARDS" title="리워드" sub="시작하고, 이어가고, 다시 돌아오는 모든 순간을 보상해요." />

      <div className="rounded-3xl bg-ink p-5 text-white">
        <div className="flex items-center justify-between text-[13px] text-slate-400">
          사용 가능한 포인트
          <Star className="h-5 w-5 text-slate-300" />
        </div>
        <div className="mt-2 text-[36px] font-bold tabular tracking-tight">{num(s.points)}P</div>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-[12px]">
          <div>
            <div className="text-slate-400">이번 달 적립</div>
            <div className="mt-0.5 font-semibold tabular">
              +{num(s.ledger.filter((l) => l.amount > 0 && l.date.slice(0, 7) === fmtDate(s.today, "ymd").slice(0, 7).replace(".", "-")).reduce((x, l) => x + l.amount, 0))}P
            </div>
          </div>
          <div>
            <div className="text-slate-400">교환 완료</div>
            <div className="mt-0.5 font-semibold tabular">{s.redemptions.length}건</div>
          </div>
          <div>
            <div className="text-slate-400">사용 가능 쿠폰</div>
            <div className="mt-0.5 font-semibold tabular">{s.redemptions.filter((r) => r.status === "사용 가능").length}장</div>
          </div>
        </div>
      </div>

      {/* AI 미션 */}
      <Card className="border-ai-100 p-5">
        <div className="flex items-center gap-2 text-[13px] font-bold text-ai-700">
          <Sparkles className="h-4 w-4" /> AI 추천 미션
        </div>
        <p className="mt-2 text-[15px] font-semibold leading-relaxed">
          {mission
            ? mission.completed
              ? "미션 성공! 추가 300P가 적립되었어요."
              : `최근 운동 횟수가 줄었습니다. 앞으로 ${mission.need}회 더 참여하면 추가 300P`
            : a.thisWeek >= 3
              ? `최근 운동 횟수가 줄었습니다. 7일 안에 ${missionNeed}회 더 참여하면 추가 300P`
              : "최근 운동 횟수가 줄었습니다. 이번 주 3회 참여하면 추가 300P"}
        </p>
        {mission && !mission.completed ? (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[12.5px] text-slate-500">
              <span>진행</span>
              <span className="tabular">{missionProgress}/{mission.need}회</span>
            </div>
            <Progress value={(missionProgress / mission.need) * 100} tone="purple" />
          </div>
        ) : !mission ? (
          <Button
            variant="ai" size="md" className="mt-3 w-full"
            onClick={() => {
              s.acceptMission();
              toast({ title: "미션을 시작했어요", desc: "운동을 기록하면 자동으로 진행돼요" });
            }}
          >
            미션 수락하기
          </Button>
        ) : null}
      </Card>

      <Segmented
        className="w-full [&>button]:flex-1"
        value={tab}
        onChange={setTab}
        options={[
          { value: "earn", label: "적립" },
          { value: "shop", label: "리워드 샵" },
          { value: "coupon", label: "쿠폰함" },
          { value: "history", label: "내역" },
        ]}
      />

      {tab === "earn" && (
        <div className="space-y-2.5">
          {EARN_RULES.map((r) => {
            const st = ruleStatus[r.id];
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", st.state === "done" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500")}>
                    {st.state === "done" ? <Check className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14.5px] font-bold">{r.label}</span>
                      <Badge tone={STAGE_TONE[r.stage]}>{r.stage}</Badge>
                    </div>
                    <div className="text-[12.5px] text-slate-500">{st.text}</div>
                  </div>
                  <span className="text-[15px] font-bold tabular text-brand-700">+{num(r.points)}P</span>
                </div>
                {st.pct !== undefined && st.state === "progress" && <Progress value={st.pct} className="mt-3 h-1.5" />}
              </Card>
            );
          })}
        </div>
      )}

      {tab === "shop" && (
        <div className="grid grid-cols-2 gap-2.5">
          {REWARD_ITEMS.map((item) => {
            const Icon = ITEM_ICON[item.id] ?? Gift;
            const can = s.points >= item.price;
            const isWish = s.wishlist === item.id;
            return (
              <Card key={item.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50">
                    <Icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <button
                    aria-label="목표 리워드로 설정"
                    onClick={() => {
                      s.setWishlist(item.id);
                      toast({ title: `'${item.name}'을(를) 목표 리워드로 설정했어요`, tone: "info" });
                    }}
                  >
                    <Star className={cn("h-5 w-5", isWish ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
                  </button>
                </div>
                <div className="mt-3 text-[14.5px] font-bold">{item.name}</div>
                <div className="mt-0.5 flex-1 text-[12px] leading-snug text-slate-500">{item.desc}</div>
                <div className="mt-3 text-[15px] font-bold tabular">{num(item.price)}P</div>
                <Button size="sm" variant={can ? "primary" : "secondary"} disabled={!can} className="mt-2 w-full" icon={can ? undefined : <Lock className="h-3.5 w-3.5" />} onClick={() => setConfirm(item)}>
                  {can ? "교환하기" : `${num(item.price - s.points)}P 부족`}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "coupon" && (
        <div className="space-y-2.5">
          {s.redemptions.length === 0 && <Card className="p-6 text-center text-[14px] text-slate-500">아직 교환한 리워드가 없어요.</Card>}
          {s.redemptions.map((r) => {
            const item = REWARD_ITEMS.find((i) => i.id === r.itemId)!;
            const used = r.status === "사용 완료";
            return (
              <Card key={r.id} className={cn("p-4", used && "opacity-60")}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[15px] font-bold">{item.name}</div>
                    <div className="text-[12px] text-slate-500">{fmtDate(r.date, "ymd")} 교환 · 유효기간 90일</div>
                  </div>
                  <Badge tone={used ? "gray" : "green"}>{r.status}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-slate-300 px-3 py-2.5">
                  <Barcode code={r.code} />
                  <span className="font-mono text-[13px] font-semibold tracking-wider">{r.code}</span>
                </div>
                {!used && (
                  <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={() => { s.markCouponUsed(r.id); toast({ title: "쿠폰을 사용 처리했어요" }); }}>
                    사용 완료로 표시
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tab === "history" && (
        <Card className="divide-y divide-slate-100 px-4">
          {s.ledger.map((l) => (
            <div key={l.id} className="flex items-center justify-between py-3.5">
              <div>
                <div className="text-[14px] font-semibold">{l.label}</div>
                <div className="text-[12px] text-slate-400">{fmtDate(l.date, "ymd")}</div>
              </div>
              <span className={cn("text-[15px] font-bold tabular", l.amount > 0 ? "text-brand-700" : "text-slate-500")}>
                {l.amount > 0 ? "+" : ""}{num(l.amount)}P
              </span>
            </div>
          ))}
        </Card>
      )}

      <SectionTitle title="왜 이렇게 보상하나요?" className="pt-2" />
      <p className="-mt-1 text-[13px] leading-relaxed text-slate-500">
        단순 출석보다 <b className="text-ink">시작 · 지속 · 재참여 · 목표달성</b>에 더 큰 보상을 줘요. 쉬었다가 돌아오는 것도 칭찬받을 일이니까요.
      </p>

      <Sheet
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="리워드 교환"
        footer={
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              if (!confirm) return;
              const r = s.redeem(confirm.id);
              if (r) {
                setIssued({ name: confirm.name, code: r.code });
                toast({ title: `${confirm.name} 교환 완료`, desc: `-${num(confirm.price)}P` });
              }
              setConfirm(null);
            }}
          >
            {confirm ? `${num(confirm.price)}P로 교환` : ""}
          </Button>
        }
      >
        {confirm && (
          <div className="space-y-3 text-[14px]">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-[16px] font-bold">{confirm.name}</div>
              <div className="text-slate-500">{confirm.desc}</div>
            </div>
            <div className="flex justify-between"><span className="text-slate-500">보유 포인트</span><b className="tabular">{num(s.points)}P</b></div>
            <div className="flex justify-between"><span className="text-slate-500">차감</span><b className="tabular">-{num(confirm.price)}P</b></div>
            <div className="flex justify-between border-t border-slate-100 pt-3"><span className="text-slate-500">교환 후</span><b className="tabular">{num(s.points - confirm.price)}P</b></div>
          </div>
        )}
      </Sheet>

      <Sheet open={!!issued} onClose={() => setIssued(null)} title="쿠폰이 발급되었어요" footer={<Button size="lg" variant="dark" className="w-full" onClick={() => { setIssued(null); setTab("coupon"); }}>쿠폰함에서 보기</Button>}>
        {issued && (
          <div className="flex flex-col items-center py-4 text-center">
            <Ticket className="h-10 w-10 text-brand-600" />
            <div className="mt-2 text-[17px] font-bold">{issued.name}</div>
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 font-mono text-[15px] font-semibold tracking-wider">{issued.code}</div>
            <p className="mt-3 text-[12.5px] text-slate-500">굿즈는 사내 웰니스 라운지에서, 체험권은 제휴시설에서 코드를 보여주세요.</p>
          </div>
        )}
      </Sheet>
    </div>
  );
}

function Barcode({ code }: { code: string }) {
  const bars = code.split("").flatMap((ch) => {
    const n = ch.charCodeAt(0);
    return [1 + (n % 3), 1 + ((n >> 2) % 2)];
  });
  const xs = bars.reduce<number[]>((acc, w, i) => [...acc, i === 0 ? 0 : acc[i - 1] + bars[i - 1] + 1], []);
  return (
    <svg width="96" height="28" aria-hidden>
      {bars.map((w, i) => (i % 2 === 0 ? <rect key={i} x={xs[i]} y={0} width={w} height={28} fill="#0F172A" /> : null))}
    </svg>
  );
}
