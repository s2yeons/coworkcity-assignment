import { cn } from "@/lib/utils";
import type { ApiQueryResult } from "@/hooks/useApiQuery";
import { REGIONS } from "@/lib/office-recommendation/constants";
import type { RegionCount, RegionId } from "@/lib/office-recommendation/types";

type Props = {
  value: RegionId | null;
  onChange: (regionId: RegionId) => void;
  /** 앞 단계 조건(업종·사업자 유형)을 이미 적용한 지역별 지점 수 (API) */
  counts: ApiQueryResult<{ items: RegionCount[] }>;
};

export function RegionStep({ value, onChange, counts }: Props) {
  const countByLabel = new Map(counts.data?.items.map((item) => [item.region, item.count]));
  const total = counts.data?.items.reduce((sum, item) => sum + item.count, 0) ?? 0;

  return (
    <section aria-labelledby="region-heading">
      <h2 id="region-heading" className="text-[22px] font-bold tracking-[-0.02em] text-ink sm:text-[26px]">
        어느 지역의 비상주사무실을 찾고 계신가요?
      </h2>
      <p className="mt-2 text-[15px] text-ink-2">
        사업자등록 주소로 쓸 지역이에요. 지점 수는 앞에서 고른 업종·사업자 유형을 반영한 값이에요.
      </p>
      {counts.error && (
        <p className="mt-2 text-sm text-ink-2" role="status">
          지역별 지점 수를 불러오지 못했어요. 지역은 그대로 선택할 수 있어요.
        </p>
      )}

      <div role="group" aria-labelledby="region-heading" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {REGIONS.map((region) => {
          const isSelected = region.id === value;
          const count = region.id === "all" ? total : (countByLabel.get(region.label) ?? 0);
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => onChange(region.id)}
              aria-pressed={isSelected}
              className={cn(
                "flex min-h-[72px] flex-col items-start justify-center rounded-xl border bg-white px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
                isSelected
                  ? "border-brand-500 bg-brand-50/50 ring-1 ring-brand-500"
                  : "border-line hover:border-brand-300",
              )}
            >
              <span className="flex items-center gap-2 font-medium text-ink">
                {isSelected && (
                  <span aria-hidden="true" className="text-brand-600">
                    ✓
                  </span>
                )}
                {region.label}
                {isSelected && <span className="sr-only">(선택됨)</span>}
              </span>
              <span className={cn("mt-0.5 text-xs", count > 0 ? "text-ink-3" : "text-ink-3")}>
                {counts.isLoading && !counts.data ? "확인 중" : counts.error ? "" : `${count}개 지점`}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
