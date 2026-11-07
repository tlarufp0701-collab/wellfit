"use client";

import { useState } from "react";
import { CheckCircle2, Download, FileText, Loader2, Sparkles, ThumbsUp } from "lucide-react";
import { useStore } from "@/lib/store";
import { won } from "@/lib/format";
import { COMPANY, DEPT_STATS, PERIOD_KPIS, PRESENTEEISM } from "@/lib/data/company";
import { actionRecommendations, computeRoi, executiveSummary } from "@/lib/ai/insights";
import { AiTag, Button, Card, Delta, InfoTip, Sheet } from "@/components/ui";

export default function Executive() {
  const s = useStore();
  const [pdf, setPdf] = useState<"idle" | "making" | "ready">("idle");
  const actions = actionRecommendations();
  const adopted = actions.filter((a) => s.actionStatus[a.id] === "실행 예정").map((a) => a.title);
  const summary = executiveSummary(adopted);
  const roi = computeRoi(s.roi);
  const q = PERIOD_KPIS.quarter;
  const sick = PRESENTEEISM.indicators.find((i) => i.key === "sickLeave")!;
  const wellness = Math.round(DEPT_STATS.reduce((a, d) => a + d.wellness * d.headcount, 0) / COMPANY.employees);
  const wellnessPrev = Math.round(DEPT_STATS.reduce((a, d) => a + d.prev.wellness * d.headcount, 0) / COMPANY.employees);
  const next = adopted.length ? adopted : ["필라테스 · 점심시간 운동 프로그램 확대", "이용률 낮은 2개 시설 재계약 검토", "마케팅팀 스트레스 관리 프로그램"];

  const tiles = [
    { label: "복지 투자 비용", value: won(roi.totalCost), delta: null as null | { v: number; good: boolean; suffix: string } },
    { label: "참여율", value: `${q.current.usage}%`, delta: { v: q.current.usage - q.previous.usage, good: true, suffix: "%p" } },
    { label: "12주 지속률", value: `${q.current.ret12}%`, delta: { v: q.current.ret12 - q.previous.ret12, good: true, suffix: "%p" } },
    { label: "프리젠티즘 위험", value: `${PRESENTEEISM.risk}%`, delta: { v: PRESENTEEISM.risk - PRESENTEEISM.prevRisk, good: false, suffix: "%p" } },
    { label: "병가 (일/인·월)", value: `${sick.value}`, delta: { v: Math.round(((sick.value - sick.prev) / sick.prev) * 100), good: false, suffix: "%" } },
    { label: "웰니스 지수", value: `${wellness}`, delta: { v: wellness - wellnessPrev, good: true, suffix: "점" } },
  ];

  const makePdf = () => {
    setPdf("making");
    setTimeout(() => setPdf("ready"), 1400);
  };

  return (
    <div className="mx-auto max-w-[1040px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[13px] font-semibold text-slate-500">(주){COMPANY.name} · {COMPANY.quarterLabel} · CEO / COO / CHRO 보고</div>
          <h2 className="mt-1 text-[28px] font-bold leading-tight tracking-tight">임직원 웰니스 복지 성과 보고</h2>
        </div>
        <Button variant="dark" size="lg" className="no-print" icon={<Download className="h-4 w-4" />} onClick={makePdf}>
          리포트 PDF 다운로드
        </Button>
      </div>

      {/* 결론 */}
      <Card className="flex flex-col gap-5 border-emerald-200 bg-emerald-50/50 p-6 sm:flex-row sm:items-center">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
          <ThumbsUp className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-emerald-700">결론</div>
          <p className="mt-0.5 text-[21px] font-bold leading-snug">투자 지속을 권장합니다. 추정 ROI {roi.roi >= 0 ? "+" : ""}{roi.roi.toFixed(0)}%, 참여·지속·컨디션 지표가 모두 개선되었습니다.</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="flex items-center justify-end gap-1 text-[12.5px] font-semibold text-slate-500">
            추정 ROI <InfoTip text="내부 전후 데이터와 회사 설정값을 바탕으로 계산된 추정치입니다." />
          </div>
          <div className="text-[40px] font-bold leading-none tracking-tight tabular text-emerald-700">{roi.roi >= 0 ? "+" : ""}{roi.roi.toFixed(0)}%</div>
          <div className="mt-1 text-[12px] text-slate-500">예상 절감 {won(roi.totalBenefit)}</div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {tiles.map((t) => (
          <Card key={t.label} className="p-5">
            <div className="text-[13px] font-semibold text-slate-500">{t.label}</div>
            <div className="mt-1.5 text-[30px] font-bold tracking-tight tabular">{t.value}</div>
            {t.delta ? (
              <div className="flex items-center gap-1">
                <Delta value={t.delta.v} suffix={t.delta.suffix} higherIsBetter={t.delta.good} />
                <span className="text-[12px] text-slate-400">전분기 대비</span>
              </div>
            ) : (
              <div className="text-[12px] text-slate-400">복지지원금 · 플랫폼 · 제휴비용</div>
            )}
          </Card>
        ))}
      </div>

      <Card className="border-ai-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[15px] font-bold text-ai-700"><Sparkles className="h-5 w-5" /> AI 경영진 요약</div>
          <AiTag label="데이터 기반 자동 생성" />
        </div>
        <div className="mt-4 space-y-3 text-[16px] leading-relaxed text-slate-800">
          {summary.lines.map((l) => <p key={l}>{l}</p>)}
        </div>
      </Card>

      <Card className="p-6">
        <div className="text-[15px] font-bold">다음 분기 의사결정 {adopted.length ? "(실행 예정)" : "(AI 추천)"}</div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {next.slice(0, 3).map((n, i) => (
            <div key={n} className="rounded-xl bg-slate-50 p-4">
              <div className="text-[12px] font-bold text-slate-400">0{i + 1}</div>
              <div className="mt-1 text-[15px] font-semibold leading-snug">{n}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[12px] leading-relaxed text-slate-400">
          참여율과 업무활력의 관계는 상관관계이며 인과관계를 의미하지 않습니다. ROI·절감 효과는 내부 전후 데이터와 회사 설정값 기반 추정치입니다. 모든 지표는 개인을 식별할 수 없는 익명 집계입니다.
        </p>
      </Card>

      <Sheet
        open={pdf !== "idle"}
        onClose={() => setPdf("idle")}
        title="경영진 리포트 PDF"
        footer={
          pdf === "ready" ? (
            <Button
              size="lg"
              className="w-full"
              icon={<Download className="h-4 w-4" />}
              onClick={() => {
                setPdf("idle");
                setTimeout(() => {
                  try {
                    window.print();
                  } catch {
                    /* 인쇄가 막힌 환경 */
                  }
                }, 200);
              }}
            >
              PDF로 저장 (인쇄 대화상자)
            </Button>
          ) : undefined
        }
      >
        <div className="flex flex-col items-center py-6 text-center">
          {pdf === "making" ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
              <div className="mt-3 text-[15px] font-semibold">리포트를 생성하고 있어요…</div>
              <div className="mt-1 text-[13px] text-slate-500">KPI · AI 요약 · 다음 분기 의사결정 3페이지</div>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              <div className="mt-3 text-[15px] font-semibold">WellFit_경영진리포트_{COMPANY.quarterLabel.replace(" ", "_")}.pdf</div>
              <div className="mt-1 flex items-center gap-1 text-[13px] text-slate-500"><FileText className="h-4 w-4" /> 3페이지 · 익명 집계 데이터만 포함</div>
            </>
          )}
        </div>
      </Sheet>
    </div>
  );
}
