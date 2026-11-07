/**
 * WellFit 기업 AI 인사이트 — mock 분석 엔진
 * 입력은 모두 부서/팀/연령 단위 익명 집계. 개인 단위 데이터는 사용하지 않는다.
 * 실제 서비스에서는 동일 인터페이스로 분석 API/모델 결과를 반환하도록 교체한다.
 */
import {
  COMPANY, COST, DEPT_STATS, PARTNERS, PERIOD_KPIS, PRESENTEEISM, RISK_GROUPS, TEAMS,
  crossCells, type DeptName, type KpiKey, type Period, type PartnerFacility,
} from "../data/company";

export interface Insight {
  id: string;
  severity: "high" | "medium" | "positive";
  category: "지속률" | "스트레스" | "재참여" | "참여" | "프로그램";
  title: string;
  detail: string;
  evidence: string[];
  scope: string;
}

export function pearson(xs: number[], ys: number[]) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  return num / Math.sqrt(dx * dy);
}

export function linearFit(xs: number[], ys: number[]) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = num / den;
  return { slope, intercept: my - slope * mx };
}

export function correlation() {
  const xs = TEAMS.map((t) => t.participation);
  const ys = TEAMS.map((t) => t.vitality);
  const r = pearson(xs, ys);
  const fit = linearFit(xs, ys);
  const high = TEAMS.filter((t) => t.participation >= 75);
  const low = TEAMS.filter((t) => t.participation < 60);
  const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  return {
    r, fit, n: TEAMS.length,
    highAvg: avg(high.map((t) => t.vitality)),
    lowAvg: avg(low.map((t) => t.vitality)),
  };
}

const companyAvg = (k: "reeng" | "ret4" | "usage") =>
  DEPT_STATS.reduce((s, d) => s + d[k] * d.headcount, 0) / COMPANY.employees;

export function detectAnomalies(): Insight[] {
  const out: Insight[] = [];
  for (const d of DEPT_STATS) {
    const change = ((d.ret4 - d.prev.ret4) / d.prev.ret4) * 100;
    if (change <= -12) {
      out.push({
        id: `ret4-${d.name}`, severity: "high", category: "지속률",
        title: `${d.name}팀의 최근 4주 운동 지속률이 전분기 대비 ${Math.round(Math.abs(change))}% 감소했습니다.`,
        detail: `${d.prev.ret4}% → ${d.ret4}%. 평일 저녁 슬롯 결석이 늘었고, 점심 슬롯은 상대적으로 유지되고 있습니다.`,
        evidence: [`4주 지속률 ${d.prev.ret4}% → ${d.ret4}%`, `중단률 ${d.drop}% (전사 평균 14%)`, `평균 수면 ${d.sleep}시간`],
        scope: `${d.name} · ${d.headcount}명`,
      });
    }
    const tr = d.stressTrend;
    let rising = 0;
    for (let i = tr.length - 1; i > 0 && tr[i] > tr[i - 1]; i--) rising++;
    if (rising >= 3) {
      out.push({
        id: `stress-${d.name}`, severity: "high", category: "스트레스",
        title: `${d.name}팀 스트레스 자기평가가 ${rising}주 연속 상승하고 있습니다.`,
        detail: `${tr[tr.length - 1 - rising]} → ${tr[tr.length - 1]} (10점 척도). 같은 기간 웰니스 점수는 ${d.prev.wellness} → ${d.wellness}로 하락했습니다.`,
        evidence: [`최근 6주 스트레스 ${tr.join(" → ")}`, `프리젠티즘 위험군 ${d.presenteeism}%`, `업무활력 ${d.vitality}점`],
        scope: `${d.name} · ${d.headcount}명`,
      });
    }
  }
  // 연령대 재참여 격차
  const cells = crossCells("reeng");
  const bandTotals = [0, 1, 2, 3].map((i) => {
    let n = 0, sum = 0;
    cells.forEach((c) => { n += c.cells[i].n; sum += c.cells[i].value * c.cells[i].n; });
    return { band: c0(i), n, value: sum / n };
  });
  const avgReeng = companyAvg("reeng");
  for (const b of bandTotals) {
    const gap = ((b.value - avgReeng) / avgReeng) * 100;
    if (gap <= -15) {
      out.push({
        id: `reeng-${b.band}`, severity: "medium", category: "재참여",
        title: `${b.band} 직원 그룹의 재참여율이 전사 평균보다 ${Math.round(Math.abs(gap))}% 낮습니다.`,
        detail: `${b.band} ${Math.round(b.value)}% vs 전사 ${Math.round(avgReeng)}%. 중단 후 재시작 미션 수락률도 낮게 나타납니다.`,
        evidence: [`대상 ${b.n}명 (익명 집계)`, `재참여율 ${Math.round(b.value)}%`, "야근·육아 시간대 충돌 응답 비중 높음 (설문)"],
        scope: `${b.band} · ${b.n}명`,
      });
    }
  }
  // 긍정 시그널
  const best = [...DEPT_STATS].sort((a, b) => b.usage - b.prev.usage - (a.usage - a.prev.usage))[0];
  out.push({
    id: `usage-${best.name}`, severity: "positive", category: "참여",
    title: `${best.name}팀 복지 이용률이 전분기 대비 ${best.usage - best.prev.usage}%p 상승했습니다.`,
    detail: "교대 근무 맞춤 오전 클래스 도입 이후 시작률과 4주 지속률이 함께 올랐습니다.",
    evidence: [`이용률 ${best.prev.usage}% → ${best.usage}%`, `4주 지속률 ${best.prev.ret4}% → ${best.ret4}%`],
    scope: `${best.name} · ${best.headcount}명`,
  });
  const pil = PARTNERS.find((p) => p.type === "필라테스")!;
  const avgRet12 = weightedRet12();
  out.push({
    id: "pilates", severity: "positive", category: "프로그램",
    title: `필라테스 프로그램의 12주 지속률이 제휴 평균보다 ${Math.round((pil.ret12 / avgRet12 - 1) * 100)}% 높습니다.`,
    detail: `${pil.ret12}% vs 평균 ${Math.round(avgRet12)}%. 이용자 수도 ${pil.trend}% 증가 중입니다.`,
    evidence: [`만족도 ${pil.satisfaction}/5`, `이용자 ${pil.users}명`],
    scope: "필라테스 이용자",
  });
  return out;
}

function c0(i: number) {
  return ["20대", "30대", "40대", "50대+"][i];
}

export function weightedRet12() {
  const users = PARTNERS.reduce((s, p) => s + p.users, 0);
  return PARTNERS.reduce((s, p) => s + p.ret12 * p.users, 0) / users;
}

export interface ActionRec {
  id: string;
  title: string;
  priority: "높음" | "중간" | "낮음";
  impact: "높음" | "중간" | "낮음";
  owner: string;
  cost: string;
  why: string[];
  expected: string;
}

export function actionRecommendations(): ActionRec[] {
  const dev = DEPT_STATS.find((d) => d.name === "개발")!;
  const mkt = DEPT_STATS.find((d) => d.name === "마케팅")!;
  const low = PARTNERS.filter((p) => p.usage < 20);
  const pil = PARTNERS.find((p) => p.type === "필라테스")!;
  const lowCost = low.reduce((s, p) => s + p.users * p.costPerUser * 3, 0);
  const actGroup = RISK_GROUPS.find((g) => g.id === "drop")!;
  const stressGroup = RISK_GROUPS.find((g) => g.id === "stress")!;
  const reGroup = RISK_GROUPS.find((g) => g.id === "reengage")!;
  return [
    {
      id: "a1", title: "개발팀 점심시간 운동 프로그램 추가", priority: "높음", impact: "높음", owner: "HR · 개발본부",
      cost: "분기 약 420만원 (필라테스 B 점심반 2개)",
      why: [
        `개발팀 4주 지속률 ${dev.prev.ret4}% → ${dev.ret4}% (전분기 대비 ${Math.round(((dev.ret4 - dev.prev.ret4) / dev.prev.ret4) * 100)}%)`,
        `활동 감소군 ${actGroup.count}명 중 ${actGroup.depts[0].share}%가 개발팀`,
        "전사 데이터에서 점심 슬롯 출석률이 저녁보다 평균 27%p 높음",
      ],
      expected: "개발팀 4주 지속률 +6~9%p 회복 가능성 (AI 추정)",
    },
    {
      id: "a2", title: "마케팅팀 스트레스 관리 프로그램 확대", priority: "높음", impact: "중간", owner: "HR · 마케팅본부",
      cost: "분기 약 180만원 (요가 C 수면개선반 + 명상 앱)",
      why: [
        `스트레스 자기평가 3주 연속 상승 (${mkt.stressTrend.slice(-4).join(" → ")})`,
        `스트레스 고위험군 ${stressGroup.count}명 중 ${stressGroup.depts[0].share}%가 마케팅`,
        "요가 C 이용자의 스트레스 점수 하락폭이 가장 큼 (상관 관찰)",
      ],
      expected: "프리젠티즘 위험군 2~3%p 감소 기대 (AI 추정)",
    },
    {
      id: "a3", title: "이용률 20% 미만 제휴시설 재계약 검토", priority: "중간", impact: "중간", owner: "총무 · 구매",
      cost: `분기 ${Math.round(lowCost / 10000)}만원 절감 가능`,
      why: [
        ...low.map((p) => `${p.name.split(" · ")[0]} 이용률 ${p.usage}% · 12주 지속률 ${p.ret12}%`),
        "두 시설 모두 이용자 수 감소 추세",
      ],
      expected: "절감 예산을 필라테스·점심 프로그램으로 재배치",
    },
    {
      id: "a4", title: "필라테스 제휴 확대", priority: "중간", impact: "높음", owner: "총무 · HR",
      cost: "분기 약 550만원 (정원 +30명)",
      why: [
        `필라테스 12주 지속률 ${pil.ret12}% — 제휴 평균(${Math.round(weightedRet12())}%)보다 ${Math.round((pil.ret12 / weightedRet12() - 1) * 100)}% 높음`,
        `만족도 ${pil.satisfaction}/5 · 이용자 ${pil.trend}% 증가 · 대기 인원 발생`,
      ],
      expected: "12주 지속 인원 +20명 추정",
    },
    {
      id: "a5", title: "재참여 필요군 재시작 미션 발송", priority: "낮음", impact: "중간", owner: "HR (자동화)",
      cost: "리워드 포인트 약 30만원",
      why: [`10일+ 미활동 ${reGroup.count}명 (고객센터·개발 비중 높음)`, "재시작 +300P 미션 수락자의 4주 유지율 61%"],
      expected: "재참여율 +4%p 추정",
    },
  ];
}

/* ------------------------------------------------------------------ */
/* KPI · 부서 필터                                                      */
/* ------------------------------------------------------------------ */

export function kpisFor(period: Period, dept: DeptName | "전체") {
  const base = PERIOD_KPIS[period];
  if (dept === "전체") return base;
  const d = DEPT_STATS.find((x) => x.name === dept)!;
  const q = PERIOD_KPIS.quarter.current;
  const shift = (k: KpiKey) => (d[k] as number) - q[k];
  const apply = (set: Record<KpiKey, number>) =>
    Object.fromEntries((Object.keys(set) as KpiKey[]).map((k) => [k, Math.max(0, Math.min(100, Math.round(set[k] + shift(k))))])) as Record<KpiKey, number>;
  return { current: apply(base.current), previous: apply(base.previous) };
}

/* ------------------------------------------------------------------ */
/* ROI                                                                 */
/* ------------------------------------------------------------------ */

export interface RoiInputs {
  dailyWage: number; // 일평균 인건비
  sickDaysReduced: number; // 1인당 월 병가 감소일
  presenteeismImproved: number; // 개선 인원
  productivityRecovery: number; // 생산성 회복률 (%)
  monthlySalary: number;
  turnoverAvoided: number; // 분기 이직 감소 추정 인원
  replacementCost: number;
  attribution: number; // 플랫폼 기여 가중치 (%)
  unusedReduction: number; // 복지 미사용 감소 (%p)
  welfareBudget: number; // 분기 복지 예산
}

export const DEFAULT_ROI: RoiInputs = {
  dailyWage: 230_000,
  sickDaysReduced: 0.05,
  presenteeismImproved: 62,
  productivityRecovery: 4,
  monthlySalary: 4_800_000,
  turnoverAvoided: 1,
  replacementCost: 24_000_000,
  attribution: 50,
  unusedReduction: 8,
  welfareBudget: 269_000_000,
};

export function computeRoi(i: RoiInputs) {
  const costs = [
    { label: "복지지원금", value: COST.welfareSupport },
    { label: "플랫폼 비용", value: COST.platform },
    { label: "제휴비용", value: COST.partnerFee },
  ];
  const totalCost = costs.reduce((s, c) => s + c.value, 0);
  const benefits = [
    {
      label: "병가 감소", value: i.sickDaysReduced * COMPANY.employees * 3 * i.dailyWage,
      formula: `${i.sickDaysReduced}일 × ${COMPANY.employees}명 × 3개월 × 일 인건비`,
    },
    {
      label: "프리젠티즘 개선", value: i.presenteeismImproved * 3 * i.monthlySalary * (i.productivityRecovery / 100),
      formula: `${i.presenteeismImproved}명 × 3개월 × 월 인건비 × 생산성 회복 ${i.productivityRecovery}%`,
    },
    {
      label: "이직 위험 감소", value: i.turnoverAvoided * i.replacementCost * (i.attribution / 100),
      formula: `${i.turnoverAvoided}명 × 대체비용 × 기여 가중치 ${i.attribution}%`,
    },
    {
      label: "복지 미사용 감소", value: (i.unusedReduction / 100) * i.welfareBudget,
      formula: `미사용률 ${i.unusedReduction}%p 감소 × 분기 복지예산`,
    },
  ];
  const totalBenefit = benefits.reduce((s, b) => s + b.value, 0);
  const roi = ((totalBenefit - totalCost) / totalCost) * 100;
  return { costs, totalCost, benefits, totalBenefit, roi };
}

/* ------------------------------------------------------------------ */
/* 제휴시설 조정 제안                                                    */
/* ------------------------------------------------------------------ */

export type FacilityDecision = "유지" | "확대" | "축소" | "교체 검토";

export function facilityDecision(p: PartnerFacility): { decision: FacilityDecision; reason: string; nextCost: number } {
  const cost = p.users * p.costPerUser * 3;
  if (p.usage < 20) return { decision: "교체 검토", reason: `이용률 ${p.usage}%로 기준(20%) 미달, 이용자 ${p.trend}% 감소`, nextCost: Math.round(cost * 0.3) };
  if (p.ret12 >= 70 && p.satisfaction >= 4.7) return { decision: "확대", reason: `12주 지속률 ${p.ret12}% · 만족도 ${p.satisfaction} · 수요 증가 ${p.trend}%`, nextCost: Math.round(cost * 1.3) };
  if (p.trend < 0 && p.ret12 < 55) return { decision: "축소", reason: `12주 지속률 ${p.ret12}%로 평균 이하, 이용자 ${p.trend}% 감소`, nextCost: Math.round(cost * 0.75) };
  return { decision: "유지", reason: `이용률 ${p.usage}% · 12주 지속률 ${p.ret12}%로 안정적`, nextCost: cost };
}

/* ------------------------------------------------------------------ */
/* 경영진 요약                                                          */
/* ------------------------------------------------------------------ */

export function executiveSummary(adopted: string[]) {
  const q = PERIOD_KPIS.quarter;
  const roi = computeRoi(DEFAULT_ROI);
  const lines = [
    `이번 분기 운동복지 이용률은 ${q.current.usage}%로 전분기 대비 ${q.current.usage - q.previous.usage}%p 증가했습니다.`,
    "운동 참여율이 높은 부서에서 업무활력 점수가 함께 상승하는 경향이 나타났으며(상관관계), 프리젠티즘 위험지표는 " +
      `${PRESENTEEISM.prevRisk - PRESENTEEISM.risk}%p 감소했습니다.`,
    adopted.length
      ? `다음 분기에는 ${adopted.join(", ")}을(를) 실행할 예정입니다.`
      : "다음 분기에는 필라테스 및 점심시간 운동 프로그램 확대, 이용률이 낮은 2개 시설 재계약 검토를 추천합니다.",
  ];
  return { lines, roi: roi.roi, totalCost: roi.totalCost, totalBenefit: roi.totalBenefit };
}
