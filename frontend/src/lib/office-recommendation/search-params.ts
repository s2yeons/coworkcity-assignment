import { PRICE_OPTIONS, REGIONS } from "./constants";
import type {
  BusinessType,
  IndustryRegistrationStatus,
  RecommendationFilters,
  RegionId,
} from "./types";

/**
 * 단계 정의. 결과 화면까지 포함해 5단계입니다.
 * 필터 상태와 현재 단계를 URL search params에 유지해서
 * 상세 페이지에서 돌아오거나 링크를 공유해도 같은 조건을 볼 수 있게 합니다.
 */
export const STEPS = [
  { id: 1, label: "업종" },
  { id: 2, label: "사업자 유형" },
  { id: 3, label: "지역" },
  { id: 4, label: "추가 조건" },
] as const;

export const RESULT_STEP = 5;
export type Step = 1 | 2 | 3 | 4 | typeof RESULT_STEP;

export const EMPTY_FILTERS: RecommendationFilters = {
  industryId: null,
  businessType: null,
  regionId: null,
  nonCongested: false,
  permitAddressSupported: false,
  maxMonthlyPrice: null,
};

type ParamsLike = { get(name: string): string | null };

const INDUSTRY_ID_PATTERN = /^[a-z0-9-]{1,50}$/;

export function parseFilters(params: ParamsLike): RecommendationFilters {
  const industryId = params.get("industry");
  const businessType = params.get("businessType");
  const regionId = params.get("region");
  const maxPrice = Number(params.get("maxPrice"));

  return {
    industryId: industryId && INDUSTRY_ID_PATTERN.test(industryId) ? industryId : null,
    businessType:
      businessType === "INDIVIDUAL" || businessType === "CORPORATE"
        ? (businessType as BusinessType)
        : null,
    regionId: REGIONS.some((r) => r.id === regionId) ? (regionId as RegionId) : null,
    nonCongested: params.get("nonCongested") === "1",
    permitAddressSupported: params.get("permit") === "1",
    maxMonthlyPrice:
      PRICE_OPTIONS.some((o) => o.value === maxPrice) && maxPrice > 0 ? maxPrice : null,
  };
}

/**
 * 필수 조건이 비어 있으면 그 단계 이후로는 진행할 수 없습니다.
 * 업종의 등록 상태는 API로 확인되므로, 아직 모르는 동안(null)은 진행 가능으로 봅니다.
 */
export function getMaxReachableStep(
  filters: RecommendationFilters,
  industryStatus: IndustryRegistrationStatus | null,
): Step {
  if (!filters.industryId || industryStatus === "UNAVAILABLE") return 1;
  if (!filters.businessType) return 2;
  if (!filters.regionId) return 3;
  return RESULT_STEP;
}

export function parseStep(
  params: ParamsLike,
  filters: RecommendationFilters,
  industryStatus: IndustryRegistrationStatus | null,
): Step {
  const raw = Number(params.get("step"));
  const requested: Step = raw >= 1 && raw <= RESULT_STEP ? (raw as Step) : 1;
  const max = getMaxReachableStep(filters, industryStatus);
  return requested > max ? max : requested;
}

export function serializeState(filters: RecommendationFilters, step: Step): string {
  const params = new URLSearchParams();
  if (filters.industryId) params.set("industry", filters.industryId);
  if (filters.businessType) params.set("businessType", filters.businessType);
  if (filters.regionId) params.set("region", filters.regionId);
  if (filters.nonCongested) params.set("nonCongested", "1");
  if (filters.permitAddressSupported) params.set("permit", "1");
  if (filters.maxMonthlyPrice !== null) params.set("maxPrice", String(filters.maxMonthlyPrice));
  if (step > 1) params.set("step", String(step));
  return params.toString();
}

export function getPriceOptionLabel(maxMonthlyPrice: number | null): string {
  return PRICE_OPTIONS.find((option) => option.value === maxMonthlyPrice)?.label ?? "전체";
}
