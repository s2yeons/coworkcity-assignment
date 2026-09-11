import { useId } from "react";
import { cn } from "@/lib/utils";
import { PRICE_OPTIONS } from "@/lib/office-recommendation/constants";
import type { Industry, RecommendationFilters } from "@/lib/office-recommendation/types";

type Props = {
  filters: RecommendationFilters;
  industry: Industry | null;
  onChange: (patch: Partial<RecommendationFilters>) => void;
};

export function AdditionalFilterStep({ filters, industry, onChange }: Props) {
  const nonCongestedId = useId();
  const permitId = useId();
  const priceName = useId();
  const permitLocked = industry?.registrationStatus === "PERMIT_REQUIRED";

  return (
    <section aria-labelledby="additional-heading">
      <h2 id="additional-heading" className="text-[22px] font-bold tracking-[-0.02em] text-ink sm:text-[26px]">
        추가 조건이 있다면 선택하세요
      </h2>
      <p className="mt-2 text-sm text-ink-3">
        선택하지 않아도 괜찮아요. 선택한 조건을 충족하는 지점을 먼저 보여드리고, 충족 여부를 카드에 표시해요.
      </p>

      <fieldset className="mt-6 rounded-2xl border border-line bg-white p-6">
        <legend className="px-1 text-sm font-semibold text-ink-2">추가 조건</legend>
        <div className="mt-2 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <input
              id={nonCongestedId}
              type="checkbox"
              checked={filters.nonCongested}
              onChange={(e) => onChange({ nonCongested: e.target.checked })}
              className="mt-1 size-5 shrink-0 accent-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            />
            <label htmlFor={nonCongestedId} className="cursor-pointer">
              <span className="block font-medium text-ink">비과밀 지역</span>
              <span className="mt-0.5 block text-sm text-ink-3">
                {filters.businessType === "CORPORATE"
                  ? "법인은 비과밀 지역에서 등록세 중과가 적용되지 않아 설립 비용을 줄일 수 있어요."
                  : "과밀억제권역 밖에 있는 지점을 우선 보여드려요."}
              </span>
            </label>
          </div>

          <div className="flex items-start gap-3">
            <input
              id={permitId}
              type="checkbox"
              checked={permitLocked || filters.permitAddressSupported}
              disabled={permitLocked}
              aria-describedby={permitLocked ? `${permitId}-desc` : undefined}
              onChange={(e) => onChange({ permitAddressSupported: e.target.checked })}
              className="mt-1 size-5 shrink-0 accent-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed"
            />
            <label htmlFor={permitId} className={cn(!permitLocked && "cursor-pointer")}>
              <span className="block font-medium text-ink">인허가 업종 주소지 지원</span>
              <span id={`${permitId}-desc`} className="mt-0.5 block text-sm text-ink-3">
                {permitLocked && industry
                  ? `'${industry.name}'은(는) 인허가 요건 확인이 필요한 업종이라 인허가 업종 주소지를 지원하는 지점만 보여드려요. (자동 적용)`
                  : "인허가가 필요한 업종의 주소지로 사용할 수 있는 지점을 우선 보여드려요."}
              </span>
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset className="mt-4 rounded-2xl border border-line bg-white p-6">
        <legend className="px-1 text-sm font-semibold text-ink-2">가격</legend>
        <p className="mt-1 text-sm text-ink-3">
          연 결제 지점은 12개월로 나눈 월환산 금액으로 비교해요.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {PRICE_OPTIONS.map((option) => {
            const id = `${priceName}-${option.value ?? "all"}`;
            const isSelected = option.value === filters.maxMonthlyPrice;
            return (
              <div key={id}>
                <input
                  id={id}
                  type="radio"
                  name={priceName}
                  checked={isSelected}
                  onChange={() => onChange({ maxMonthlyPrice: option.value })}
                  className="peer sr-only"
                />
                <label
                  htmlFor={id}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500",
                    isSelected
                      ? "border-brand-500 bg-brand-50 font-medium text-brand-900 ring-1 ring-brand-500"
                      : "border-line text-ink-2 hover:border-brand-300",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border",
                      isSelected ? "border-brand-500" : "border-line-2",
                    )}
                  >
                    {isSelected && <span className="size-2 rounded-full bg-brand-500" />}
                  </span>
                  {option.label}
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}
