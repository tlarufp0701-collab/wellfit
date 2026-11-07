import { addDays, startOfWeek, toKey, startOfDay, seeded } from "../format";

export type ExerciseType = "헬스" | "러닝" | "필라테스" | "요가" | "수영" | "크로스핏/F45" | "걷기" | "GX";
export type Slot = "morning" | "lunch" | "evening" | "weekend";

export const SLOT_LABEL: Record<Slot, string> = {
  morning: "출근 전",
  lunch: "점심시간",
  evening: "평일 저녁",
  weekend: "주말",
};

export const EXERCISE_TYPES: ExerciseType[] = ["헬스", "러닝", "필라테스", "요가", "수영", "크로스핏/F45", "걷기", "GX"];

export interface Session {
  id: string;
  date: string; // YYYY-MM-DD
  type: ExerciseType;
  slot: Slot;
  minutes: number;
  status: "done" | "missed";
  source: "qr" | "wearable" | "manual" | "app";
  facilityId?: string;
}

export interface Profile {
  name: string;
  age: number;
  gender: string;
  dept: string;
  company: string;
  height: number;
  weight: number;
  bodyFat: number;
  muscle: number;
  experience: string;
  preferred: ExerciseType[];
  social: "solo" | "group" | "both";
  pain: string[];
  lifestyle: string;
  availableSlots: Slot[];
  home: string;
  office: string;
}

export const DEFAULT_PROFILE: Profile = {
  name: "김지훈",
  age: 34,
  gender: "남성",
  dept: "개발본부",
  company: "한빛테크",
  height: 176,
  weight: 78.4,
  bodyFat: 24.1,
  muscle: 33.2,
  experience: "초급 · 꾸준한 운동 경력 1년 미만",
  preferred: ["헬스", "걷기", "필라테스"],
  social: "solo",
  pain: ["허리 (가벼운 불편)"],
  lifestyle: "평일 야근 주 2회 · 지하철 출퇴근 40분",
  availableSlots: ["lunch", "evening", "weekend"],
  home: "성동구 성수동",
  office: "강남구 역삼동",
};

type PlanItem = [day: number, type: ExerciseType, slot: Slot, status: "done" | "missed"];

/**
 * 주차별(0 = 이번 주, n = n주 전) 운동 기록 시나리오.
 * 시작(16주 전) → 지속 → 중단(9~8주 전) → 재시작(7주 전) → 지속 → 최근 평일 저녁 감소
 */
const WEEK_PLAN: Record<number, PlanItem[]> = {
  16: [[1, "헬스", "evening", "done"], [3, "헬스", "evening", "done"], [5, "러닝", "weekend", "done"]],
  15: [[0, "헬스", "evening", "done"], [2, "헬스", "evening", "done"], [4, "헬스", "evening", "done"]],
  14: [[0, "헬스", "evening", "done"], [2, "헬스", "evening", "done"], [3, "헬스", "evening", "missed"], [5, "러닝", "weekend", "done"]],
  13: [[1, "헬스", "evening", "done"], [2, "헬스", "evening", "done"], [4, "헬스", "evening", "done"], [6, "러닝", "weekend", "done"]],
  12: [[0, "헬스", "evening", "done"], [2, "헬스", "evening", "missed"], [3, "헬스", "evening", "done"], [5, "GX", "weekend", "done"]],
  11: [[1, "헬스", "evening", "done"], [3, "헬스", "evening", "missed"], [4, "헬스", "evening", "done"]],
  10: [[0, "헬스", "evening", "missed"], [2, "헬스", "evening", "done"], [4, "헬스", "evening", "missed"], [5, "러닝", "weekend", "done"]],
  9: [[1, "헬스", "evening", "done"], [3, "헬스", "evening", "missed"], [4, "헬스", "evening", "missed"]],
  8: [[1, "헬스", "evening", "missed"], [3, "헬스", "evening", "missed"]],
  7: [[1, "필라테스", "lunch", "done"], [3, "걷기", "lunch", "done"]],
  6: [[1, "필라테스", "lunch", "done"], [3, "걷기", "lunch", "done"], [5, "러닝", "weekend", "done"]],
  5: [[0, "헬스", "evening", "done"], [1, "필라테스", "lunch", "done"], [3, "필라테스", "lunch", "done"], [5, "러닝", "weekend", "done"]],
  4: [[1, "헬스", "evening", "done"], [2, "걷기", "lunch", "missed"], [3, "필라테스", "lunch", "done"], [4, "헬스", "evening", "done"]],
  3: [[0, "헬스", "evening", "done"], [1, "걷기", "lunch", "missed"], [2, "헬스", "evening", "done"], [3, "필라테스", "lunch", "done"], [5, "러닝", "weekend", "done"]],
  2: [[0, "헬스", "evening", "done"], [1, "걷기", "lunch", "done"], [3, "헬스", "evening", "missed"], [4, "필라테스", "lunch", "done"]],
  1: [[0, "헬스", "evening", "missed"], [1, "필라테스", "lunch", "done"], [2, "헬스", "evening", "missed"], [3, "걷기", "lunch", "done"], [4, "헬스", "evening", "missed"]],
  0: [[0, "걷기", "lunch", "done"], [1, "헬스", "evening", "missed"], [2, "필라테스", "lunch", "done"], [3, "헬스", "evening", "done"], [4, "헬스", "evening", "missed"]],
};

const MINUTES: Record<ExerciseType, number> = {
  헬스: 55, 러닝: 40, 필라테스: 50, 요가: 50, 수영: 45, "크로스핏/F45": 45, 걷기: 30, GX: 50,
};

const FACILITY_FOR: Partial<Record<ExerciseType, string>> = {
  헬스: "f1", 필라테스: "f2", 러닝: "f8", GX: "f6", 요가: "f3", 수영: "f4",
};

/** 오늘 기준으로 과거 기록 생성 (오늘 이전 날짜만) */
export function buildHistory(today: Date): Session[] {
  const t = startOfDay(today);
  const thisMonday = startOfWeek(t);
  const out: Session[] = [];
  for (const [wStr, items] of Object.entries(WEEK_PLAN)) {
    const w = Number(wStr);
    const monday = addDays(thisMonday, -7 * w);
    for (const [day, type, slot, status] of items) {
      const date = addDays(monday, day);
      if (date >= t) continue;
      out.push({
        id: `h_${toKey(date)}_${slot}`,
        date: toKey(date),
        type,
        slot,
        minutes: status === "done" ? MINUTES[type] : 0,
        status,
        source: type === "걷기" ? "wearable" : type === "러닝" ? "wearable" : "qr",
        facilityId: FACILITY_FOR[type],
      });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export interface DailyBio {
  date: string;
  sleep: number; // hours
  stress: number; // 1-10
  condition: number; // 1-5
  steps: number;
}

/** 수면/스트레스/컨디션 일별 시계열 (웨어러블 + 자기평가 mock). 최근 2주 수면 약 1시간 감소 */
export function buildBio(today: Date, days = 84): DailyBio[] {
  const rnd = seeded(20261107);
  const t = startOfDay(today);
  const out: DailyBio[] = [];
  for (let i = days; i >= 1; i--) {
    const d = addDays(t, -i);
    const recent = i <= 14;
    const mid = i <= 28 && i > 14;
    const baseSleep = recent ? 6.15 : mid ? 6.8 : 7.2;
    const baseStress = recent ? 6.1 : mid ? 5.0 : 4.2;
    const baseCond = recent ? 3.1 : mid ? 3.6 : 3.9;
    out.push({
      date: toKey(d),
      sleep: Math.round((baseSleep + (rnd() - 0.5) * 0.9) * 10) / 10,
      stress: Math.max(1, Math.min(10, Math.round(baseStress + (rnd() - 0.5) * 2.4))),
      condition: Math.max(1, Math.min(5, Math.round(baseCond + (rnd() - 0.5) * 1.6))),
      steps: Math.round((recent ? 6400 : 7800) + (rnd() - 0.5) * 3200),
    });
  }
  return out;
}

export interface CheckIn {
  date: string;
  sleep: number;
  stress: number;
  condition: number;
}
