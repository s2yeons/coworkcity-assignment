import type { BusinessType, IndustryRegistrationStatus, RegionId } from "./types";

export const REGIONS: ReadonlyArray<{ id: RegionId; label: string }> = [
  { id: "all", label: "전체" },
  { id: "seoul", label: "서울" },
  { id: "gyeonggi", label: "경기" },
  { id: "incheon", label: "인천" },
  { id: "busan", label: "부산" },
  { id: "daegu", label: "대구" },
  { id: "gwangju", label: "광주" },
  { id: "daejeon", label: "대전" },
  { id: "ulsan", label: "울산" },
  { id: "sejong", label: "세종" },
  { id: "jeju", label: "제주" },
];

/** UI 지역 id → API 지역 라벨 (API는 "서울", "전체" 같은 라벨을 사용) */
export const REGION_LABEL: Record<RegionId, string> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r.label]),
) as Record<RegionId, string>;

export function regionIdFromLabel(label: string | null): RegionId {
  return REGIONS.find((r) => r.label === label)?.id ?? "all";
}

export const BUSINESS_TYPES: ReadonlyArray<{
  id: BusinessType;
  label: string;
  description: string;
}> = [
  {
    id: "INDIVIDUAL",
    label: "개인사업자",
    description: "개인 명의로 사업자등록을 하는 경우",
  },
  {
    id: "CORPORATE",
    label: "법인사업자",
    description: "법인 설립 후 법인 명의로 등록하는 경우",
  },
];

export const BUSINESS_TYPE_LABEL: Record<BusinessType, string> = {
  INDIVIDUAL: "개인사업자",
  CORPORATE: "법인사업자",
};

/**
 * 가격 조건. 실제 서비스는 월/연 결제가 혼재되어 있어
 * 서버는 "월환산 금액"(연 결제는 12로 나눈 값)을 기준으로 비교합니다.
 */
export const PRICE_OPTIONS: ReadonlyArray<{
  value: number | null;
  label: string;
}> = [
  { value: null, label: "전체" },
  { value: 20_000, label: "월 2만원 이하" },
  { value: 30_000, label: "월 3만원 이하" },
  { value: 50_000, label: "월 5만원 이하" },
];

export const REGISTRATION_STATUS_LABEL: Record<IndustryRegistrationStatus, string> = {
  AVAILABLE: "신청 사례 있음",
  OEM_REQUIRED: "OEM 계약 필요",
  PERMIT_REQUIRED: "인허가 요건 확인",
  UNAVAILABLE: "신청 불가",
};
