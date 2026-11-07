"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  BarChart3, Building, Crown, FlaskConical, LayoutDashboard, ShieldCheck, Smartphone, Sparkles, Users, Wallet, RotateCcw,
} from "lucide-react";
import { AppLink, useNav } from "@/lib/nav";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/format";
import { COMPANY, PERIOD_LABEL, type DeptName, type Period } from "@/lib/data/company";
import { Loader, Segmented, useToast } from "./ui";

export const ADMIN_NAV = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard, desc: "복지 이용 현황 한눈에 보기" },
  { href: "/admin/employees", label: "부서별 분석", icon: Users, desc: "익명 집계 · 개인 식별 불가" },
  { href: "/admin/ai-insights", label: "AI 인사이트", icon: Sparkles, desc: "놓치기 쉬운 패턴과 다음 행동" },
  { href: "/admin/wellness-report", label: "복지 효과 · ROI", icon: BarChart3, desc: "프리젠티즘 · 추정 ROI" },
  { href: "/admin/facilities", label: "시설 · 예산", icon: Wallet, desc: "제휴시설 성과와 다음 분기 조정" },
  { href: "/admin/executive", label: "경영진 리포트", icon: Crown, desc: "1분 요약" },
  { href: "/admin/pilot", label: "파일럿", icon: FlaskConical, desc: "8주 / 12주 파일럿 검증" },
];

interface Filters {
  period: Period;
  setPeriod: (p: Period) => void;
  dept: DeptName | "전체";
  setDept: (d: DeptName | "전체") => void;
}
const FilterCtx = createContext<Filters | null>(null);
export function useAdminFilters() {
  const v = useContext(FilterCtx);
  if (!v) throw new Error("AdminShell missing");
  return v;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { pathname } = useNav();
  const { hydrated, minGroup, resetDemo } = useStore();
  const [period, setPeriod] = useState<Period>("quarter");
  const [dept, setDept] = useState<DeptName | "전체">("전체");
  const toast = useToast();
  const current = ADMIN_NAV.find((n) => (n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href))) ?? ADMIN_NAV[0];
  const showPeriod = ["/admin", "/admin/employees"].includes(current.href);

  useEffect(() => window.scrollTo({ top: 0 }), [pathname]);

  return (
    <FilterCtx.Provider value={{ period, setPeriod, dept, setDept }}>
      <div className="min-h-screen bg-canvas lg:flex">
        <aside className="no-print sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
          <AppLink href="/" className="flex items-center gap-2 px-2 text-[16px] font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white">W</span>
            WellFit
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">for HR</span>
          </AppLink>
          <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
            <Building className="h-4 w-4 text-slate-500" />
            <div className="text-[12.5px] leading-tight">
              <div className="font-semibold">(주){COMPANY.name}</div>
              <div className="text-slate-500">임직원 {COMPANY.employees.toLocaleString()}명</div>
            </div>
          </div>
          <nav className="mt-5 flex-1 space-y-0.5">
            {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
              const active = current.href === href;
              return (
                <AppLink
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition",
                    active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50",
                  )}
                >
                  <Icon className={cn("h-[18px] w-[18px]", href === "/admin/ai-insights" && !active && "text-ai-600")} />
                  {label}
                  {href === "/admin/ai-insights" && <span className="ml-auto rounded-md bg-ai-50 px-1.5 text-[10.5px] font-bold text-ai-700">5</span>}
                </AppLink>
              );
            })}
          </nav>
          <div className="rounded-xl border border-slate-200 p-3 text-[12px] leading-relaxed text-slate-500">
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> 개인정보 보호 모드
            </div>
            부서·조직 단위 익명 집계만 제공합니다. {minGroup}명 미만 그룹은 비공개 처리됩니다.
          </div>
          <div className="mt-3 flex gap-1">
            <AppLink href="/employee" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] font-semibold text-slate-500 hover:bg-slate-50">
              <Smartphone className="h-3.5 w-3.5" /> 임직원 앱
            </AppLink>
            <button
              onClick={() => {
                resetDemo();
                toast({ title: "데모 데이터를 초기화했어요", tone: "info" });
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] font-semibold text-slate-500 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" /> 초기화
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-8">
              <AppLink href="/" className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white lg:hidden">W</AppLink>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[18px] font-bold tracking-tight sm:text-[20px]">{current.label}</h1>
                <p className="hidden truncate text-[12.5px] text-slate-500 sm:block">{current.desc} · {COMPANY.quarterLabel}</p>
              </div>
              {showPeriod && (
                <Segmented
                  size="sm"
                  value={period}
                  onChange={setPeriod}
                  options={(Object.keys(PERIOD_LABEL) as Period[]).map((p) => ({ value: p, label: PERIOD_LABEL[p] }))}
                />
              )}
            </div>
            <div className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden">
              {ADMIN_NAV.map(({ href, label }) => (
                <AppLink
                  key={href}
                  href={href}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold",
                    current.href === href ? "bg-brand-50 text-brand-700" : "text-slate-500",
                  )}
                >
                  {label}
                </AppLink>
              ))}
            </div>
          </header>
          <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-8 sm:py-8">{hydrated ? children : <Loader />}</main>
        </div>
      </div>
    </FilterCtx.Provider>
  );
}
