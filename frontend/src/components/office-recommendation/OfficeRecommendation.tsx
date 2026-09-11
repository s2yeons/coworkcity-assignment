"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useApiQuery } from "@/hooks/useApiQuery";
import { getIndustry, getRecommendation, getRegionCounts } from "@/lib/office-recommendation/api";
import { BUSINESS_TYPE_LABEL, REGION_LABEL, regionIdFromLabel } from "@/lib/office-recommendation/constants";
import {
  RESULT_STEP,
  getMaxReachableStep,
  parseFilters,
  parseStep,
  serializeState,
  type Step,
} from "@/lib/office-recommendation/search-params";
import type { RecommendationFilters, RelaxationSuggestion } from "@/lib/office-recommendation/types";
import { AdditionalFilterStep } from "./AdditionalFilterStep";
import { BusinessTypeStep } from "./BusinessTypeStep";
import { IndustryStep } from "./IndustryStep";
import { RecommendationResult } from "./RecommendationResult";
import { RegionStep } from "./RegionStep";
import { StepIndicator } from "./StepIndicator";
import { StepNav } from "./StepNav";

/**
 * 단계형 추천 UI의 컨테이너.
 * - 필터와 현재 단계는 URL search params가 단일 소스 (history API로 갱신 → useSearchParams 동기화)
 * - 데이터(업종, 지역별 지점 수, 추천 결과)는 모두 백엔드 API에서 가져옵니다.
 */
export function OfficeRecommendation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawFilters = useMemo(() => parseFilters(searchParams), [searchParams]);

  // 선택한 업종 상세 (등록 상태·참고사항). URL의 업종 id가 DB에 없으면 선택 해제로 취급합니다.
  const industryQuery = useApiQuery(
    rawFilters.industryId ? `industry:${rawFilters.industryId}` : null,
    (signal) => getIndustry(rawFilters.industryId!, signal),
  );
  const industryNotFound = industryQuery.error?.status === 404;
  const filters: RecommendationFilters = industryNotFound ? { ...rawFilters, industryId: null } : rawFilters;
  const industry = industryQuery.data ?? null;
  const industryStatus = industry?.registrationStatus ?? null;

  const step = parseStep(searchParams, filters, industryStatus);
  const maxReachable = getMaxReachableStep(filters, industryStatus);

  const commit = useCallback(
    (nextFilters: RecommendationFilters, nextStep: Step, mode: "push" | "replace") => {
      const query = serializeState(nextFilters, nextStep);
      const url = query ? `${pathname}?${query}` : pathname;
      if (mode === "push") {
        window.history.pushState(null, "", url);
        window.scrollTo({ top: 0 });
      } else {
        window.history.replaceState(null, "", url);
      }
    },
    [pathname],
  );

  const updateFilters = (patch: Partial<RecommendationFilters>) =>
    commit({ ...filters, ...patch }, step, "replace");
  const goToStep = (next: Step) => commit(filters, next, "push");
  const applySuggestion = (suggestion: RelaxationSuggestion) =>
    commit(
      { ...filters, regionId: regionIdFromLabel(suggestion.region), businessType: suggestion.businessType },
      RESULT_STEP,
      "push",
    );

  const regionCounts = useApiQuery(
    step === 3 && filters.industryId && filters.businessType
      ? `regions:${filters.industryId}:${filters.businessType}`
      : null,
    (signal) => getRegionCounts(filters.industryId!, filters.businessType!, signal),
  );

  const canRecommend = Boolean(filters.industryId && filters.businessType && filters.regionId);
  const recommendation = useApiQuery(
    step === RESULT_STEP && canRecommend ? `recommend:${serializeState(filters, RESULT_STEP)}` : null,
    (signal) =>
      getRecommendation(
        {
          ...filters,
          industryId: filters.industryId!,
          businessType: filters.businessType!,
          regionId: filters.regionId!,
        },
        signal,
      ),
  );

  const canProceedFrom = (from: Step) => maxReachable > from;

  /** 2~4단계에서 지금까지 고른 조건. 뒤로 가지 않고 바로 수정할 수 있게 합니다. */
  const chosen: Array<{ label: string; value: string; step: Step }> = [
    ...(industry ? [{ label: "업종", value: industry.name, step: 1 as Step }] : []),
    ...(filters.businessType && step > 2 ? [{ label: "사업자 유형", value: BUSINESS_TYPE_LABEL[filters.businessType], step: 2 as Step }] : []),
    ...(filters.regionId && step > 3 ? [{ label: "지역", value: REGION_LABEL[filters.regionId], step: 3 as Step }] : []),
  ];

  if (step === RESULT_STEP) {
    return (
      <RecommendationResult
        filters={filters}
        industry={industry}
        query={recommendation}
        backQuery={serializeState(filters, RESULT_STEP)}
        onEditStep={goToStep}
        onApplySuggestion={applySuggestion}
      />
    );
  }

  return (
    <div>
      <StepIndicator current={step} maxReachable={maxReachable} onSelect={goToStep} />

      {step > 1 && chosen.length > 0 && (
        <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
          {chosen.map((c) => (
            <div key={c.label} className="flex items-baseline gap-2">
              <dt className="text-ink-3">{c.label}</dt>
              <dd className="font-semibold text-ink">{c.value}</dd>
              <button
                type="button"
                onClick={() => goToStep(c.step)}
                className="inline-flex min-h-9 items-center px-1 text-xs font-medium text-brand-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                변경
              </button>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-8">
        {step === 1 && (
          <>
            <IndustryStep
              value={filters.industryId}
              selectedIndustry={industry}
              onChange={(industryId) => updateFilters({ industryId })}
            />
            <StepNav
              onNext={() => goToStep(2)}
              nextDisabled={!canProceedFrom(1)}
              hint={
                industryStatus === "UNAVAILABLE"
                  ? "등록이 제한된 업종이에요. 다른 업종을 선택하면 다음 단계로 진행할 수 있어요."
                  : "업종을 선택하면 다음 단계로 진행할 수 있어요."
              }
            />
          </>
        )}

        {step === 2 && (
          <>
            <BusinessTypeStep
              value={filters.businessType}
              onChange={(businessType) => updateFilters({ businessType })}
            />
            <StepNav
              onPrev={() => goToStep(1)}
              onNext={() => goToStep(3)}
              nextDisabled={!canProceedFrom(2)}
              hint="사업자 유형을 선택하면 다음 단계로 진행할 수 있어요."
            />
          </>
        )}

        {step === 3 && (
          <>
            <RegionStep
              value={filters.regionId}
              onChange={(regionId) => updateFilters({ regionId })}
              counts={regionCounts}
            />
            <StepNav
              onPrev={() => goToStep(2)}
              onNext={() => goToStep(4)}
              nextDisabled={!canProceedFrom(3)}
              hint="지역을 선택하면 다음 단계로 진행할 수 있어요."
            />
          </>
        )}

        {step === 4 && (
          <>
            <AdditionalFilterStep filters={filters} industry={industry} onChange={updateFilters} />
            <StepNav
              onPrev={() => goToStep(3)}
              onNext={() => goToStep(RESULT_STEP)}
              nextLabel="조건에 맞는 지점 확인"
            />
          </>
        )}
      </div>
    </div>
  );
}
