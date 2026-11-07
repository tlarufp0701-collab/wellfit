import type { ExerciseType, Slot } from "./employee";

export type FacilityCategory = "헬스" | "PT" | "필라테스" | "요가" | "러닝" | "수영" | "크로스핏/F45" | "GX";
export const FACILITY_CATEGORIES: FacilityCategory[] = ["헬스", "PT", "필라테스", "요가", "러닝", "수영", "크로스핏/F45", "GX"];

export interface Facility {
  id: string;
  name: string;
  category: FacilityCategory;
  types: ExerciseType[];
  area: { office: string; home: string };
  distance: { office: number; home: number }; // km
  pos: { office: [number, number]; home: [number, number] }; // 지도 좌표 0~100
  welfare: boolean;
  welfareNote: string;
  shower: boolean;
  parking: boolean;
  beginner: boolean;
  rating: number;
  reviews: number;
  hours: string;
  slots: Slot[];
  price: string;
  programs: string[];
  crowd: "여유" | "보통" | "혼잡";
}

export const FACILITIES: Facility[] = [
  {
    id: "f1", name: "WellFit Fitness 강남", category: "헬스", types: ["헬스"],
    area: { office: "역삼동", home: "강남역" }, distance: { office: 0.8, home: 7.9 },
    pos: { office: [58, 44], home: [88, 80] },
    welfare: true, welfareNote: "월 이용권 복지포인트 100% 차감", shower: true, parking: true, beginner: true,
    rating: 4.6, reviews: 412, hours: "06:00–23:00", slots: ["morning", "lunch", "evening", "weekend"],
    price: "월 79,000원 → 복지 적용 0원", programs: ["초보자 머신 OT", "30분 서킷", "인바디 측정"], crowd: "보통",
  },
  {
    id: "f2", name: "코어밸런스 필라테스 역삼", category: "필라테스", types: ["필라테스"],
    area: { office: "역삼동", home: "선릉역" }, distance: { office: 0.5, home: 8.3 },
    pos: { office: [44, 36], home: [92, 74] },
    welfare: true, welfareNote: "주 2회 그룹레슨 복지 지원", shower: true, parking: false, beginner: true,
    rating: 4.8, reviews: 268, hours: "07:00–22:00", slots: ["morning", "lunch", "evening"],
    price: "그룹 8회 240,000원 → 복지 적용 48,000원", programs: ["점심 40분 매트", "허리 케어 리포머", "1:1 체험"], crowd: "여유",
  },
  {
    id: "f3", name: "숨요가 성수", category: "요가", types: ["요가"],
    area: { office: "성수동", home: "성수동" }, distance: { office: 6.9, home: 0.6 },
    pos: { office: [90, 12], home: [46, 52] },
    welfare: true, welfareNote: "월 8회권 복지 지원", shower: true, parking: false, beginner: true,
    rating: 4.7, reviews: 189, hours: "07:00–22:00", slots: ["morning", "evening", "weekend"],
    price: "월 8회 150,000원 → 복지 적용 30,000원", programs: ["수면 개선 요가", "주말 빈야사"], crowd: "여유",
  },
  {
    id: "f4", name: "강남 스포츠센터 수영장", category: "수영", types: ["수영"],
    area: { office: "대치동", home: "옥수동" }, distance: { office: 2.1, home: 3.4 },
    pos: { office: [74, 66], home: [22, 70] },
    welfare: true, welfareNote: "자유수영 월권 복지 지원", shower: true, parking: true, beginner: true,
    rating: 4.3, reviews: 521, hours: "06:00–22:00", slots: ["morning", "evening", "weekend"],
    price: "자유수영 월 65,000원 → 복지 적용 0원", programs: ["성인 초급반", "자유수영"], crowd: "혼잡",
  },
  {
    id: "f5", name: "F45 Training 역삼", category: "크로스핏/F45", types: ["크로스핏/F45"],
    area: { office: "역삼동", home: "왕십리" }, distance: { office: 1.2, home: 2.6 },
    pos: { office: [36, 58], home: [30, 30] },
    welfare: true, welfareNote: "월 12회 복지 지원", shower: true, parking: false, beginner: false,
    rating: 4.5, reviews: 143, hours: "06:00–22:00", slots: ["morning", "evening"],
    price: "월 12회 220,000원 → 복지 적용 44,000원", programs: ["45분 팀 트레이닝"], crowd: "보통",
  },
  {
    id: "f6", name: "바디플로우 GX 스튜디오", category: "GX", types: ["GX"],
    area: { office: "논현동", home: "성수동" }, distance: { office: 1.9, home: 1.1 },
    pos: { office: [20, 30], home: [62, 40] },
    welfare: false, welfareNote: "복지 미제휴 (개인 결제)", shower: true, parking: false, beginner: true,
    rating: 4.1, reviews: 77, hours: "10:00–22:00", slots: ["evening", "weekend"],
    price: "월 99,000원", programs: ["줌바", "스피닝", "바디펌프"], crowd: "보통",
  },
  {
    id: "f7", name: "핏랩 PT 스튜디오", category: "PT", types: ["헬스"],
    area: { office: "역삼동", home: "뚝섬역" }, distance: { office: 0.9, home: 1.4 },
    pos: { office: [64, 26], home: [34, 62] },
    welfare: true, welfareNote: "PT 체험 1회 + 10회권 30% 지원", shower: true, parking: true, beginner: true,
    rating: 4.9, reviews: 96, hours: "07:00–23:00", slots: ["morning", "lunch", "evening", "weekend"],
    price: "PT 10회 700,000원 → 복지 적용 490,000원", programs: ["체형 분석", "허리 통증 관리 PT"], crowd: "여유",
  },
  {
    id: "f8", name: "한강 러닝크루 (성수·뚝섬)", category: "러닝", types: ["러닝", "걷기"],
    area: { office: "선릉로", home: "뚝섬한강공원" }, distance: { office: 1.6, home: 0.9 },
    pos: { office: [80, 42], home: [56, 78] },
    welfare: true, welfareNote: "크루 참가비 복지 지원", shower: false, parking: true, beginner: true,
    rating: 4.6, reviews: 210, hours: "화·목 19:30 / 토 08:00", slots: ["evening", "weekend"],
    price: "월 30,000원 → 복지 적용 0원", programs: ["5K 입문", "점심 걷기 모임 (회사)"], crowd: "보통",
  },
];

export interface RewardItem {
  id: string;
  name: string;
  price: number;
  category: "굿즈" | "쿠폰" | "체험권";
  desc: string;
  stock: number;
}

export const REWARD_ITEMS: RewardItem[] = [
  { id: "r1", name: "스포츠 양말", price: 500, category: "굿즈", desc: "쿠셔닝 기능성 양말 2켤레", stock: 120 },
  { id: "r5", name: "카페 쿠폰", price: 600, category: "쿠폰", desc: "아메리카노 Tall 1잔 모바일 쿠폰", stock: 999 },
  { id: "r2", name: "쉐이커 보틀", price: 900, category: "굿즈", desc: "WellFit 600ml 쉐이커", stock: 64 },
  { id: "r3", name: "웰핏 타월", price: 1200, category: "굿즈", desc: "속건 스포츠 타월", stock: 80 },
  { id: "r6", name: "제휴시설 1일 이용권", price: 1500, category: "체험권", desc: "제휴 헬스·GX·수영 중 1곳 1일 이용", stock: 999 },
  { id: "r4", name: "텀블러", price: 1800, category: "굿즈", desc: "스테인리스 보온보냉 500ml", stock: 40 },
  { id: "r8", name: "필라테스 체험권", price: 2800, category: "체험권", desc: "제휴 필라테스 1:1 체험 1회", stock: 30 },
  { id: "r7", name: "PT 체험권", price: 3000, category: "체험권", desc: "제휴 PT 스튜디오 1:1 체험 1회", stock: 30 },
];

export interface EarnRule {
  id: string;
  label: string;
  points: number;
  stage: "시작" | "지속" | "재참여" | "목표달성" | "팀";
  desc: string;
}

export const EARN_RULES: EarnRule[] = [
  { id: "e1", label: "운동 1회 인증", points: 50, stage: "시작", desc: "QR 출석 · 웨어러블 · 수동 기록" },
  { id: "e2", label: "주간 목표 달성", points: 200, stage: "목표달성", desc: "이번 주 목표 횟수 채우기" },
  { id: "e3", label: "4주 연속 지속", points: 500, stage: "지속", desc: "4주 동안 매주 2회 이상" },
  { id: "e4", label: "12주 지속", points: 1500, stage: "지속", desc: "습관 형성 구간 통과" },
  { id: "e5", label: "중단 후 다시 시작", points: 300, stage: "재참여", desc: "10일 이상 쉰 뒤 첫 운동" },
  { id: "e6", label: "재참여 후 4주 지속", points: 700, stage: "재참여", desc: "다시 시작한 뒤 4주 유지" },
  { id: "e7", label: "팀 챌린지 성공", points: 1000, stage: "팀", desc: "부서 챌린지 목표 달성" },
];

export interface Challenge {
  id: string;
  title: string;
  desc: string;
  unit: string;
  target: number;
  progress: number; // 팀/전사 진행
  myContribution: number;
  daysLeft: number;
  participants: number;
  reward: number;
  scope: "전사" | "부서";
  leaderboard?: { dept: string; value: number }[];
}

export const CHALLENGES: Challenge[] = [
  {
    id: "c1", title: "11월 함께 걷기", desc: "전사 누적 5,000만 보 달성하기", unit: "만 보",
    target: 5000, progress: 3420, myContribution: 14.6, daysLeft: 23, participants: 684, reward: 300, scope: "전사",
  },
  {
    id: "c2", title: "부서별 30일 운동 챌린지", desc: "부서원 평균 주 3회 운동 · 30일 유지", unit: "%",
    target: 100, progress: 64, myContribution: 9, daysLeft: 11, participants: 212, reward: 1000, scope: "부서",
    leaderboard: [
      { dept: "상품기획", value: 81 },
      { dept: "경영지원", value: 74 },
      { dept: "개발본부", value: 64 },
      { dept: "마케팅", value: 59 },
      { dept: "영업", value: 55 },
      { dept: "고객센터", value: 48 },
    ],
  },
  {
    id: "c3", title: "점심 30분 리셋", desc: "점심시간 30분 활동 10회 인증", unit: "회",
    target: 10, progress: 0, myContribution: 3, daysLeft: 18, participants: 156, reward: 400, scope: "전사",
  },
];
