/** 백엔드 API(/api/offices, /api/industries) 응답과 맞춘 타입 */

export type BusinessType = "INDIVIDUAL" | "CORPORATE";
type PriceUnit = "MONTH" | "YEAR";

/**
 * 코워크시티 업종 안내 페이지의 4단계 등록 상태
 * AVAILABLE: 신청 사례 있음 / OEM_REQUIRED: OEM 계약 필요 / PERMIT_REQUIRED: 인허가 요건 확인 / UNAVAILABLE: 신청 불가
 */
export type IndustryRegistrationStatus = "AVAILABLE" | "OEM_REQUIRED" | "PERMIT_REQUIRED" | "UNAVAILABLE";

export type IndustrySummary = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  registrationStatus: IndustryRegistrationStatus;
};

export type Industry = IndustrySummary & {
  note: string | null;
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

/** UI 입력 상태 (URL search params에 그대로 직렬화됨) */
export type RecommendationFilters = {
  industryId: string | null;
  businessType: BusinessType | null;
  regionId: RegionId | null;
  nonCongested: boolean;
  permitAddressSupported: boolean;
  /** 월환산 가격 상한 (원). null이면 전체 */
  maxMonthlyPrice: number | null;
};

export type OfficeSummary = {
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
  /** 지도 표시용 좌표. 없을 수 있음 */
  lat: number | null;
  lng: number | null;
  businessTypes: BusinessType[];
};

export type RecommendedOffice = OfficeSummary & {
  monthlyPrice: number;
  matchScore: number;
  /** 서버가 계산한 추천 이유 (선택한 조건 중 충족한 항목) */
  matchReasons: string[];
  /** 선택한 조건 중 충족하지 못한 항목 */
  unmetConditions: string[];
};

export type RelaxationSuggestion = {
  label: string;
  /** null이면 전체 지역 */
  region: string | null;
  businessType: BusinessType;
  count: number;
};

export type RecommendationResponse = {
  total: number;
  industry: Industry;
  items: RecommendedOffice[];
  suggestions: RelaxationSuggestion[];
};

export type RegionCount = { region: string; count: number };

export type OfficeDetail = OfficeSummary & {
  description: string | null;
  industries: Array<Pick<IndustrySummary, "id" | "name" | "registrationStatus">>;
};

/** POST /api/business-registration/analyze 응답 */
export type BusinessRegistrationAnalysis = {
  fields: {
    businessNumber: string | null;
    businessNumberValid: boolean | null;
    businessType: BusinessType | null;
    companyName: string | null;
    representative: string | null;
    openedAt: string | null;
    address: string | null;
    region: string | null;
    businessCategories: string[];
    businessItems: string[];
  };
  suggestion: {
    businessType: BusinessType | null;
    /** 추천 DB에 지점이 있는 지역 라벨 */
    region: string | null;
    industries: Array<{
      id: string;
      name: string;
      registrationStatus: IndustryRegistrationStatus;
      score: number;
      matchedTerms: string[];
    }>;
  };
  /** OCR 결과면 엔진 정보, 수정한 값으로 다시 확인한 결과면 null */
  ocr: { engine: string; confidence: number; durationMs: number } | null;
  /** 국세청 진위확인·상태조회 (서버에 NTS_API_KEY가 없으면 checked=false) */
  verification: {
    checked: boolean;
    skippedReason?: "NO_API_KEY" | "NO_BUSINESS_NUMBER" | "API_ERROR";
    businessStatus?: { code: string; label: string; taxType: string; closedAt: string | null };
    identity?: { matched: boolean; message: string };
    summary: string;
  };
  warnings: string[];
};

export type RegistrationSample = {
  id: string;
  file: string;
  label: string;
  description: string;
  imageUrl: string;
};

/** POST /api/business-registration/verify 요청 본문 */
export type RegistrationFieldsInput = {
  businessNumber: string | null;
  businessType: BusinessType | null;
  companyName: string | null;
  representative: string | null;
  openedAt: string | null;
  address: string | null;
  businessCategories: string[];
  businessItems: string[];
};
