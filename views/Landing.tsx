"use client";

import { ArrowRight, LayoutDashboard, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { AppLink } from "@/lib/nav";

const FLOW = ["기업 복지 제공", "맞춤 운동 추천", "제휴시설 연결", "운동 시작", "출석·기록", "지속률 측정", "중단 위험 AI 예측", "대안 제안", "재참여", "익명 집계", "AI 효과 분석", "다음 분기 의사결정"];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-5 pb-16 pt-10 sm:pt-16">
        <div className="flex items-center gap-2 text-[17px] font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">W</span>
          WellFit
        </div>
        <h1 className="mt-10 max-w-3xl text-[34px] font-bold leading-[1.2] tracking-tight sm:text-[48px]">
          복지비가 실제 운동으로,
          <br />
          운동이 <span className="text-brand-600">다음 분기 의사결정</span>으로.
        </h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-slate-500 sm:text-[17px]">
          WellFit은 기업의 건강·운동 복지를 임직원의 실제 신체활동과 연결하고, AI가 지속·중단·재참여 패턴을 분석해 복지 예산과 프로그램 결정을 돕는 B2B2C 웰니스 플랫폼입니다.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <AppLink href="/employee" className="group rounded-3xl border border-slate-200 p-6 transition hover:border-brand-300 hover:shadow-float">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50"><Smartphone className="h-6 w-6 text-brand-600" /></div>
            <div className="mt-5 text-[20px] font-bold">임직원 앱</div>
            <p className="mt-1 text-[14px] leading-relaxed text-slate-500">AI 코치 추천, 운동 시작·기록, 제휴시설 찾기, 지속·재참여 리워드</p>
            <div className="mt-5 flex items-center gap-1 text-[14px] font-semibold text-brand-600">김지훈님으로 체험하기 <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></div>
          </AppLink>
          <AppLink href="/admin" className="group rounded-3xl border border-slate-200 p-6 transition hover:border-brand-300 hover:shadow-float">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"><LayoutDashboard className="h-6 w-6 text-ink" /></div>
            <div className="mt-5 text-[20px] font-bold">기업 관리자 · HR</div>
            <p className="mt-1 text-[14px] leading-relaxed text-slate-500">익명 집계 대시보드, AI 인사이트, 추정 ROI, 시설·예산, 경영진 리포트, 파일럿</p>
            <div className="mt-5 flex items-center gap-1 text-[14px] font-semibold text-brand-600">(주)한빛테크 관리자로 보기 <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></div>
          </AppLink>
        </div>

        <div className="mt-12">
          <div className="flex items-center gap-2 text-[13px] font-bold text-ai-700"><Sparkles className="h-4 w-4" /> WellFit 핵심 흐름</div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {FLOW.map((f, i) => (
              <span key={f} className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${i >= 9 ? "bg-ink text-white" : i >= 6 ? "bg-ai-50 text-ai-700" : "bg-slate-100 text-slate-700"}`}>{f}</span>
                {i < FLOW.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-slate-300" />}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-start gap-3 rounded-2xl bg-slate-50 p-5 text-[13.5px] leading-relaxed text-slate-600">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          기업 관리자에게는 개인 건강정보를 제공하지 않습니다. 모든 기업 지표는 부서·조직 단위 익명 집계이며, 최소 인원 미만 그룹은 비공개 처리됩니다. AI 수치는 행동 패턴 기반 추정이며 의료 진단이 아닙니다.
        </div>
        <p className="mt-6 text-center text-[12px] text-slate-400">MVP 프로토타입 · 모든 데이터는 시뮬레이션 데이터이며, 변경 내용은 이 브라우저에 저장됩니다.</p>
      </div>
    </div>
  );
}
