"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Info, Lock, Minus, Sparkles, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/format";

export type Tone = "blue" | "green" | "orange" | "red" | "purple" | "gray";

export const TONE_TEXT: Record<Tone, string> = {
  blue: "text-brand-600",
  green: "text-emerald-600",
  orange: "text-orange-600",
  red: "text-red-600",
  purple: "text-ai-600",
  gray: "text-slate-500",
};
export const TONE_BG: Record<Tone, string> = {
  blue: "bg-brand-50 text-brand-700",
  green: "bg-emerald-50 text-emerald-700",
  orange: "bg-orange-50 text-orange-700",
  red: "bg-red-50 text-red-700",
  purple: "bg-ai-50 text-ai-700",
  gray: "bg-slate-100 text-slate-600",
};
export const TONE_FILL: Record<Tone, string> = {
  blue: "bg-brand-600",
  green: "bg-emerald-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  purple: "bg-ai-600",
  gray: "bg-slate-400",
};
export const TONE_HEX: Record<Tone, string> = {
  blue: "#2563EB",
  green: "#10B981",
  orange: "#F97316",
  red: "#EF4444",
  purple: "#7C3AED",
  gray: "#94A3B8",
};

export function Card({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn("min-w-0 rounded-2xl border border-slate-200/70 bg-white shadow-card", onClick && "cursor-pointer transition hover:border-slate-300", className)}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ title, sub, action, className }: { title: ReactNode; sub?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <div>
        <h2 className="text-[17px] font-bold tracking-tight text-ink">{title}</h2>
        {sub && <p className="mt-0.5 text-[13px] text-slate-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Badge({ tone = "gray", children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-semibold", TONE_BG[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

export function AiTag({ label = "AI 추정", className }: { label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-ai-50 px-2 py-0.5 text-[11px] font-semibold text-ai-700", className)}>
      <Sparkles className="h-3 w-3" />
      {label}
    </span>
  );
}

type BtnVariant = "primary" | "secondary" | "ghost" | "ai" | "outline" | "dark" | "danger";
const BTN: Record<BtnVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700 disabled:bg-brand-200",
  secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 disabled:text-slate-400",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  ai: "bg-ai-600 text-white hover:bg-ai-700 disabled:bg-ai-200",
  outline: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
  dark: "bg-ink text-white hover:bg-slate-800",
  danger: "bg-red-50 text-red-700 hover:bg-red-100",
};

export function Button({
  variant = "primary", size = "md", icon, className, children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" | "lg"; icon?: ReactNode }) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex select-none items-center justify-center gap-1.5 rounded-xl font-semibold transition disabled:cursor-not-allowed",
        size === "sm" && "h-8 px-3 text-[13px]",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-5 text-[15px]",
        BTN[variant],
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function Progress({ value, tone = "blue", className, track = "bg-slate-100" }: { value: number; tone?: Tone; className?: string; track?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full", track, className)}>
      <div className={cn("h-full rounded-full transition-all duration-500", TONE_FILL[tone])} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Ring({
  value, size = 120, stroke = 10, tone = "blue", children, track = "#EEF2F7",
}: { value: number; size?: number; stroke?: number; tone?: Tone; children?: ReactNode; track?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={TONE_HEX[tone]} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function Segmented<T extends string | number>({
  options, value, onChange, size = "md", className,
}: { options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; size?: "sm" | "md"; className?: string }) {
  return (
    <div className={cn("inline-flex rounded-xl bg-slate-100 p-1", className)} role="tablist">
      {options.map((o) => (
        <button
          key={String(o.value)}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg font-semibold transition",
            size === "sm" ? "px-2.5 py-1 text-[12.5px]" : "px-3.5 py-1.5 text-[13px]",
            o.value === value ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-slate-700",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, onClick, children, className }: { active?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition",
        active ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** 증감 표시. good/bad는 지표 방향(higherIsBetter)에 따라 결정 */
export function Delta({ value, higherIsBetter = true, suffix = "%p", digits = 0, className }: { value: number; higherIsBetter?: boolean; suffix?: string; digits?: number; className?: string }) {
  const good = value === 0 ? null : (value > 0) === higherIsBetter;
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[12.5px] font-semibold tabular", good === null ? "text-slate-500" : good ? "text-emerald-600" : "text-red-600", className)}>
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(value).toFixed(digits)}
      {suffix}
    </span>
  );
}

export function InfoTip({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("group relative inline-flex", className)} tabIndex={0}>
      <Info className="h-3.5 w-3.5 cursor-help text-slate-400" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-56 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-[12px] font-normal leading-relaxed text-white shadow-float group-hover:block group-focus:block">
        {text}
      </span>
    </span>
  );
}

export function Masked({ n, min, compact }: { n: number; min: number; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-400" title={`${n}명 — 최소 공개 기준 ${min}명 미만`}>
      <Lock className="h-3 w-3" />
      {compact ? "비공개" : `비공개 (n<${min})`}
    </span>
  );
}

export function Sheet({
  open, onClose, title, children, footer, wide,
}: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade bg-slate-900/40" onClick={onClose} />
      <div
        className={cn(
          "relative flex max-h-[88vh] w-full animate-sheet flex-col overflow-hidden rounded-t-3xl bg-white shadow-float sm:rounded-3xl",
          wide ? "sm:max-w-2xl" : "sm:max-w-md",
        )}
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <div className="text-[17px] font-bold">{title}</div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100" aria-label="닫기">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="border-t border-slate-100 bg-white px-5 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">{footer}</div>}
      </div>
    </div>
  );
}

/* ----------------------------- Toast ----------------------------- */

interface ToastItem {
  id: number;
  title: string;
  desc?: string;
  tone?: "success" | "info" | "warning";
}
const ToastCtx = createContext<(t: Omit<ToastItem, "id">) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const show = useCallback((t: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs, { ...t, id }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[80] flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div key={t.id} className="pointer-events-auto flex w-full max-w-sm animate-toast items-start gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-float">
            {t.tone === "warning" ? (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />
            ) : t.tone === "info" ? (
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-300" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            )}
            <div>
              <div className="text-sm font-semibold">{t.title}</div>
              {t.desc && <div className="mt-0.5 text-[12.5px] text-slate-300">{t.desc}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}

export function RangeInput({
  value, min, max, step = 1, onChange, className,
}: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; className?: string }) {
  const p = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn("wf-range w-full", className)}
      style={{ ["--p" as string]: `${p}%` }}
    />
  );
}

export function Stat({ label, value, sub, className }: { label: ReactNode; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[12.5px] font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-[22px] font-bold tracking-tight tabular text-ink">{value}</div>
      {sub && <div className="mt-0.5">{sub}</div>}
    </div>
  );
}

export function Loader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-600" />
    </div>
  );
}
