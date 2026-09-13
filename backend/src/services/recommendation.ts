/**
 * 추천 로직 (순수 함수, DB 접근 없음).
 * 필수 조건은 DB where 절로 걸러지고(office-service), 이 모듈은 선택 조건의 점수·이유 계산과 정렬을 담당합니다.
 */
import type { BusinessType, IndustryRegistrationStatus, PriceUnit, Prisma } from "../generated/prisma/client";

export type RecommendationFilters = {
  industryId: string;
  businessType: BusinessType;
  /** null이면 전체 지역 */
  region: string | null;
  nonCongested: boolean;
  permitAddressSupported: boolean;
  /** 월환산 가격 상한(원). null이면 조건 없음 */
  maxPrice: number | null;
};

export type OfficeRecord = {
  id: string;
  name: string;
  region: string;
  district: string;
  address: string | null;
  price: number;
  priceUnit: PriceUnit;
  isNonCongested: boolean;
  permitAddressSupported: boolean;
  siteInspectionSupported: boolean;
  buildingUse: string | null;
  lat: number | null;
  lng: number | null;
  businessTypes: BusinessType[];
};

export type OptionalCondition = "nonCongested" | "permitAddressSupported" | "maxPrice";

/** 선택 조건 가중치. 단순하고 설명 가능하게 유지합니다. */
const SCORE_WEIGHTS: Record<OptionalCondition, number> = {
  nonCongested: 2,
  permitAddressSupported: 2,
  maxPrice: 1,
};

const CONDITION_LABEL: Record<OptionalCondition, string> = {
  nonCongested: "비과밀",
  permitAddressSupported: "인허가 업종 주소지 지원",
  maxPrice: "가격 조건 충족",
};

/**
 * 필수 조건 where 절. DB 단계에서 거릅니다.
 * - 지역 일치 (null이면 전체)
 * - 사업자 유형 지원
 * - 해당 업종으로 사업자등록 가능 (OfficeIndustry N:M)
 * - 인허가 요건 업종이면 인허가 업종 주소지 지원 지점만
 */
export function buildRequiredWhere(
  filters: Pick<RecommendationFilters, "industryId" | "businessType" | "region">,
  registrationStatus: IndustryRegistrationStatus,
): Prisma.OfficeWhereInput {
  return {
    ...(filters.region ? { region: filters.region } : {}),
    businessTypes: { some: { businessType: filters.businessType } },
    industries: { some: { industryId: filters.industryId } },
    ...(registrationStatus === "PERMIT_REQUIRED" ? { permitAddressSupported: true } : {}),
  };
}

export type RecommendedOffice = OfficeRecord & {
  monthlyPrice: number;
  matchScore: number;
  matchReasons: string[];
  unmetConditions: string[];
};

/** 월/연 결제가 혼재되어 있어 가격 비교는 월환산 금액(연 결제 ÷ 12)을 기준으로 합니다. */
export function getMonthlyPrice(office: Pick<OfficeRecord, "price" | "priceUnit">): number {
  return office.priceUnit === "YEAR" ? Math.round(office.price / 12) : office.price;
}

/** 사용자가 실제로 선택한 선택 조건 목록 */
export function getSelectedConditions(filters: RecommendationFilters): OptionalCondition[] {
  const selected: OptionalCondition[] = [];
  if (filters.nonCongested) selected.push("nonCongested");
  if (filters.permitAddressSupported) selected.push("permitAddressSupported");
  if (filters.maxPrice !== null) selected.push("maxPrice");
  return selected;
}

export function meetsCondition(
  office: OfficeRecord,
  condition: OptionalCondition,
  filters: RecommendationFilters,
): boolean {
  switch (condition) {
    case "nonCongested":
      return office.isNonCongested;
    case "permitAddressSupported":
      return office.permitAddressSupported;
    case "maxPrice":
      return filters.maxPrice !== null && getMonthlyPrice(office) <= filters.maxPrice;
  }
}

/** 선택한 조건만 점수에 반영합니다. (비과밀 +2, 인허가 지원 +2, 가격 +1) */
export function evaluateOffice(office: OfficeRecord, filters: RecommendationFilters): RecommendedOffice {
  const selected = getSelectedConditions(filters);
  const matched = selected.filter((condition) => meetsCondition(office, condition, filters));
  const unmet = selected.filter((condition) => !matched.includes(condition));

  return {
    ...office,
    monthlyPrice: getMonthlyPrice(office),
    matchScore: matched.reduce((sum, condition) => sum + SCORE_WEIGHTS[condition], 0),
    matchReasons: matched.map((condition) => CONDITION_LABEL[condition]),
    unmetConditions: unmet.map((condition) => CONDITION_LABEL[condition]),
  };
}

/** 점수 내림차순 → 월환산 가격 오름차순 → 이름순 */
export function rankOffices(offices: OfficeRecord[], filters: RecommendationFilters): RecommendedOffice[] {
  return offices
    .map((office) => evaluateOffice(office, filters))
    .sort(
      (a, b) =>
        b.matchScore - a.matchScore ||
        a.monthlyPrice - b.monthlyPrice ||
        a.name.localeCompare(b.name, "ko"),
    );
}

export type RelaxationCandidate = {
  label: string;
  filters: RecommendationFilters;
};

/**
 * 결과가 없을 때 완화해 볼 수 있는 필수 조건 후보.
 * 실제 개수는 DB 조회가 필요하므로 office-service에서 채웁니다.
 */
export function getRelaxationCandidates(filters: RecommendationFilters): RelaxationCandidate[] {
  const candidates: RelaxationCandidate[] = [];

  if (filters.region !== null) {
    candidates.push({
      label: `지역을 '${filters.region}'에서 '전체'로 바꾸면`,
      filters: { ...filters, region: null },
    });
  }

  const otherType: BusinessType = filters.businessType === "INDIVIDUAL" ? "CORPORATE" : "INDIVIDUAL";
  candidates.push({
    label: `사업자 유형을 '${otherType === "INDIVIDUAL" ? "개인사업자" : "법인사업자"}'로 바꾸면`,
    filters: { ...filters, businessType: otherType },
  });

  return candidates;
}
