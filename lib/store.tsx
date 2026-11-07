"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { addDays, startOfWeek, toKey, uid } from "./format";
import {
  buildBio, buildHistory, DEFAULT_PROFILE,
  type CheckIn, type ExerciseType, type Profile, type Session, type Slot,
} from "./data/employee";
import { REWARD_ITEMS } from "./data/catalog";
import { analyze, type AdjustKey, type CoachAnalysis } from "./ai/coach";
import { DEFAULT_ROI, type FacilityDecision, type RoiInputs } from "./ai/insights";
import { COMPANY } from "./data/company";

export interface LedgerEntry {
  id: string;
  date: string;
  label: string;
  amount: number;
}

export interface Redemption {
  id: string;
  itemId: string;
  date: string;
  code: string;
  status: "사용 가능" | "사용 완료";
}

export interface Booking {
  id: string;
  facilityId: string;
  date: string;
  label: string;
}

export interface Mission {
  acceptedAt: string;
  baseDone: number;
  need: number;
  completed: boolean;
}

export type ActionStatus = "제안" | "검토 중" | "실행 예정" | "보류";

export interface PilotFeedback {
  use?: string;
  metrics: string[];
  continueIntent?: string;
  priceFit?: string;
  comment: string;
  submittedAt?: string;
}

interface PersistedState {
  v: 1;
  profile: Profile;
  userSessions: Session[];
  points: number;
  ledger: LedgerEntry[];
  weeklyGoal: number;
  preferredSlot: Slot;
  adjustments: Partial<Record<AdjustKey, boolean>>;
  checkIn: CheckIn | null;
  recIndex: number;
  redemptions: Redemption[];
  wishlist: string;
  joinedChallenges: string[];
  mission: Mission | null;
  favorites: string[];
  bookings: Booking[];
  awarded: string[];
  actionStatus: Record<string, ActionStatus>;
  facilityOverrides: Record<string, FacilityDecision>;
  roi: RoiInputs;
  minGroup: number;
  pilotWeeks: 8 | 12;
  pilotFeedback: PilotFeedback;
}

const STORAGE_KEY = "wellfit.v1";

function initialState(today: Date): PersistedState {
  const k = (n: number) => toKey(addDays(today, -n));
  return {
    v: 1,
    profile: DEFAULT_PROFILE,
    userSessions: [],
    points: 2250,
    ledger: [
      { id: "l1", date: k(2), label: "운동 1회 인증 · 헬스", amount: 50 },
      { id: "l2", date: k(4), label: "운동 1회 인증 · 필라테스", amount: 50 },
      { id: "l3", date: k(5), label: "운동 1회 인증 · 걷기", amount: 50 },
      { id: "l4", date: k(13), label: "주간 목표 달성", amount: 200 },
      { id: "l5", date: k(20), label: "재참여 후 4주 지속", amount: 700 },
      { id: "l6", date: k(31), label: "카페 쿠폰 교환", amount: -600 },
      { id: "l7", date: k(47), label: "중단 후 다시 시작", amount: 300 },
      { id: "l8", date: k(85), label: "4주 연속 지속", amount: 500 },
    ],
    weeklyGoal: 4,
    preferredSlot: "evening",
    adjustments: {},
    checkIn: { date: toKey(today), sleep: 6.8, stress: 4, condition: 4 },
    recIndex: 0,
    redemptions: [{ id: "rd0", itemId: "r5", date: k(31), code: "WF-CAFE-8241", status: "사용 완료" }],
    wishlist: "r7",
    joinedChallenges: ["c1", "c2"],
    mission: null,
    favorites: ["f2"],
    bookings: [],
    awarded: [],
    actionStatus: {},
    facilityOverrides: {},
    roi: DEFAULT_ROI,
    minGroup: COMPANY.minGroupDefault,
    pilotWeeks: 8,
    pilotFeedback: { metrics: [], comment: "" },
  };
}

export interface Award {
  label: string;
  amount: number;
}

interface StoreValue extends PersistedState {
  hydrated: boolean;
  today: Date;
  sessions: Session[];
  analysis: CoachAnalysis;
  effectiveGoal: number;
  logWorkout: (w: { type: ExerciseType; slot: Slot; minutes: number; facilityId?: string; source?: Session["source"] }) => Award[];
  saveCheckIn: (c: Omit<CheckIn, "date">) => void;
  redeem: (itemId: string) => Redemption | null;
  markCouponUsed: (id: string) => void;
  setWishlist: (id: string) => void;
  setWeeklyGoal: (n: number) => void;
  toggleAdjustment: (k: AdjustKey) => void;
  setPreferredSlot: (s: Slot) => void;
  nextRecommendation: () => void;
  toggleChallenge: (id: string) => void;
  acceptMission: () => void;
  toggleFavorite: (id: string) => void;
  book: (facilityId: string, label: string, date: string) => void;
  cancelBooking: (id: string) => void;
  updateProfile: (p: Partial<Profile>) => void;
  setActionStatus: (id: string, s: ActionStatus) => void;
  setFacilityOverride: (id: string, d: FacilityDecision | null) => void;
  setRoi: (r: Partial<RoiInputs>) => void;
  setMinGroup: (n: number) => void;
  setPilotWeeks: (w: 8 | 12) => void;
  setPilotFeedback: (f: Partial<PilotFeedback>) => void;
  resetDemo: () => void;
}

const StoreCtx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const today = useMemo(() => new Date(), []);
  const [state, setState] = useState<PersistedState>(() => initialState(today));
  const [hydrated, setHydrated] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        if (parsed.v === 1) {
          // 체크인은 하루 단위로 초기화
          if (parsed.checkIn && parsed.checkIn.date !== toKey(today)) parsed.checkIn = null;
          // localStorage는 클라이언트에서만 읽을 수 있어 마운트 후 1회 동기화한다.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setState({ ...initialState(today), ...parsed });
        }
      }
    } catch {
      /* 저장소 접근 불가 시 기본값으로 동작 */
    }
    loaded.current = true;
    setHydrated(true);
  }, [today]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* noop */
    }
  }, [state]);

  const history = useMemo(() => buildHistory(today), [today]);
  const bio = useMemo(() => buildBio(today), [today]);
  const sessions = useMemo(
    () => [...history, ...state.userSessions].sort((a, b) => a.date.localeCompare(b.date)),
    [history, state.userSessions],
  );
  const effectiveGoal = state.adjustments.goal ? Math.max(2, state.weeklyGoal - 1) : state.weeklyGoal;

  const analysis = useMemo(
    () =>
      analyze({
        profile: state.profile,
        sessions,
        bio,
        checkIn: state.checkIn,
        weeklyGoal: state.weeklyGoal,
        preferredSlot: state.adjustments.slot ? "lunch" : state.preferredSlot,
        adjustments: state.adjustments,
        today,
      }),
    [state.profile, sessions, bio, state.checkIn, state.weeklyGoal, state.preferredSlot, state.adjustments, today],
  );

  const addLedger = (s: PersistedState, label: string, amount: number): PersistedState => ({
    ...s,
    points: s.points + amount,
    ledger: [{ id: uid("l"), date: toKey(new Date()), label, amount }, ...s.ledger],
  });

  const logWorkout: StoreValue["logWorkout"] = useCallback(
    (w) => {
      const awards: Award[] = [];
      setState((prev) => {
        const session: Session = {
          id: uid("s"), date: toKey(today), type: w.type, slot: w.slot, minutes: w.minutes,
          status: "done", source: w.source ?? "app", facilityId: w.facilityId,
        };
        let next: PersistedState = { ...prev, userSessions: [...prev.userSessions, session] };
        next = addLedger(next, `운동 1회 인증 · ${w.type}`, 50);
        awards.push({ label: "운동 1회 인증", amount: 50 });

        const monday = toKey(startOfWeek(today));
        const all = [...history, ...next.userSessions];
        const weekDone = all.filter((s) => s.status === "done" && s.date >= monday).length;
        const goal = next.adjustments.goal ? Math.max(2, next.weeklyGoal - 1) : next.weeklyGoal;
        const wkKey = `goal-${monday}`;
        if (weekDone >= goal && !next.awarded.includes(wkKey)) {
          next = addLedger({ ...next, awarded: [...next.awarded, wkKey] }, "주간 목표 달성", 200);
          awards.push({ label: "주간 목표 달성", amount: 200 });
        }
        if (next.mission && !next.mission.completed) {
          const totalDone = all.filter((s) => s.status === "done").length;
          if (totalDone - next.mission.baseDone >= next.mission.need) {
            next = addLedger({ ...next, mission: { ...next.mission, completed: true } }, "AI 추천 미션 달성", 300);
            awards.push({ label: "AI 추천 미션 달성", amount: 300 });
          }
        }
        return next;
      });
      return awards;
    },
    [today, history],
  );

  const value: StoreValue = {
    ...state,
    hydrated,
    today,
    sessions,
    analysis,
    effectiveGoal,
    logWorkout,
    saveCheckIn: (c) =>
      setState((s) => {
        const key = `checkin-${toKey(today)}`;
        let next: PersistedState = { ...s, checkIn: { ...c, date: toKey(today) } };
        if (!s.awarded.includes(key)) next = addLedger({ ...next, awarded: [...s.awarded, key] }, "오늘의 컨디션 체크인", 10);
        return next;
      }),
    redeem: (itemId) => {
      const item = REWARD_ITEMS.find((i) => i.id === itemId);
      if (!item || state.points < item.price) return null;
      const code = `WF-${item.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const r: Redemption = { id: uid("rd"), itemId, date: toKey(new Date()), code, status: "사용 가능" };
      setState((s) => addLedger({ ...s, redemptions: [r, ...s.redemptions] }, `${item.name} 교환`, -item.price));
      return r;
    },
    markCouponUsed: (id) =>
      setState((s) => ({ ...s, redemptions: s.redemptions.map((r) => (r.id === id ? { ...r, status: "사용 완료" } : r)) })),
    setWishlist: (id) => setState((s) => ({ ...s, wishlist: id })),
    setWeeklyGoal: (n) => setState((s) => ({ ...s, weeklyGoal: n, adjustments: { ...s.adjustments, goal: false } })),
    toggleAdjustment: (k) => setState((s) => ({ ...s, adjustments: { ...s.adjustments, [k]: !s.adjustments[k] } })),
    setPreferredSlot: (slot) => setState((s) => ({ ...s, preferredSlot: slot })),
    nextRecommendation: () => setState((s) => ({ ...s, recIndex: s.recIndex + 1 })),
    toggleChallenge: (id) =>
      setState((s) => ({
        ...s,
        joinedChallenges: s.joinedChallenges.includes(id) ? s.joinedChallenges.filter((x) => x !== id) : [...s.joinedChallenges, id],
      })),
    acceptMission: () =>
      setState((s) => {
        const totalDone = sessions.filter((x) => x.status === "done").length;
        const thisWeek = analysis.activity.thisWeek;
        return { ...s, mission: { acceptedAt: toKey(today), baseDone: totalDone, need: thisWeek >= 3 ? 2 : 3 - thisWeek, completed: false } };
      }),
    toggleFavorite: (id) =>
      setState((s) => ({ ...s, favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [...s.favorites, id] })),
    book: (facilityId, label, date) =>
      setState((s) => ({ ...s, bookings: [{ id: uid("b"), facilityId, label, date }, ...s.bookings] })),
    cancelBooking: (id) => setState((s) => ({ ...s, bookings: s.bookings.filter((b) => b.id !== id) })),
    updateProfile: (p) => setState((s) => ({ ...s, profile: { ...s.profile, ...p } })),
    setActionStatus: (id, st) => setState((s) => ({ ...s, actionStatus: { ...s.actionStatus, [id]: st } })),
    setFacilityOverride: (id, d) =>
      setState((s) => {
        const o = { ...s.facilityOverrides };
        if (d) o[id] = d;
        else delete o[id];
        return { ...s, facilityOverrides: o };
      }),
    setRoi: (r) => setState((s) => ({ ...s, roi: { ...s.roi, ...r } })),
    setMinGroup: (n) => setState((s) => ({ ...s, minGroup: n })),
    setPilotWeeks: (w) => setState((s) => ({ ...s, pilotWeeks: w })),
    setPilotFeedback: (f) => setState((s) => ({ ...s, pilotFeedback: { ...s.pilotFeedback, ...f } })),
    resetDemo: () => {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* noop */
      }
      setState(initialState(today));
    },
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const v = useContext(StoreCtx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
