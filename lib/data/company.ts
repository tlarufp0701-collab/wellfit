import { seeded } from "../format";

export const COMPANY = {
  name: "한빛테크",
  employees: 1240,
  eligible: 1180,
  quarterLabel: "2026년 4분기",
  minGroupDefault: 10,
};

export type Period = "month" | "quarter" | "half" | "year";
export const PERIOD_LABEL: Record<Period, string> = { month: "월", quarter: "분기", half: "반기", year: "연간" };
export const PERIOD_COMPARE: Record<Period, string> = {
  month: "전월 대비",
  quarter: "전분기 대비",
  half: "전반기 대비",
  year: "도입 전 대비",
};

export type KpiKey = "usage" | "start" | "ret4" | "ret12" | "drop" | "reeng" | "goal";
export const KPI_META: Record<KpiKey, { label: string; higherIsBetter: boolean; desc: string }> = {
  usage: { label: "복지 이용률", higherIsBetter: true, desc: "복지 대상자 중 1회 이상 이용" },
  start: { label: "운동 시작률", higherIsBetter: true, desc: "대상자 중 첫 운동 인증" },
  ret4: { label: "4주 지속률", higherIsBetter: true, desc: "시작자 중 4주 연속 주 2회+" },
  ret12: { label: "12주 지속률", higherIsBetter: true, desc: "시작자 중 12주 유지" },
  drop: { label: "중단률", higherIsBetter: false, desc: "시작 후 10일+ 미활동" },
  reeng: { label: "재참여율", higherIsBetter: true, desc: "중단자 중 다시 시작" },
  goal: { label: "목표 달성률", higherIsBetter: true, desc: "개인 주간 목표 달성 비율" },
};
export const KPI_ORDER: KpiKey[] = ["usage", "start", "ret4", "ret12", "drop", "reeng", "goal"];

type KpiSet = Record<KpiKey, number>;

export const PERIOD_KPIS: Record<Period, { current: KpiSet; previous: KpiSet }> = {
  month: {
    current: { usage: 77, start: 63, ret4: 57, ret12: 48, drop: 15, reeng: 29, goal: 72 },
    previous: { usage: 75, start: 62, ret4: 59, ret12: 47, drop: 14, reeng: 27, goal: 70 },
  },
  quarter: {
    current: { usage: 76, start: 62, ret4: 58, ret12: 48, drop: 14, reeng: 28, goal: 71 },
    previous: { usage: 68, start: 57, ret4: 56, ret12: 45, drop: 17, reeng: 24, goal: 67 },
  },
  half: {
    current: { usage: 74, start: 60, ret4: 57, ret12: 46, drop: 15, reeng: 27, goal: 69 },
    previous: { usage: 64, start: 52, ret4: 51, ret12: 41, drop: 19, reeng: 21, goal: 62 },
  },
  year: {
    current: { usage: 71, start: 57, ret4: 55, ret12: 44, drop: 16, reeng: 25, goal: 67 },
    previous: { usage: 49, start: 36, ret4: 41, ret12: 30, drop: 24, reeng: 12, goal: 54 },
  },
};

export type DeptName = "경영지원" | "마케팅" | "개발" | "영업" | "상품기획" | "고객센터";
export const DEPTS: DeptName[] = ["경영지원", "마케팅", "개발", "영업", "상품기획", "고객센터"];

export interface DeptStat {
  name: DeptName;
  headcount: number;
  usage: number;
  start: number;
  ret4: number;
  ret12: number;
  drop: number;
  reeng: number;
  goal: number;
  wellness: number;
  stress: number; // 1-10 자기평가 평균
  sleep: number; // 시간
  vitality: number; // 업무활력 0-100
  presenteeism: number; // 위험군 %
  stressTrend: number[]; // 최근 6주
  prev: { usage: number; ret4: number; ret12: number; reeng: number; stress: number; wellness: number };
  ages: [number, number, number, number]; // 20대, 30대, 40대, 50대+
}

export const DEPT_STATS: DeptStat[] = [
  {
    name: "경영지원", headcount: 96, usage: 81, start: 68, ret4: 64, ret12: 54, drop: 11, reeng: 31, goal: 74,
    wellness: 74, stress: 4.8, sleep: 6.9, vitality: 71, presenteeism: 15, stressTrend: [4.9, 5.0, 4.8, 4.7, 4.9, 4.8],
    prev: { usage: 74, ret4: 61, ret12: 50, reeng: 27, stress: 5.0, wellness: 71 }, ages: [8, 38, 32, 18],
  },
  {
    name: "마케팅", headcount: 128, usage: 78, start: 63, ret4: 59, ret12: 49, drop: 13, reeng: 27, goal: 70,
    wellness: 68, stress: 6.4, sleep: 6.4, vitality: 64, presenteeism: 22, stressTrend: [5.1, 5.2, 5.1, 5.6, 6.0, 6.4],
    prev: { usage: 70, ret4: 58, ret12: 47, reeng: 25, stress: 5.2, wellness: 70 }, ages: [42, 54, 28, 4],
  },
  {
    name: "개발", headcount: 342, usage: 72, start: 58, ret4: 49, ret12: 41, drop: 18, reeng: 24, goal: 66,
    wellness: 66, stress: 5.9, sleep: 6.2, vitality: 62, presenteeism: 21, stressTrend: [5.4, 5.6, 5.7, 5.8, 5.9, 5.9],
    prev: { usage: 66, ret4: 60, ret12: 44, reeng: 22, stress: 5.5, wellness: 68 }, ages: [118, 164, 52, 8],
  },
  {
    name: "영업", headcount: 214, usage: 74, start: 61, ret4: 60, ret12: 50, drop: 13, reeng: 29, goal: 72,
    wellness: 70, stress: 5.3, sleep: 6.7, vitality: 68, presenteeism: 17, stressTrend: [5.5, 5.4, 5.4, 5.3, 5.2, 5.3],
    prev: { usage: 66, ret4: 56, ret12: 46, reeng: 24, stress: 5.6, wellness: 67 }, ages: [46, 88, 58, 22],
  },
  {
    name: "상품기획", headcount: 88, usage: 86, start: 72, ret4: 68, ret12: 59, drop: 9, reeng: 34, goal: 79,
    wellness: 77, stress: 4.6, sleep: 7.0, vitality: 74, presenteeism: 12, stressTrend: [4.9, 4.8, 4.7, 4.7, 4.6, 4.6],
    prev: { usage: 78, ret4: 63, ret12: 52, reeng: 30, stress: 4.9, wellness: 73 }, ages: [21, 39, 22, 6],
  },
  {
    name: "고객센터", headcount: 372, usage: 75, start: 62, ret4: 61, ret12: 48, drop: 14, reeng: 30, goal: 71,
    wellness: 69, stress: 5.6, sleep: 6.5, vitality: 66, presenteeism: 18, stressTrend: [6.0, 5.9, 5.8, 5.7, 5.6, 5.6],
    prev: { usage: 65, ret4: 54, ret12: 43, reeng: 23, stress: 6.0, wellness: 65 }, ages: [148, 132, 66, 26],
  },
];

export const AGE_BANDS = ["20대", "30대", "40대", "50대+"] as const;
const AGE_OFFSET = { usage: [3, -2, 0, -4], reeng: [4, -6, 2, 1], ret4: [-2, -3, 3, 4] };

/** 부서 × 연령 교차 셀 (최소 인원 미만은 화면에서 비공개 처리) */
export function crossCells(metric: "usage" | "reeng" | "ret4") {
  const rnd = seeded(77);
  return DEPT_STATS.map((d) => ({
    dept: d.name,
    cells: d.ages.map((n, i) => ({
      band: AGE_BANDS[i],
      n,
      value: Math.round(d[metric] + AGE_OFFSET[metric][i] + (rnd() - 0.5) * 4),
    })),
  }));
}

/** 최근 12개월 추이 (마지막이 이번 달) */
export const MONTHLY = {
  usage: [41, 48, 53, 57, 60, 63, 66, 68, 70, 73, 75, 77],
  ret4: [44, 47, 49, 51, 53, 55, 56, 56, 57, 58, 59, 57],
  ret12: [30, 32, 35, 37, 39, 41, 43, 44, 45, 46, 47, 48],
  presenteeism: [27, 26, 26, 25, 24, 24, 23, 23, 22, 20, 19, 18],
  sickLeave: [0.61, 0.66, 0.58, 0.55, 0.52, 0.5, 0.47, 0.49, 0.46, 0.44, 0.43, 0.42], // 일/인/월
  vitality: [58, 59, 60, 61, 62, 63, 64, 64, 65, 66, 67, 68],
  condition: [3.2, 3.2, 3.3, 3.3, 3.4, 3.4, 3.5, 3.5, 3.5, 3.6, 3.6, 3.6],
  focus: [3.0, 3.1, 3.1, 3.2, 3.2, 3.3, 3.3, 3.3, 3.4, 3.4, 3.4, 3.4],
  stress: [6.1, 6.0, 6.0, 5.9, 5.9, 5.8, 5.8, 5.7, 5.7, 5.6, 5.6, 5.6],
  sleep: [6.3, 6.3, 6.4, 6.4, 6.4, 6.5, 6.5, 6.5, 6.6, 6.6, 6.6, 6.6],
};

export function monthLabels(today: Date, n = 12) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    out.push(`${String(d.getFullYear()).slice(2)}.${d.getMonth() + 1}`);
  }
  return out;
}

/** 참여 Journey Funnel */
export const FUNNEL = [
  { stage: "전체 대상", value: 1180 },
  { stage: "복지 신청", value: 897 },
  { stage: "운동 시작", value: 732 },
  { stage: "4주 지속", value: 425 },
  { stage: "12주 지속", value: 351 },
];
export const RECOVERY = { dropped: 307, reengaged: 86 };

/** 팀 단위(익명) 참여율 vs 업무활력 — 상관 분석용 */
export const TEAMS = (() => {
  const rnd = seeded(4242);
  const out: { team: string; dept: DeptName; n: number; participation: number; vitality: number }[] = [];
  DEPTS.forEach((dept, di) => {
    const count = [3, 4, 6, 4, 3, 5][di];
    for (let i = 0; i < count; i++) {
      const participation = Math.round(48 + rnd() * 44);
      const vitality = Math.round(38 + participation * 0.36 + (rnd() - 0.5) * 22);
      out.push({ team: `${dept} ${String.fromCharCode(65 + i)}팀`, dept, n: 12 + Math.round(rnd() * 40), participation, vitality });
    }
  });
  return out;
})();

export interface RiskGroup {
  id: string;
  name: string;
  count: number;
  prev: number;
  tone: "red" | "orange";
  factors: string[];
  depts: { dept: DeptName; share: number }[];
  action: string;
}

export const RISK_GROUPS: RiskGroup[] = [
  {
    id: "stress", name: "스트레스 고위험군", count: 96, prev: 71, tone: "red",
    factors: ["스트레스 자기평가 7점 이상 3주 연속", "평일 저녁 운동 결석 증가", "컨디션 자기평가 하락"],
    depts: [{ dept: "마케팅", share: 38 }, { dept: "개발", share: 31 }, { dept: "고객센터", share: 19 }],
    action: "마케팅팀 대상 스트레스 관리 프로그램(요가·명상) 확대",
  },
  {
    id: "sleep", name: "수면 부족군", count: 118, prev: 104, tone: "orange",
    factors: ["평균 수면 6시간 미만", "최근 2주 수면 1시간+ 감소", "야간 활동 증가"],
    depts: [{ dept: "개발", share: 46 }, { dept: "고객센터", share: 24 }, { dept: "마케팅", share: 17 }],
    action: "수면 개선 요가 · 저녁 고강도 운동 대신 점심 활동 권장 캠페인",
  },
  {
    id: "drop", name: "활동 감소군", count: 87, prev: 62, tone: "red",
    factors: ["최근 2주 운동빈도 40%+ 감소", "평일 저녁 슬롯 결석 반복", "목표 실패 2주 연속"],
    depts: [{ dept: "개발", share: 52 }, { dept: "영업", share: 21 }, { dept: "마케팅", share: 15 }],
    action: "개발본부 점심시간 30분 운동 프로그램 신설",
  },
  {
    id: "reengage", name: "재참여 필요군", count: 64, prev: 70, tone: "orange",
    factors: ["10일 이상 미활동", "이전 4주 지속 경험 있음", "재시작 미션 미수락"],
    depts: [{ dept: "고객센터", share: 34 }, { dept: "개발", share: 33 }, { dept: "영업", share: 20 }],
    action: "재시작 +300P 미션과 1일 이용권 리마인드 발송",
  },
];
export const DROPOUT_RISK_TOTAL = { count: 142, prev: 118 };

export const PRESENTEEISM = {
  risk: 18, prevRisk: 23,
  indicators: [
    { key: "condition", label: "컨디션", value: 3.6, unit: "/5", prev: 3.4, higherIsBetter: true },
    { key: "vitality", label: "업무활력", value: 68, unit: "점", prev: 64, higherIsBetter: true },
    { key: "focus", label: "집중도", value: 3.4, unit: "/5", prev: 3.2, higherIsBetter: true },
    { key: "stress", label: "스트레스", value: 5.6, unit: "/10", prev: 5.8, higherIsBetter: false },
    { key: "sleep", label: "수면", value: 6.6, unit: "시간", prev: 6.5, higherIsBetter: true },
    { key: "sickLeave", label: "병가", value: 0.42, unit: "일/인·월", prev: 0.49, higherIsBetter: false },
  ],
  surveyN: 864,
};

export interface PartnerFacility {
  id: string;
  name: string;
  type: string;
  users: number;
  usage: number; // 월 이용률 %
  ret12: number;
  satisfaction: number;
  costPerUser: number; // 월 1인당
  trend: number; // 이용자 증감 %
}

export const PARTNERS: PartnerFacility[] = [
  { id: "p1", name: "헬스장 A · WellFit Fitness 강남", type: "헬스", users: 186, usage: 82, ret12: 69, satisfaction: 4.5, costPerUser: 38000, trend: 6 },
  { id: "p2", name: "필라테스 B · 코어밸런스 역삼", type: "필라테스", users: 94, usage: 76, ret12: 81, satisfaction: 4.8, costPerUser: 61000, trend: 18 },
  { id: "p3", name: "요가 C · 숨요가 성수", type: "요가", users: 48, usage: 64, ret12: 66, satisfaction: 4.6, costPerUser: 30000, trend: 9 },
  { id: "p4", name: "수영 D · 강남 스포츠센터", type: "수영", users: 71, usage: 58, ret12: 52, satisfaction: 4.1, costPerUser: 32000, trend: -4 },
  { id: "p5", name: "크로스핏 E · F45 역삼", type: "크로스핏/F45", users: 22, usage: 18, ret12: 44, satisfaction: 4.2, costPerUser: 44000, trend: -12 },
  { id: "p6", name: "GX F · 논현 GX센터", type: "GX", users: 19, usage: 16, ret12: 38, satisfaction: 3.8, costPerUser: 35000, trend: -9 },
  { id: "p7", name: "러닝 G · 한강 러닝크루", type: "러닝", users: 64, usage: 71, ret12: 58, satisfaction: 4.4, costPerUser: 9000, trend: 11 },
  { id: "p8", name: "PT H · 핏랩 PT 스튜디오", type: "PT", users: 33, usage: 69, ret12: 72, satisfaction: 4.9, costPerUser: 49000, trend: 14 },
];

/** 분기 비용 구조 (원) */
export const COST = {
  welfareSupport: 12_020_000, // 복지지원금 (리워드·챌린지·개인 지원)
  platform: 11_160_000, // 플랫폼 비용 (1,240명 × 3,000원 × 3개월)
  partnerFee: 61_020_000, // 제휴비용
};

export interface PilotMetric {
  key: string;
  label: string;
  unit: string;
  higherIsBetter: boolean;
  values: [number, number, number, number]; // baseline, W4, W8, W12
}

export const PILOT = {
  participants: 80,
  depts: "개발 34명 · 마케팅 22명 · 고객센터 24명",
  startedWeeksAgo: 9,
  metrics: [
    { key: "start", label: "운동 시작률", unit: "%", higherIsBetter: true, values: [31, 64, 71, 74] },
    { key: "ret4", label: "4주 지속률", unit: "%", higherIsBetter: true, values: [38, 62, 66, 68] },
    { key: "drop", label: "중단률", unit: "%", higherIsBetter: false, values: [27, 15, 12, 11] },
    { key: "reeng", label: "재참여율", unit: "%", higherIsBetter: true, values: [9, 18, 26, 31] },
    { key: "condition", label: "컨디션", unit: "/5", higherIsBetter: true, values: [3.1, 3.4, 3.6, 3.7] },
    { key: "vitality", label: "업무활력", unit: "점", higherIsBetter: true, values: [58, 63, 67, 69] },
    { key: "presenteeism", label: "프리젠티즘 위험(자기평가)", unit: "%", higherIsBetter: false, values: [26, 22, 19, 17] },
  ] as PilotMetric[],
  weeklyActive: [0, 41, 52, 58, 61, 57, 60, 63, 62, 64, 65, 66], // W1..W12 활동 인원
};
