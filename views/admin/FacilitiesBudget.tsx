"use client";

import { ArrowRight, Sparkles, Star } from "lucide-react";
import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { useStore } from "@/lib/store";
import { cn, num, won } from "@/lib/format";
import { PARTNERS } from "@/lib/data/company";
import { facilityDecision, weightedRet12, type FacilityDecision } from "@/lib/ai/insights";
import { Badge, Card, SectionTitle, useToast, type Tone } from "@/components/ui";
import { axisProps, gridProps, SERIES } from "@/components/charts";

const DECISIONS: FacilityDecision[] = ["유지", "확대", "축소", "교체 검토"];
const DTONE: Record<FacilityDecision, Tone> = { 유지: "blue", 확대: "green", 축소: "orange", "교체 검토": "red" };
const FACTOR: Record<FacilityDecision, number> = { 유지: 1, 확대: 1.3, 축소: 0.75, "교체 검토": 0.3 };

export default function FacilitiesBudget() {
  const s = useStore();
  const toast = useToast();
  const rows = PARTNERS.map((p) => {
    const ai = facilityDecision(p);
    const final = s.facilityOverrides[p.id] ?? ai.decision;
    const cost = p.users * p.costPerUser * 3;
    return { p, ai, final, cost, next: Math.round(cost * FACTOR[final]) };
  });
  const totalCost = rows.reduce((a, r) => a + r.cost, 0);
  const totalNext = rows.reduce((a, r) => a + r.next, 0);
  const users = PARTNERS.reduce((a, p) => a + p.users, 0);
  const lowCount = PARTNERS.filter((p) => p.usage < 20).length;
  const avgRet = weightedRet12();
  const scatter = PARTNERS.map((p) => ({ x: Math.round(p.costPerUser / 1000), y: p.ret12, z: p.users, name: p.name.split(" · ")[0] }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-5"><div className="text-[13px] font-semibold text-slate-500">분기 제휴비용</div><div className="mt-1.5 text-[26px] font-bold tabular">{won(totalCost)}</div></Card>
        <Card className="p-5"><div className="text-[13px] font-semibold text-slate-500">제휴 이용자</div><div className="mt-1.5 text-[26px] font-bold tabular">{num(users)}명</div></Card>
        <Card className="p-5"><div className="text-[13px] font-semibold text-slate-500">평균 12주 지속률</div><div className="mt-1.5 text-[26px] font-bold tabular">{avgRet.toFixed(0)}%</div></Card>
        <Card className="p-5"><div className="text-[13px] font-semibold text-slate-500">이용률 20% 미만</div><div className="mt-1.5 text-[26px] font-bold tabular text-red-600">{lowCount}곳</div></Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5">
          <SectionTitle
            title="시설별 성과"
            sub="AI 제안을 참고해 담당자가 최종 결정을 선택하세요 · 결정은 다음 분기 예산에 반영됩니다"
            action={<Badge tone="purple" icon={<Sparkles className="h-3 w-3" />}>AI 제휴 조정 제안</Badge>}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-[13.5px]">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-[12px] text-slate-500">
                <th className="px-5 py-2.5 font-semibold">시설</th>
                <th className="px-3 py-2.5 text-right font-semibold">이용자 수</th>
                <th className="px-3 py-2.5 text-right font-semibold">월 이용률</th>
                <th className="px-3 py-2.5 text-right font-semibold">12주 지속률</th>
                <th className="px-3 py-2.5 text-right font-semibold">만족도</th>
                <th className="px-3 py-2.5 text-right font-semibold">1인당 비용</th>
                <th className="px-3 py-2.5 font-semibold">AI 제안</th>
                <th className="px-5 py-2.5 font-semibold">최종 결정</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, ai, final }) => (
                <tr key={p.id} className="border-b border-slate-50 align-top tabular">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-[12px] text-slate-400">{p.type} · 이용자 {p.trend > 0 ? "+" : ""}{p.trend}%</div>
                  </td>
                  <td className="px-3 py-3.5 text-right">{p.users}명</td>
                  <td className={cn("px-3 py-3.5 text-right font-semibold", p.usage < 20 && "text-red-600")}>{p.usage}%</td>
                  <td className={cn("px-3 py-3.5 text-right font-semibold", p.ret12 >= 75 && "text-emerald-700")}>{p.ret12}%</td>
                  <td className="px-3 py-3.5 text-right"><span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{p.satisfaction}</span></td>
                  <td className="px-3 py-3.5 text-right">{num(p.costPerUser)}원</td>
                  <td className="max-w-[220px] px-3 py-3.5">
                    <Badge tone={DTONE[ai.decision]}>{ai.decision}</Badge>
                    <div className="mt-1 text-[11.5px] leading-snug text-slate-500">{ai.reason}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {DECISIONS.map((d) => (
                        <button
                          key={d}
                          onClick={() => {
                            s.setFacilityOverride(p.id, d === ai.decision ? null : d);
                            toast({ title: `${p.name.split(" · ")[0]} → ${d}`, tone: "info" });
                          }}
                          className={cn(
                            "rounded-md px-2 py-1 text-[11.5px] font-semibold transition",
                            final === d ? (d === "교체 검토" ? "bg-red-600 text-white" : d === "축소" ? "bg-orange-500 text-white" : d === "확대" ? "bg-emerald-600 text-white" : "bg-brand-600 text-white") : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                    {s.facilityOverrides[p.id] && <div className="mt-1 text-[11px] text-orange-600">담당자 변경</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-5">
          <SectionTitle title="비용 대비 지속 효과" sub="X: 1인당 월 비용(천원) · Y: 12주 지속률 · 점 크기: 이용자 수" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid {...gridProps} vertical />
                <XAxis type="number" dataKey="x" domain={[0, 70]} {...axisProps} unit="천" />
                <YAxis type="number" dataKey="y" domain={[30, 90]} {...axisProps} unit="%" />
                <ZAxis type="number" dataKey="z" range={[60, 600]} />
                <ReferenceLine y={avgRet} stroke="#94A3B8" strokeDasharray="4 4" label={{ value: "평균", position: "insideTopRight", fill: "#94A3B8", fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as { name: string; x: number; y: number; z: number };
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] shadow-float">
                        <div className="font-semibold">{d.name}</div>
                        <div className="text-slate-600">1인당 {d.x}천원 · 12주 {d.y}% · {d.z}명</div>
                      </div>
                    );
                  }}
                />
                <Scatter data={scatter} fill={SERIES.a} fillOpacity={0.7} stroke="#fff" strokeWidth={1.5} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle title="다음 분기 예산 시뮬레이션" sub="최종 결정 기준" />
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div>
              <div className="text-[12px] text-slate-500">이번 분기</div>
              <div className="text-[20px] font-bold tabular">{won(totalCost)}</div>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400" />
            <div className="text-right">
              <div className="text-[12px] text-slate-500">다음 분기</div>
              <div className="text-[20px] font-bold tabular">{won(totalNext)}</div>
            </div>
          </div>
          <div className={cn("mt-2 text-right text-[13px] font-semibold", totalNext <= totalCost ? "text-emerald-600" : "text-orange-600")}>
            {totalNext <= totalCost ? `${won(totalCost - totalNext)} 절감` : `${won(totalNext - totalCost)} 증액`}
          </div>
          <div className="mt-4 space-y-2">
            {DECISIONS.map((d) => {
              const list = rows.filter((r) => r.final === d);
              if (!list.length) return null;
              return (
                <div key={d} className="flex items-start gap-2 text-[13px]">
                  <Badge tone={DTONE[d]} className="mt-0.5">{d}</Badge>
                  <span className="text-slate-600">{list.map((r) => r.p.name.split(" · ")[0]).join(", ")}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl bg-ai-50 p-3.5 text-[12.5px] leading-relaxed text-ai-700">
            <b>AI 제안</b> · 교체 검토 시설의 절감액을 필라테스 B 정원 확대와 개발팀 점심 프로그램에 재배치하면 12주 지속 인원이 약 20명 늘어날 것으로 추정됩니다.
          </div>
        </Card>
      </div>
    </div>
  );
}
