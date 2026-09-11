import { apiFetch } from "@/lib/api";
import { PRICE_OPTIONS, REGION_LABEL } from "./constants";
import { getPriceOptionLabel } from "./search-params";
import type {
  BusinessRegistrationAnalysis,
  BusinessType,
  Industry,
  IndustrySummary,
  OfficeDetail,
  RecommendationFilters,
  RecommendationResponse,
  RegionCount,
  RegistrationFieldsInput,
  RegistrationSample,
} from "./types";

export function searchIndustries(query: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ q: query, limit: "50" });
  return apiFetch<{ items: IndustrySummary[] }>(`/api/industries/search?${params}`, { signal });
}

export function getIndustry(id: string, signal?: AbortSignal) {
  return apiFetch<Industry>(`/api/industries/${encodeURIComponent(id)}`, { signal });
}

/** UI 필터 → API 쿼리 변환 후 추천 요청 */
export function getRecommendation(
  filters: RecommendationFilters & {
    industryId: string;
    businessType: BusinessType;
    regionId: NonNullable<RecommendationFilters["regionId"]>;
  },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    industry: filters.industryId,
    businessType: filters.businessType,
    region: REGION_LABEL[filters.regionId],
  });
  if (filters.nonCongested) params.set("nonCongested", "true");
  if (filters.permitAddressSupported) params.set("permitAddressSupported", "true");
  if (filters.maxMonthlyPrice !== null) params.set("maxPrice", String(filters.maxMonthlyPrice));
  return apiFetch<RecommendationResponse>(`/api/offices/recommend?${params}`, { signal });
}

export function getRegionCounts(industryId: string, businessType: BusinessType, signal?: AbortSignal) {
  const params = new URLSearchParams({ industry: industryId, businessType });
  return apiFetch<{ items: RegionCount[] }>(`/api/offices/regions?${params}`, { signal });
}

export function getOffice(id: string, init?: RequestInit) {
  return apiFetch<OfficeDetail>(`/api/offices/${encodeURIComponent(id)}`, init);
}

export { PRICE_OPTIONS, getPriceOptionLabel };

export function getRegistrationSamples(signal?: AbortSignal) {
  return apiFetch<{ items: RegistrationSample[] }>("/api/business-registration/samples", { signal });
}

export function analyzeRegistrationImage(file: File, signal?: AbortSignal) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<BusinessRegistrationAnalysis>("/api/business-registration/analyze", {
    method: "POST",
    body: form,
    signal,
  });
}

export function analyzeRegistrationSample(sample: string, signal?: AbortSignal) {
  return apiFetch<BusinessRegistrationAnalysis>("/api/business-registration/analyze-sample", {
    method: "POST",
    body: JSON.stringify({ sample }),
    signal,
  });
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** 사용자가 고친 등록증 정보로 국세청 확인·업종 매칭을 다시 수행 (이미지 전송 없음) */
export function verifyRegistrationFields(fields: RegistrationFieldsInput, signal?: AbortSignal) {
  return apiFetch<BusinessRegistrationAnalysis>("/api/business-registration/verify", {
    method: "POST",
    body: JSON.stringify(fields),
    signal,
  });
}
