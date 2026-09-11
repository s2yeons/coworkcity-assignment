import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildRequiredWhere,
  evaluateOffice,
  getMonthlyPrice,
  getRelaxationCandidates,
  getSelectedConditions,
  rankOffices,
  type OfficeRecord,
  type RecommendationFilters,
} from "./recommendation";
import { recommendQuerySchema } from "../lib/validation";

const office = (overrides: Partial<OfficeRecord>): OfficeRecord => ({
  id: "o",
  name: "테스트 지점",
  region: "서울",
  district: "강남구",
  address: null,
  price: 240_000,
  priceUnit: "YEAR",
  isNonCongested: false,
  permitAddressSupported: false,
  siteInspectionSupported: false,
  buildingUse: null,
  lat: null,
  lng: null,
  businessTypes: ["INDIVIDUAL"],
  ...overrides,
});

const filters = (overrides: Partial<RecommendationFilters> = {}): RecommendationFilters => ({
  industryId: "retail",
  businessType: "INDIVIDUAL",
  region: "서울",
  nonCongested: false,
  permitAddressSupported: false,
  maxPrice: null,
  ...overrides,
});

describe("getMonthlyPrice", () => {
  it("연 결제는 12로 나눈 월환산 금액", () => {
    assert.equal(getMonthlyPrice({ price: 240_000, priceUnit: "YEAR" }), 20_000);
    assert.equal(getMonthlyPrice({ price: 33_000, priceUnit: "MONTH" }), 33_000);
  });
});

describe("buildRequiredWhere (필수 조건 → DB where)", () => {
  it("지역·사업자 유형·업종을 모두 where에 반영", () => {
    const where = buildRequiredWhere(filters(), "AVAILABLE");
    assert.deepEqual(where, {
      region: "서울",
      businessTypes: { some: { businessType: "INDIVIDUAL" } },
      industries: { some: { industryId: "retail" } },
    });
  });
  it("전체 지역이면 region 조건 없음", () => {
    assert.equal("region" in buildRequiredWhere(filters({ region: null }), "AVAILABLE"), false);
  });
  it("인허가 요건 업종이면 인허가 지원 지점만", () => {
    const where = buildRequiredWhere(filters({ industryId: "education" }), "PERMIT_REQUIRED");
    assert.equal(where.permitAddressSupported, true);
  });
});

describe("evaluateOffice (선택 조건 점수·이유)", () => {
  it("선택하지 않은 조건은 점수에 포함하지 않음", () => {
    const r = evaluateOffice(office({ isNonCongested: true, permitAddressSupported: true }), filters());
    assert.equal(r.matchScore, 0);
    assert.deepEqual(r.matchReasons, []);
    assert.deepEqual(r.unmetConditions, []);
  });
  it("비과밀 +2", () => {
    const r = evaluateOffice(office({ isNonCongested: true }), filters({ nonCongested: true }));
    assert.equal(r.matchScore, 2);
    assert.deepEqual(r.matchReasons, ["비과밀"]);
  });
  it("인허가 +2", () => {
    const r = evaluateOffice(office({ permitAddressSupported: true }), filters({ permitAddressSupported: true }));
    assert.equal(r.matchScore, 2);
    assert.deepEqual(r.matchReasons, ["인허가 업종 주소지 지원"]);
  });
  it("가격 +1 (월환산 기준)", () => {
    const r = evaluateOffice(office({ price: 240_000, priceUnit: "YEAR" }), filters({ maxPrice: 20_000 }));
    assert.equal(r.matchScore, 1);
    assert.deepEqual(r.matchReasons, ["가격 조건 충족"]);
    const over = evaluateOffice(office({ price: 25_000, priceUnit: "MONTH" }), filters({ maxPrice: 20_000 }));
    assert.equal(over.matchScore, 0);
    assert.deepEqual(over.unmetConditions, ["가격 조건 충족"]);
  });
  it("복합 조건 최대 5점, 미충족 조건 분리", () => {
    const all = filters({ nonCongested: true, permitAddressSupported: true, maxPrice: 30_000 });
    const full = evaluateOffice(office({ isNonCongested: true, permitAddressSupported: true }), all);
    assert.equal(full.matchScore, 5);
    assert.deepEqual(full.matchReasons, ["비과밀", "인허가 업종 주소지 지원", "가격 조건 충족"]);
    const partial = evaluateOffice(office({ isNonCongested: true, price: 570_000 }), all);
    assert.equal(partial.matchScore, 2);
    assert.deepEqual(partial.unmetConditions, ["인허가 업종 주소지 지원", "가격 조건 충족"]);
  });
});

describe("rankOffices (정렬)", () => {
  it("점수 내림차순 → 월환산 가격 오름차순 → 이름순", () => {
    const ranked = rankOffices(
      [
        office({ id: "a", name: "가", price: 20_000, priceUnit: "MONTH" }),
        office({ id: "b", name: "나", price: 20_000, priceUnit: "MONTH", isNonCongested: true }),
        office({ id: "c", name: "다", price: 240_000, priceUnit: "YEAR", isNonCongested: true }),
        office({ id: "d", name: "라", price: 10_000, priceUnit: "MONTH" }),
      ],
      filters({ nonCongested: true }),
    );
    assert.deepEqual(ranked.map((o) => o.id), ["b", "c", "d", "a"]);
  });
});

describe("getSelectedConditions / getRelaxationCandidates", () => {
  it("선택한 조건만 반환", () => {
    assert.deepEqual(getSelectedConditions(filters({ maxPrice: 1 })), ["maxPrice"]);
  });
  it("지역이 전체면 지역 완화 후보 없음", () => {
    const c = getRelaxationCandidates(filters({ region: null }));
    assert.equal(c.length, 1);
    assert.equal(c[0].filters.businessType, "CORPORATE");
  });
});

describe("recommendQuerySchema (parameter validation)", () => {
  it("정상 파라미터 파싱 + boolean/number 변환", () => {
    const q = recommendQuerySchema.parse({
      industry: "retail",
      businessType: "INDIVIDUAL",
      region: "서울",
      nonCongested: "true",
      maxPrice: "30000",
    });
    assert.equal(q.nonCongested, true);
    assert.equal(q.permitAddressSupported, false);
    assert.equal(q.maxPrice, 30_000);
  });
  it("필수 누락·잘못된 enum·음수 가격은 실패", () => {
    assert.throws(() => recommendQuerySchema.parse({ businessType: "INDIVIDUAL", region: "서울" }));
    assert.throws(() => recommendQuerySchema.parse({ industry: "retail", businessType: "PERSON", region: "서울" }));
    assert.throws(() => recommendQuerySchema.parse({ industry: "retail", businessType: "INDIVIDUAL", region: "서울", maxPrice: "-1" }));
    assert.throws(() => recommendQuerySchema.parse({ industry: "retail", businessType: "INDIVIDUAL", region: "서울", nonCongested: "yes" }));
  });
});
