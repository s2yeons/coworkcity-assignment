import { REGIONS } from "@/lib/office-recommendation/constants";

/** 지원 지역이 천천히 흐르는 띠 (랜딩 전용) */
export function RegionMarquee() {
  const items = REGIONS.filter((r) => r.id !== "all").map((r) => r.label);
  const row = [...items, ...items];
  return (
    <div aria-label="지원 지역" className="relative overflow-hidden border-y border-line bg-white py-4">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent" />
      <ul className="flex w-max animate-marquee gap-10 text-[15px] font-semibold text-ink-2">
        {row.map((label, i) => (
          <li key={`${label}-${i}`} className="flex items-center gap-10" aria-hidden={i >= items.length}>
            <span>{label}</span>
            <span className="size-1.5 rounded-full bg-brand-300" />
          </li>
        ))}
      </ul>
    </div>
  );
}
