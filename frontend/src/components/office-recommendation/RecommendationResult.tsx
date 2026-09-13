"use client";

import { useState } from "react";
import type { ApiQueryResult } from "@/hooks/useApiQuery";
import { OfficeMap, type MapPin } from "@/components/map/OfficeMap";
import { BUSINESS_TYPE_LABEL, REGION_LABEL } from "@/lib/office-recommendation/constants";
import { getPriceOptionLabel, type Step } from "@/lib/office-recommendation/search-params";
import type {
  Industry,
  RecommendationFilters,
  RecommendationResponse,
  RelaxationSuggestion,
} from "@/lib/office-recommendation/types";
import { RegistrationStatusBadge } from "./Badge";
import { OfficeCard } from "./OfficeCard";
import { CardSkeletons, ErrorState } from "./QueryStates";

type Props = {
  filters: RecommendationFilters;
  /** 부모가 별도로 조회한 선택 업종 (추천 요청이 실패해도 조건 요약에 이름을 표시하기 위함) */
  industry: Industry | null;
  query: ApiQueryResult<RecommendationResponse>;
  backQuery: string;
  onEditStep: (step: Step) => void;
  onApplySuggestion: (suggestion: RelaxationSuggestion) => void;
};

function selectedConditionCountOf(f: RecommendationFilters) {
  return (f.nonCongested ? 1 : 0) + (f.permitAddressSupported ? 1 : 0) + (f.maxMonthlyPrice !== null ? 1 : 0);
}

export function RecommendationResult({ filters, industry, query, backQuery, onEditStep, onApplySuggestion }: Props) {
  const { data, error, isLoading, refetch } = query;
  const [activeId, setActiveId] = useState<string | null>(null);
  const pins: MapPin[] = (data?.items ?? [])
    .filter((item) => item.lat !== null && item.lng !== null)
    .map((item, index) => ({
      id: item.id,
      name: item.name,
      lat: item.lat as number,
      lng: item.lng as number,
      rank: index + 1,
      emphasized: selectedConditionCountOf(filters) > 0 && item.unmetConditions.length === 0,
    }));
  const focusCard = (id: string) => {
    setActiveId(id);
    document.getElementById(`office-card-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const selectedConditionCount = selectedConditionCountOf(filters);
  const fullyMatched = data?.items.filter((item) => item.unmetConditions.length === 0).length ?? 0;

  const conditionChips: Array<{ label: string; step: Step }> = [
    { label: data?.industry.name ?? industry?.name ?? filters.industryId ?? "", step: 1 },
    { label: filters.businessType ? BUSINESS_TYPE_LABEL[filters.businessType] : "", step: 2 },
    { label: filters.regionId ? REGION_LABEL[filters.regionId] : "", step: 3 },
    ...(filters.nonCongested ? [{ label: "비과밀 지역", step: 4 as Step }] : []),
    ...(filters.permitAddressSupported ? [{ label: "인허가 업종 주소지 지원", step: 4 as Step }] : []),
    ...(filters.maxMonthlyPrice !== null
      ? [{ label: getPriceOptionLabel(filters.maxMonthlyPrice), step: 4 as Step }]
      : []),
  ];

  return (
    <section aria-labelledby="result-heading">
      <div className="rounded-3xl border border-brand-100 bg-brand-50/70 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink-2">내 조건</h2>
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="inline-flex min-h-10 items-center text-sm font-medium text-brand-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            조건 다시 설정하기
          </button>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {conditionChips.map((chip) => (
            <li key={`${chip.step}-${chip.label}`}>
              <button
                type="button"
                onClick={() => onEditStep(chip.step)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-brand-100 bg-white px-3.5 text-sm font-medium text-ink shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors hover:border-brand-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                {chip.label}
                <span aria-hidden="true" className="text-brand-500">✎</span>
                <span className="sr-only">(수정)</span>
              </button>
            </li>
          ))}
        </ul>
        {data && data.industry.registrationStatus !== "AVAILABLE" && data.industry.note && (
          <p className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink-2">
            <RegistrationStatusBadge status={data.industry.registrationStatus} />
            <span>{data.industry.note}</span>
          </p>
        )}
      </div>

      <div className="mt-10 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="result-heading" className="text-[22px] font-bold tracking-[-0.02em] text-ink sm:text-[26px]" aria-live="polite">
          {isLoading
            ? "조건에 맞는 지점을 찾는 중이에요"
            : error
              ? "지점을 불러오지 못했어요"
              : data && data.total > 0
                ? `내 조건에 맞는 지점 ${data.total}개`
                : "조건에 맞는 지점을 찾지 못했어요"}
        </h2>
        {data && data.total > 0 && selectedConditionCount > 0 && (
          <p className="text-sm text-ink-3">추가 조건 모두 충족 {fullyMatched}개</p>
        )}
      </div>

      {isLoading ? (
        <div className="mt-4">
          <CardSkeletons label="조건에 맞는 지점을 찾는 중" />
        </div>
      ) : error ? (
        <div className="mt-4">
          <ErrorState error={error} onRetry={refetch} />
        </div>
      ) : data && data.total > 0 ? (
        <>
          {selectedConditionCount > 0 && (
            <p className="mt-1 text-sm text-ink-3">
              추가 조건을 많이 충족하는 지점을 먼저 보여드려요.
            </p>
          )}
          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_400px] lg:items-start">
            <OfficeMap
              pins={pins}
              activeId={activeId}
              onPinClick={focusCard}
              className="h-64 lg:order-2 lg:sticky lg:top-24 lg:h-[560px]"
            />
            <ul className="grid gap-5 md:grid-cols-2 lg:order-1">
              {data.items.map((item, index) => (
                <li key={item.id} className="flex">
                  <OfficeCard
                    item={item}
                    rank={index + 1}
                    industryName={data.industry.name}
                    selectedConditionCount={selectedConditionCount}
                    backQuery={backQuery}
                    active={activeId === item.id}
                    onHover={setActiveId}
                  />
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-line-2 bg-white p-10 text-center">
          <p className="text-ink-2">
            조건을 조금 완화하면
            <br />
            더 많은 지점을 확인할 수 있어요.
          </p>

          {data && data.suggestions.length > 0 && (
            <div className="mx-auto mt-6 max-w-md text-left">
              <p className="text-sm font-semibold text-ink-2">이렇게 바꿔 보세요</p>
              <ul className="mt-2 flex flex-col gap-2">
                {data.suggestions.map((s) => (
                  <li key={s.label}>
                    <button
                      type="button"
                      onClick={() => onApplySuggestion(s)}
                      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-line bg-white px-4 text-left text-sm text-ink transition-colors hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                    >
                      <span>{s.label}</span>
                      <span className="shrink-0 font-semibold text-brand-700">{s.count}개 보기</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="mt-6 min-h-12 rounded-lg bg-brand-500 px-6 font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            조건 다시 설정
          </button>
        </div>
      )}
    </section>
  );
}
