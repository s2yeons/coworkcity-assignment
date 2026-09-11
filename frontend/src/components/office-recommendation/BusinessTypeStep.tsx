import { cn } from "@/lib/utils";
import { BUSINESS_TYPES } from "@/lib/office-recommendation/constants";
import type { BusinessType } from "@/lib/office-recommendation/types";

type Props = {
  value: BusinessType | null;
  onChange: (businessType: BusinessType) => void;
};

export function BusinessTypeStep({ value, onChange }: Props) {
  return (
    <section aria-labelledby="business-type-heading">
      <h2 id="business-type-heading" className="text-[22px] font-bold tracking-[-0.02em] text-ink sm:text-[26px]">
        어떤 사업자 유형인가요?
      </h2>
      <p className="mt-2 text-[15px] text-ink-2">
        지점마다 지원하는 유형이 달라요. 법인은 비과밀 지역이면 등록면허세 중과가 없어요.
      </p>

      <div role="group" aria-labelledby="business-type-heading" className="mt-6 grid gap-3 sm:grid-cols-2">
        {BUSINESS_TYPES.map((type) => {
          const isSelected = type.id === value;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onChange(type.id)}
              aria-pressed={isSelected}
              className={cn(
                "flex min-h-28 items-start gap-3 rounded-2xl border bg-white p-6 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
                isSelected
                  ? "border-brand-500 bg-brand-50/50 ring-1 ring-brand-500"
                  : "border-line hover:border-brand-300",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-xs",
                  isSelected ? "border-brand-500 bg-brand-500 text-white" : "border-line-2 text-transparent",
                )}
              >
                ✓
              </span>
              <span>
                <span className="block text-lg font-semibold text-ink">{type.label}</span>
                <span className="mt-1 block text-sm text-ink-2">{type.description}</span>
                {isSelected && <span className="sr-only">(선택됨)</span>}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
