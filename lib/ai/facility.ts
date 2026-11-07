import { clamp } from "../format";
import type { Facility } from "../data/catalog";
import type { Profile, Slot } from "../data/employee";

export type Base = "office" | "home";

export interface FacilityFit {
  facility: Facility;
  fit: number;
  distance: number;
  reasons: string[];
}

/** AI 적합도 = 거리 35% + 가능 시간대 25% + 선호/최근 운동 유사도 25% + 수준 15% (+복지 가점) */
export function scoreFacilities(list: Facility[], profile: Profile, base: Base, preferredSlot: Slot, recentTypes: Record<string, number>): FacilityFit[] {
  const totalRecent = Object.values(recentTypes).reduce((a, b) => a + b, 0) || 1;
  return list
    .map((f) => {
      const distance = f.distance[base];
      const distScore = clamp(1 - distance / 5);
      const slotMatch = f.slots.includes(preferredSlot) ? 1 : f.slots.some((s) => profile.availableSlots.includes(s)) ? 0.6 : 0.2;
      const pref = f.types.some((t) => profile.preferred.includes(t)) ? 1 : 0.35;
      const recent = f.types.reduce((s, t) => s + (recentTypes[t] ?? 0), 0) / totalRecent;
      const similarity = clamp(0.7 * pref + 0.3 * clamp(recent * 2.5));
      const level = profile.experience.startsWith("초급") ? (f.beginner ? 1 : 0.3) : 1;
      let fit = 100 * (0.35 * distScore + 0.25 * slotMatch + 0.25 * similarity + 0.15 * level);
      if (!f.welfare) fit -= 8;
      fit = Math.round(clamp(fit, 20, 98));

      const reasons: string[] = [];
      if (distance <= 1) reasons.push(`${base === "office" ? "회사" : "집"}에서 도보 ${Math.max(3, Math.round(distance * 13))}분`);
      else if (distance <= 2.5) reasons.push(`${base === "office" ? "회사" : "집"}에서 ${distance}km`);
      if (f.slots.includes(preferredSlot)) reasons.push(preferredSlot === "lunch" ? "점심시간 클래스 운영" : preferredSlot === "evening" ? "평일 저녁 이용 가능" : "선호 시간대 이용 가능");
      if (pref === 1) reasons.push("최근 선호 운동과 가장 유사");
      if (f.beginner && level === 1) reasons.push("초보자 프로그램 있음");
      if (!f.welfare) reasons.push("복지 미적용 (개인 결제)");
      return { facility: f, fit, distance, reasons };
    })
    .sort((a, b) => b.fit - a.fit);
}

export function fitSentence(r: FacilityFit, base: Base, preferred: Slot = "evening") {
  const parts: string[] = [];
  if (r.distance <= 1.5) parts.push(base === "office" ? "회사와 가깝고" : "집과 가깝고");
  const order: Slot[] = [preferred, ...(["evening", "lunch", "weekend", "morning"] as Slot[]).filter((x) => x !== preferred)];
  const hit = order.find((x) => r.facility.slots.includes(x));
  const label: Record<Slot, string> = { evening: "평일 저녁", lunch: "점심시간", weekend: "주말", morning: "출근 전" };
  if (hit) parts.push(`${label[hit]} 이용이 가능하며`);
  parts.push(r.reasons.includes("최근 선호 운동과 가장 유사") ? "최근 선호 운동과 가장 유사합니다." : "새로운 운동을 시도해보기 좋습니다.");
  return parts.join(" ");
}
