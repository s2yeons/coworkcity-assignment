export type BusinessType = "individual" | "corporate";

/**
 * 코워크시티 업종 안내 페이지(/industries)의 4단계 등록 상태를 그대로 반영합니다.
 * - available:        신청 사례 있음
 * - oem_required:     OEM(위탁 제조) 계약 필요
 * - permit_required:  인허가 요건 확인
 * - unavailable:      신청 불가
 */
export type IndustryRegistrationStatus =
  | "available"
  | "oem_required"
  | "permit_required"
  | "unavailable";

export type Industry = {
  id: string;
  /** 코워크시티 업종 안내 페이지의 실제 업종 명칭 */
  name: string;
  /** 대분류 (예: 정보통신업, 도매 및 소매업) */
  category: string;
  /** 검색어 매칭용 키워드 (사업 설명, 예시 업태 등) */
  keywords: string[];
  description?: string;
  registrationStatus: IndustryRegistrationStatus;
  /** 등록 시 참고사항 (예: OEM 계약서 필요) */
  note?: string;
};

export type RegionId =
  | "all"
  | "seoul"
  | "gyeonggi"
  | "incheon"
  | "busan"
  | "daegu"
  | "gwangju"
  | "daejeon"
  | "ulsan"
  | "sejong"
  | "jeju";

export type PriceUnit = "month" | "year";

/**
 * 지점 상세 페이지(/offices/:id)의 "기본 정보" 항목을 기준으로 구성했습니다.
 * 과밀/비과밀, 건축물 용도, 결제 주기, 사업자 유형, 계약 불가 업종, 인허가 업종 주소지 지원, 실태조사 지원
 */
export type Office = {
  id: string;
  name: string;
  region: Exclude<RegionId, "all">;
  district: string;
  address?: string;
  businessTypes: BusinessType[];
  /**
   * 계약 불가 업종 (Industry.id 목록).
   * 실제 서비스는 "등록 가능 업종"이 아니라 "계약 불가 업종"을 예외로 표시하므로 같은 구조를 따릅니다.
   * 여기에 없고 업종 자체가 신청 불가가 아니면 해당 지점에서 사업자등록이 가능합니다.
   */
  unavailableIndustryIds: string[];
  price: number;
  priceUnit: PriceUnit;
  isNonCongested: boolean;
  permitAddressSupported: boolean;
  siteInspectionSupported: boolean;
  buildingUse?: string;
  description?: string;
  /** 지도 표시용 좌표 (구·동 중심 근사값) */
  lat?: number;
  lng?: number;
};

export type RecommendationFilters = {
  industryId: string | null;
  businessType: BusinessType | null;
  regionId: RegionId | null;
  /** 선택 조건: 비과밀 지역 우선 */
  nonCongested: boolean;
  /** 선택 조건: 인허가 업종 주소지 지원 우선 */
  permitAddressSupported: boolean;
  /** 선택 조건: 월환산 가격 상한 (원). null이면 전체 */
  maxMonthlyPrice: number | null;
};

export type OptionalCondition = "nonCongested" | "permitAddressSupported" | "price";

export type OfficeMatchScore = {
  officeId: string;
  score: number;
};

export type RecommendedOffice = OfficeMatchScore & {
  office: Office;
  /** 사용자가 선택한 선택 조건 중 이 지점이 충족하는 항목 */
  matchedConditions: OptionalCondition[];
};
