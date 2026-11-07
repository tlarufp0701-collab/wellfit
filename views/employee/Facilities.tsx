"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Bath, Building2, Car, Heart, Home, MapPin, Navigation, Play, Sparkles, Sprout, Star, CalendarCheck, X, Clock } from "lucide-react";
import { useStore } from "@/lib/store";
import { addDays, cn, fmtDate, toKey } from "@/lib/format";
import { FACILITIES, FACILITY_CATEGORIES, type FacilityCategory } from "@/lib/data/catalog";
import { SLOT_LABEL } from "@/lib/data/employee";
import { fitSentence, scoreFacilities, type Base, type FacilityFit } from "@/lib/ai/facility";
import { AiTag, Badge, Button, Card, Chip, Segmented, Sheet, useToast } from "@/components/ui";
import { useStartWorkout } from "@/components/employee-shell";
import { PageHeader } from "./shared";

export default function Facilities() {
  const s = useStore();
  const toast = useToast();
  const start = useStartWorkout();
  const [base, setBase] = useState<Base>("office");
  const [cat, setCat] = useState<FacilityCategory | "전체">("전체");
  const [flags, setFlags] = useState({ welfare: false, beginner: false, shower: false, parking: false });
  const [detail, setDetail] = useState<FacilityFit | null>(null);
  const [bookDate, setBookDate] = useState(toKey(addDays(s.today, 1)));
  const preferredSlot = s.adjustments.slot ? "lunch" : s.preferredSlot;

  const ranked = useMemo(
    () => scoreFacilities(FACILITIES, s.profile, base, preferredSlot, s.analysis.activity.byType),
    [s.profile, base, preferredSlot, s.analysis.activity.byType],
  );
  const list = ranked.filter(
    (r) =>
      (cat === "전체" || r.facility.category === cat) &&
      (!flags.welfare || r.facility.welfare) &&
      (!flags.beginner || r.facility.beginner) &&
      (!flags.shower || r.facility.shower) &&
      (!flags.parking || r.facility.parking),
  );
  const top = list[0];

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="FACILITIES" title="제휴시설 찾기" sub="회사 복지로 이용할 수 있는 시설을 AI 적합도 순으로 보여드려요." />

      <Segmented
        className="w-full [&>button]:flex-1"
        value={base}
        onChange={setBase}
        options={[
          { value: "office", label: <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" />회사 주변</span> },
          { value: "home", label: <span className="inline-flex items-center gap-1.5"><Home className="h-4 w-4" />집 주변</span> },
        ]}
      />

      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        {(["전체", ...FACILITY_CATEGORIES] as const).map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>
        ))}
      </div>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        {([["welfare", "복지 적용"], ["beginner", "초보자 추천"], ["shower", "샤워"], ["parking", "주차"]] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFlags((f) => ({ ...f, [k]: !f[k] }))}
            className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-[12.5px] font-semibold", flags[k] ? "bg-ink text-white" : "bg-slate-100 text-slate-600")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 지도 */}
      <Card className="overflow-hidden">
        <div className="relative h-52 bg-[#EEF3F8]">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <path d="M0 62 C 25 55, 40 70, 60 60 S 90 50, 100 56" stroke="#CFE0F5" strokeWidth="7" fill="none" />
            <path d="M0 30 L100 38" stroke="#fff" strokeWidth="2.4" />
            <path d="M30 0 L38 100" stroke="#fff" strokeWidth="2.4" />
            <path d="M70 0 L64 100" stroke="#fff" strokeWidth="1.6" />
            <path d="M0 82 L100 76" stroke="#fff" strokeWidth="1.6" />
            <rect x="8" y="8" width="14" height="12" rx="2" fill="#E3EBD9" />
            <rect x="76" y="64" width="16" height="10" rx="2" fill="#E3EBD9" />
          </svg>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white shadow-float ring-4 ring-white">
              {base === "office" ? <Building2 className="h-4 w-4" /> : <Home className="h-4 w-4" />}
            </div>
          </div>
          {list.map((r, i) => {
            const [x, y] = r.facility.pos[base];
            return (
              <button
                key={r.facility.id}
                onClick={() => setDetail(r)}
                className="absolute -translate-x-1/2 -translate-y-full"
                style={{ left: `${x}%`, top: `${y}%` }}
                aria-label={r.facility.name}
              >
                <span className={cn("flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-bold shadow-card", i === 0 ? "bg-brand-600 text-white" : "bg-white text-ink")}>
                  <MapPin className="h-3 w-3" />
                  {r.fit}%
                </span>
              </button>
            );
          })}
          <div className="absolute bottom-2 left-2 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-600">
            {base === "office" ? s.profile.office : s.profile.home} 기준 · {list.length}곳
          </div>
        </div>
      </Card>

      {/* 예약 */}
      {s.bookings.length > 0 && (
        <Card className="p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold"><CalendarCheck className="h-4 w-4 text-brand-600" /> 내 예약</div>
          <div className="space-y-2">
            {s.bookings.map((b) => {
              const f = FACILITIES.find((x) => x.id === b.facilityId)!;
              return (
                <div key={b.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-[13px]">
                  <div>
                    <b>{f.name}</b>
                    <div className="text-slate-500">{fmtDate(b.date, "mdw")} · {b.label}</div>
                  </div>
                  <button onClick={() => { s.cancelBooking(b.id); toast({ title: "예약을 취소했어요", tone: "info" }); }} className="rounded-full p-1 text-slate-400 hover:bg-white" aria-label="예약 취소">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* AI 1순위 */}
      {top && (
        <Card className="border-ai-100 p-5" onClick={() => setDetail(top)}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-ai-700"><Sparkles className="h-4 w-4" /> AI 추천 1순위</span>
            <AiTag label={`적합도 ${top.fit}%`} />
          </div>
          <div className="mt-2 text-[18px] font-bold">{top.facility.name}</div>
          <div className="text-[13px] text-slate-500">{top.distance}km · {top.facility.category} · {top.facility.welfare ? "복지 적용" : "개인 결제"}</div>
          <p className="mt-3 rounded-xl bg-ai-50/70 px-3.5 py-3 text-[13.5px] leading-relaxed text-slate-700">“{fitSentence(top, base, preferredSlot)}”</p>
        </Card>
      )}

      <div className="space-y-2.5">
        {list.slice(1).map((r) => (
          <FacilityCard key={r.facility.id} r={r} fav={s.favorites.includes(r.facility.id)} onOpen={() => setDetail(r)} />
        ))}
        {list.length === 0 && <Card className="p-6 text-center text-[14px] text-slate-500">조건에 맞는 시설이 없어요. 필터를 줄여보세요.</Card>}
      </div>

      <Sheet open={!!detail} onClose={() => setDetail(null)} title={detail?.facility.name}>
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="blue">{detail.facility.category}</Badge>
              <Badge tone={detail.facility.welfare ? "green" : "gray"}>{detail.facility.welfare ? "회사복지 사용 가능" : "복지 미적용"}</Badge>
              {detail.facility.beginner && <Badge tone="purple">초보자 추천</Badge>}
              <Badge tone="gray">{detail.facility.crowd}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 py-3"><div className="text-[11.5px] text-slate-500">거리</div><div className="text-[16px] font-bold">{detail.distance}km</div></div>
              <div className="rounded-xl bg-ai-50 py-3"><div className="text-[11.5px] text-ai-700">AI 적합도</div><div className="text-[16px] font-bold text-ai-700">{detail.fit}%</div></div>
              <div className="rounded-xl bg-slate-50 py-3"><div className="text-[11.5px] text-slate-500">평점</div><div className="flex items-center justify-center gap-0.5 text-[16px] font-bold"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{detail.facility.rating}</div></div>
            </div>
            <div className="rounded-2xl border border-ai-100 p-4">
              <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-ai-700"><Sparkles className="h-4 w-4" /> AI 추천 이유</div>
              <p className="text-[14px] leading-relaxed">{fitSentence(detail, base, preferredSlot)}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {detail.reasons.map((r) => <span key={r} className="rounded-lg bg-slate-50 px-2 py-1 text-[12px] text-slate-600">{r}</span>)}
              </div>
            </div>
            <div className="space-y-2 text-[13.5px]">
              <Row icon={<Clock className="h-4 w-4" />} label="운영" value={detail.facility.hours} />
              <Row icon={<Navigation className="h-4 w-4" />} label="위치" value={`${detail.facility.area[base]} · ${base === "office" ? "회사" : "집"}에서 ${detail.distance}km`} />
              <Row icon={<Sprout className="h-4 w-4" />} label="가능 시간" value={detail.facility.slots.map((x) => SLOT_LABEL[x]).join(" · ")} />
              <Row icon={<Bath className="h-4 w-4" />} label="편의" value={[detail.facility.shower && "샤워", detail.facility.parking && "주차"].filter(Boolean).join(" · ") || "없음"} />
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-[13.5px]">
              <div className="font-semibold">{detail.facility.price}</div>
              <div className="mt-0.5 text-slate-500">{detail.facility.welfareNote}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {detail.facility.programs.map((p) => <Badge key={p} tone="gray">{p}</Badge>)}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[13px] font-semibold text-slate-500">체험 · 1일 이용 예약</div>
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => {
                  const k = toKey(addDays(s.today, n));
                  return <Chip key={k} active={bookDate === k} onClick={() => setBookDate(k)} className="flex-1">{fmtDate(k, "md")}</Chip>;
                })}
              </div>
            </div>
            <div className="grid grid-cols-[auto_1fr_1fr] gap-2">
              <Button
                variant="outline" aria-label="즐겨찾기"
                onClick={() => s.toggleFavorite(detail.facility.id)}
                icon={<Heart className={cn("h-4 w-4", s.favorites.includes(detail.facility.id) && "fill-red-500 text-red-500")} />}
              />
              <Button
                variant="secondary"
                icon={<CalendarCheck className="h-4 w-4" />}
                onClick={() => {
                  s.book(detail.facility.id, detail.facility.category === "PT" || detail.facility.category === "필라테스" ? "체험 수업" : "1일 이용", bookDate);
                  toast({ title: "예약이 완료되었어요", desc: `${detail.facility.name} · ${fmtDate(bookDate, "mdw")}` });
                  setDetail(null);
                }}
              >
                예약
              </Button>
              <Button
                icon={<Play className="h-4 w-4" />}
                onClick={() => {
                  const f = detail.facility;
                  setDetail(null);
                  start({ type: f.types[0], slot: preferredSlot, minutes: 45, facilityId: f.id, title: `${f.name}에서 운동` });
                }}
              >
                여기서 시작
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

function Row({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <span className="w-16 shrink-0 text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function FacilityCard({ r, fav, onOpen }: { r: FacilityFit; fav: boolean; onOpen: () => void }) {
  const f = r.facility;
  return (
    <Card className="p-4" onClick={onOpen}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15.5px] font-bold">{f.name}</span>
            {fav && <Heart className="h-3.5 w-3.5 shrink-0 fill-red-500 text-red-500" />}
          </div>
          <div className="mt-0.5 text-[12.5px] text-slate-500">{r.distance}km · {f.types.join(", ")} · ★ {f.rating}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[11px] font-semibold text-ai-600">AI 적합도</div>
          <div className="text-[18px] font-bold tabular text-ai-700">{r.fit}%</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge tone={f.welfare ? "green" : "gray"}>{f.welfare ? "복지 사용 가능" : "복지 미적용"}</Badge>
        {f.beginner && <Badge tone="purple">초보자 추천</Badge>}
        <span className="ml-auto flex items-center gap-2 text-slate-400">
          <Bath className={cn("h-4 w-4", f.shower ? "text-slate-600" : "opacity-30")} aria-label="샤워" />
          <Car className={cn("h-4 w-4", f.parking ? "text-slate-600" : "opacity-30")} aria-label="주차" />
        </span>
      </div>
    </Card>
  );
}
