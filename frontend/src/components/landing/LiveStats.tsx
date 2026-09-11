"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetch } from "@/lib/api";
import { Reveal } from "@/components/layout/Reveal";
import { CountUp } from "./CountUp";

type Stats = { industries: number; offices: number; regions: number };

/** DB 기준 실제 수치. 불러오지 못하면 섹션을 표시하지 않습니다. */
export function LiveStats() {
  const { data } = useApiQuery("stats", (signal) => apiFetch<Stats>("/api/stats", { signal }));
  if (!data) return null;
  const items = [
    { label: "비상주 등록 가능 업종", value: data.industries, suffix: "개" },
    { label: "지점", value: data.offices, suffix: "개" },
    { label: "지점이 있는 지역", value: data.regions, suffix: "곳" },
  ];
  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pt-14 sm:px-6 lg:px-10 lg:pt-16" aria-label="현재 데이터 기준 수치">
      <dl className="grid grid-cols-3 gap-4 text-center">
        {items.map((s, i) => (
          <Reveal key={s.label} index={i} className="rounded-2xl bg-surface px-4 py-6">
            <dd className="text-[34px] font-bold tracking-[-0.03em] text-ink sm:text-[44px]">
              <CountUp to={s.value} suffix={s.suffix} />
            </dd>
            <dt className="mt-1 text-sm text-ink-2">{s.label}</dt>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
