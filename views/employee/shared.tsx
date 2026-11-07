"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, Moon, Smile, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import { AppLink } from "@/lib/nav";
import { Button, RangeInput, Sheet, useToast } from "@/components/ui";

export function PageHeader({ eyebrow, title, sub, back, right }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; back?: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        {back && (
          <AppLink href={back} className="-ml-1.5 mb-1 inline-flex items-center text-[13px] font-semibold text-slate-500">
            <ChevronLeft className="h-4 w-4" /> 뒤로
          </AppLink>
        )}
        {eyebrow && <div className="text-[12px] font-bold tracking-[0.14em] text-brand-600">{eyebrow}</div>}
        <h1 className="mt-0.5 text-[26px] font-bold leading-tight tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-[13.5px] text-slate-500">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

const STRESS_LABEL = ["", "매우 낮음", "낮음", "낮음", "보통", "보통", "약간 높음", "높음", "높음", "매우 높음", "매우 높음"];
const COND_LABEL = ["", "매우 나쁨", "나쁨", "보통", "좋음", "아주 좋음"];

export function CheckInSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <CheckInForm onClose={onClose} />;
}

function CheckInForm({ onClose }: { onClose: () => void }) {
  const { checkIn, saveCheckIn, analysis } = useStore();
  const toast = useToast();
  const [sleep, setSleep] = useState(() => checkIn?.sleep ?? Math.round(analysis.bio.sleepRecent * 2) / 2);
  const [stress, setStress] = useState(() => checkIn?.stress ?? Math.round(analysis.bio.stressRecent));
  const [condition, setCondition] = useState(() => checkIn?.condition ?? 3);

  return (
    <Sheet
      open
      onClose={onClose}
      title="오늘의 컨디션 체크인"
      footer={
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            saveCheckIn({ sleep, stress, condition });
            toast({ title: "체크인 완료", desc: checkIn ? "AI 추천이 업데이트되었어요" : "+10P · AI 추천이 업데이트되었어요" });
            onClose();
          }}
        >
          저장하고 AI 추천 업데이트
        </Button>
      }
    >
      <p className="mb-5 text-[13px] text-slate-500">30초면 끝나요. 답변은 나에게만 보이며, 회사에는 익명 집계로만 활용됩니다.</p>
      <div className="space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[14px] font-semibold"><Moon className="h-4 w-4 text-brand-600" /> 어젯밤 수면</span>
            <b className="tabular">{sleep.toFixed(1)}시간</b>
          </div>
          <RangeInput value={sleep} min={3} max={10} step={0.5} onChange={setSleep} />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[14px] font-semibold"><Zap className="h-4 w-4 text-orange-500" /> 스트레스</span>
            <b className="tabular">{stress}/10 · {STRESS_LABEL[stress]}</b>
          </div>
          <RangeInput value={stress} min={1} max={10} onChange={setStress} />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[14px] font-semibold"><Smile className="h-4 w-4 text-emerald-600" /> 컨디션</span>
            <b>{COND_LABEL[condition]}</b>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => setCondition(v)}
                className={`rounded-xl border py-2.5 text-lg transition ${condition === v ? "border-brand-600 bg-brand-50" : "border-slate-200"}`}
                aria-label={COND_LABEL[v]}
              >
                {["", "😫", "😕", "😐", "🙂", "😄"][v]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

export function WhyList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((r) => (
        <li key={r} className="flex gap-2.5 text-[14px] leading-snug text-slate-700">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ai-600" />
          {r}
        </li>
      ))}
    </ul>
  );
}
