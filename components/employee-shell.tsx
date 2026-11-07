"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Activity, Building2, Gift, Home, MapPin, Pause, Play, QrCode, Sparkles, Timer, Trophy, RotateCcw, LayoutDashboard } from "lucide-react";
import { AppLink, useNav } from "@/lib/nav";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/format";
import { EXERCISE_TYPES, SLOT_LABEL, type ExerciseType, type Slot } from "@/lib/data/employee";
import { FACILITIES } from "@/lib/data/catalog";
import { Button, Chip, Loader, Sheet, useToast } from "./ui";

const TABS = [
  { href: "/employee", label: "홈", icon: Home },
  { href: "/employee/ai-coach", label: "AI 코치", icon: Sparkles },
  { href: "/employee/activity", label: "활동", icon: Activity },
  { href: "/employee/facilities", label: "시설", icon: MapPin },
  { href: "/employee/rewards", label: "리워드", icon: Gift },
];

/* ------------------------- 운동 시작 플로우 ------------------------- */

interface WorkoutPreset {
  type: ExerciseType;
  slot: Slot;
  minutes: number;
  facilityId?: string;
  title?: string;
  nonce?: number;
}

const WorkoutCtx = createContext<(p?: WorkoutPreset) => void>(() => {});
export const useStartWorkout = () => useContext(WorkoutCtx);

function currentSlot(d: Date): Slot {
  const day = (d.getDay() + 6) % 7;
  if (day >= 5) return "weekend";
  const h = d.getHours();
  if (h < 10) return "morning";
  if (h < 15) return "lunch";
  return "evening";
}

function WorkoutSheet({ preset, onClose }: { preset: WorkoutPreset | null; onClose: () => void }) {
  if (!preset) return null;
  return <WorkoutFlow key={preset.nonce} preset={preset} onClose={onClose} />;
}

function WorkoutFlow({ preset, onClose }: { preset: WorkoutPreset; onClose: () => void }) {
  const { logWorkout } = useStore();
  const toast = useToast();
  const [step, setStep] = useState<"setup" | "running" | "finish" | "done">("setup");
  const [type, setType] = useState<ExerciseType>(preset.type);
  const [slot, setSlot] = useState<Slot>(preset.slot ?? currentSlot(new Date()));
  const [minutes, setMinutes] = useState(preset.minutes);
  const facilityId = preset.facilityId;
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [awards, setAwards] = useState<{ label: string; amount: number }[]>([]);
  const [method, setMethod] = useState<"qr" | "app">("app");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step !== "running" || paused) return;
    timer.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [step, paused]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const targetSec = minutes * 60;
  const facility = FACILITIES.find((f) => f.id === facilityId);

  const finish = () => {
    const recorded = Math.max(1, Math.round(elapsed / 60));
    setMinutes(elapsed >= 60 ? recorded : minutes);
    setStep("finish");
  };

  const save = () => {
    const got = logWorkout({ type, slot, minutes, facilityId, source: method === "qr" ? "qr" : "app" });
    setAwards(got);
    setStep("done");
    toast({ title: `+${got.reduce((s, a) => s + a.amount, 0)}P 적립`, desc: got.map((a) => a.label).join(" · ") });
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={step === "setup" ? "운동 시작하기" : step === "running" ? "운동 중" : step === "finish" ? "운동 기록 확인" : "기록 완료"}
      footer={
        step === "setup" ? (
          <Button size="lg" className="w-full" icon={<Play className="h-4 w-4" />} onClick={() => setStep("running")}>
            {minutes}분 운동 시작
          </Button>
        ) : step === "running" ? (
          <div className="flex gap-2">
            <Button size="lg" variant="secondary" className="w-28" icon={paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />} onClick={() => setPaused((p) => !p)}>
              {paused ? "계속" : "일시정지"}
            </Button>
            <Button size="lg" className="flex-1" onClick={finish}>
              운동 완료
            </Button>
          </div>
        ) : step === "finish" ? (
          <Button size="lg" className="w-full" onClick={save}>
            기록 저장하고 포인트 받기
          </Button>
        ) : (
          <Button size="lg" variant="dark" className="w-full" onClick={onClose}>
            확인
          </Button>
        )
      }
    >
      {step === "setup" && (
        <div className="space-y-5">
          {preset?.title && (
            <div className="rounded-2xl bg-ai-50 p-3.5 text-[13.5px] text-ai-700">
              <div className="flex items-center gap-1.5 font-semibold">
                <Sparkles className="h-4 w-4" /> AI 추천 운동
              </div>
              <div className="mt-1 text-ink">{preset.title}</div>
            </div>
          )}
          <div>
            <div className="mb-2 text-[13px] font-semibold text-slate-500">운동 종류</div>
            <div className="flex flex-wrap gap-2">
              {EXERCISE_TYPES.map((t) => (
                <Chip key={t} active={t === type} onClick={() => setType(t)}>
                  {t}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-[13px] font-semibold text-slate-500">시간대</div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SLOT_LABEL) as Slot[]).map((s) => (
                <Chip key={s} active={s === slot} onClick={() => setSlot(s)}>
                  {SLOT_LABEL[s]}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-[13px] font-semibold text-slate-500">
              <span>목표 시간</span>
              <span className="text-ink">{minutes}분</span>
            </div>
            <div className="flex gap-2">
              {[20, 30, 40, 50, 60].map((m) => (
                <Chip key={m} active={m === minutes} onClick={() => setMinutes(m)} className="flex-1">
                  {m}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-[13px] font-semibold text-slate-500">인증 방식</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMethod("qr")}
                className={cn("flex items-center gap-2 rounded-xl border p-3 text-left text-[13px]", method === "qr" ? "border-brand-600 bg-brand-50" : "border-slate-200")}
              >
                <QrCode className="h-5 w-5 text-brand-600" />
                <span>
                  <b className="block">시설 QR 출석</b>
                  <span className="text-slate-500">{facility ? facility.name.split(" ")[0] : "제휴시설"}</span>
                </span>
              </button>
              <button
                onClick={() => setMethod("app")}
                className={cn("flex items-center gap-2 rounded-xl border p-3 text-left text-[13px]", method === "app" ? "border-brand-600 bg-brand-50" : "border-slate-200")}
              >
                <Timer className="h-5 w-5 text-brand-600" />
                <span>
                  <b className="block">앱 타이머</b>
                  <span className="text-slate-500">걷기·러닝·홈트</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "running" && (
        <div className="flex flex-col items-center py-6">
          <div className="relative flex h-56 w-56 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" stroke="#EEF2F7" strokeWidth="6" fill="none" />
              <circle
                cx="50" cy="50" r="45" stroke="#2563EB" strokeWidth="6" fill="none" strokeLinecap="round"
                strokeDasharray={283} strokeDashoffset={283 * (1 - Math.min(1, elapsed / targetSec))}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div className="text-center">
              <div className="text-[44px] font-bold tabular tracking-tight">{mm}:{ss}</div>
              <div className="text-[13px] text-slate-500">목표 {minutes}분 · {type}</div>
            </div>
          </div>
          <p className="mt-5 text-center text-[13px] leading-relaxed text-slate-500">
            {paused ? "일시정지됨" : "화면을 꺼도 기록은 유지돼요."}
            <br />
            목표 시간 전에 끝내도 실제 운동 시간으로 기록할 수 있어요.
          </p>
        </div>
      )}

      {step === "finish" && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-[13px] text-slate-500">측정 시간</div>
            <div className="text-2xl font-bold tabular">{mm}:{ss}</div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-[13px] font-semibold text-slate-500">
              <span>기록할 운동 시간</span>
              <span className="text-ink">{minutes}분</span>
            </div>
            <div className="flex gap-2">
              {[Math.max(1, Math.round(elapsed / 60)), 20, 30, 40, 50].filter((v, i, a) => a.indexOf(v) === i).map((m) => (
                <Chip key={m} active={m === minutes} onClick={() => setMinutes(m)} className="flex-1">
                  {m}분
                </Chip>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 text-[13.5px]">
            <div className="flex justify-between"><span className="text-slate-500">운동</span><b>{type}</b></div>
            <div className="mt-1.5 flex justify-between"><span className="text-slate-500">시간대</span><b>{SLOT_LABEL[slot]}</b></div>
            <div className="mt-1.5 flex justify-between"><span className="text-slate-500">인증</span><b>{method === "qr" ? "시설 QR 출석" : "앱 타이머"}</b></div>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center py-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <Trophy className="h-8 w-8 text-emerald-600" />
          </div>
          <div className="mt-3 text-xl font-bold">오늘도 해냈어요!</div>
          <p className="mt-1 text-[13.5px] text-slate-500">{type} {minutes}분이 기록되었어요. AI 코치가 다음 추천에 반영합니다.</p>
          <div className="mt-5 w-full space-y-2">
            {awards.map((a) => (
              <div key={a.label} className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3 text-[14px]">
                <span className="font-medium text-slate-700">{a.label}</span>
                <b className="text-brand-700">+{a.amount}P</b>
              </div>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}

/* ------------------------------ Shell ------------------------------ */

export function EmployeeShell({ children }: { children: ReactNode }) {
  const { pathname } = useNav();
  const { hydrated, resetDemo } = useStore();
  const [preset, setPreset] = useState<WorkoutPreset | null>(null);
  const toast = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  const start = (p?: WorkoutPreset) => setPreset({ ...(p ?? { type: "걷기", slot: currentSlot(new Date()), minutes: 30 }), nonce: Date.now() });

  return (
    <WorkoutCtx.Provider value={start}>
      <div className="min-h-screen bg-[#eef0f4] lg:flex lg:items-start lg:justify-center lg:gap-10 lg:py-8">
        <aside className="no-print hidden w-72 shrink-0 pt-6 lg:block">
          <div className="flex items-center gap-2 text-[15px] font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white">W</span>
            WellFit 임직원 앱
          </div>
          <p className="mt-4 text-[13.5px] leading-relaxed text-slate-500">
            모바일 퍼스트 화면입니다. 휴대폰에서 열면 전체 화면으로, 홈 화면에 추가하면 앱처럼 실행됩니다.
          </p>
          <div className="mt-6 space-y-2">
            <AppLink href="/admin" className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-[14px] font-semibold shadow-card hover:bg-slate-50">
              <LayoutDashboard className="h-4 w-4 text-brand-600" /> 기업 관리자 대시보드
            </AppLink>
            <AppLink href="/employee/goals" className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-[14px] font-semibold shadow-card hover:bg-slate-50">
              <Trophy className="h-4 w-4 text-brand-600" /> 목표 · 챌린지
            </AppLink>
            <AppLink href="/employee/report" className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-[14px] font-semibold shadow-card hover:bg-slate-50">
              <Building2 className="h-4 w-4 text-brand-600" /> 내 변화 리포트
            </AppLink>
            <button
              onClick={() => {
                resetDemo();
                toast({ title: "데모 데이터를 초기화했어요", tone: "info" });
              }}
              className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-[13.5px] font-medium text-slate-500 hover:bg-white"
            >
              <RotateCcw className="h-4 w-4" /> 데모 데이터 초기화
            </button>
          </div>
        </aside>

        <div
          ref={scrollRef}
          className="no-scrollbar relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-canvas lg:mx-0 lg:h-[min(880px,calc(100vh-64px))] lg:min-h-0 lg:overflow-y-auto lg:rounded-[36px] lg:border lg:border-slate-200 lg:shadow-float"
        >
          <main className="flex-1 px-5 pb-6 pt-[calc(env(safe-area-inset-top)+16px)]">{hydrated ? children : <Loader />}</main>

          <nav className="no-print sticky bottom-0 z-40 w-full px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2">
            <div className="flex items-center justify-between rounded-[26px] border border-slate-200/80 bg-white/95 px-2 py-1.5 shadow-float backdrop-blur">
              {TABS.map(({ href, label, icon: Icon }) => {
                const active = href === "/employee" ? pathname === "/employee" || pathname === "/employee/goals" || pathname === "/employee/report" : pathname.startsWith(href);
                return (
                  <AppLink
                    key={href}
                    href={href}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-semibold transition",
                      active ? "bg-brand-50 text-brand-600" : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} />
                    {label}
                  </AppLink>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
      <WorkoutSheet preset={preset} onClose={() => setPreset(null)} />
    </WorkoutCtx.Provider>
  );
}
