/**
 * API 통합 테스트. 실행 중인 서버(+ seed된 DB)가 필요합니다.
 *   npm run dev  (다른 터미널)  →  npm run test:api
 * API_URL 환경변수로 대상 서버를 바꿀 수 있습니다.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

async function get(path: string, params: Record<string, string> = {}) {
  const url = new URL(`/api${path}`, API_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  return { status: res.status, body: await res.json() };
}

const base = { industry: "retail", businessType: "INDIVIDUAL", region: "서울" };

describe("GET /api/offices/recommend", () => {
  it("S1 소매업/개인/서울 → 서울의 개인 가능 지점만", async () => {
    const { status, body } = await get("/offices/recommend", base);
    assert.equal(status, 200);
    assert.equal(body.data.industry.name, "소매업");
    assert.ok(body.data.total > 0);
    for (const item of body.data.items) {
      assert.equal(item.region, "서울");
      assert.ok(item.businessTypes.includes("INDIVIDUAL"));
      assert.deepEqual(item.matchReasons, []);
      assert.equal(item.matchScore, 0);
    }
  });

  it("S2 법인 + 비과밀 → 비과밀 지점이 먼저, 추천 이유 포함", async () => {
    const { body } = await get("/offices/recommend", { ...base, businessType: "CORPORATE", nonCongested: "true" });
    const items = body.data.items;
    assert.ok(items.length > 0);
    assert.equal(items[0].isNonCongested, true);
    assert.deepEqual(items[0].matchReasons, ["비과밀"]);
    assert.equal(items[0].matchScore, 2);
    const scores = items.map((i: { matchScore: number }) => i.matchScore);
    assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
    const congested = items.find((i: { isNonCongested: boolean }) => !i.isNonCongested);
    assert.deepEqual(congested.unmetConditions, ["비과밀"]);
  });

  it("S3 복합 조건(전체/법인/가격/비과밀/인허가) → 최대 5점, 이유 3개", async () => {
    const { body } = await get("/offices/recommend", {
      ...base,
      businessType: "CORPORATE",
      region: "전체",
      maxPrice: "30000",
      nonCongested: "true",
      permitAddressSupported: "true",
    });
    const top = body.data.items[0];
    assert.equal(top.matchScore, 5);
    assert.deepEqual(top.matchReasons, ["비과밀", "인허가 업종 주소지 지원", "가격 조건 충족"]);
    assert.ok(top.monthlyPrice <= 30000);
    const regions = new Set(body.data.items.map((i: { region: string }) => i.region));
    assert.ok(regions.size > 1, "전체 지역이면 여러 지역이 섞여야 함");
  });

  it("S4 결과 없음(세종/개인) → total 0 + 완화 제안", async () => {
    const { status, body } = await get("/offices/recommend", { ...base, region: "세종" });
    assert.equal(status, 200);
    assert.equal(body.data.total, 0);
    assert.ok(body.data.suggestions.length >= 1);
    const byBusinessType = body.data.suggestions.find((s: { businessType: string }) => s.businessType === "CORPORATE");
    assert.ok(byBusinessType && byBusinessType.count >= 1, "세종은 법인 전용이라 법인 제안이 있어야 함");
  });

  it("S5 잘못된 파라미터 → 400 VALIDATION_ERROR", async () => {
    const { status, body } = await get("/offices/recommend", { ...base, businessType: "PERSON", maxPrice: "-5" });
    assert.equal(status, 400);
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.ok(body.error.details.some((d: { path: string }) => d.path === "businessType"));
    assert.ok(body.error.details.some((d: { path: string }) => d.path === "maxPrice"));
    assert.equal((await get("/offices/recommend")).status, 400);
    assert.equal((await get("/offices/recommend", { ...base, nonCongested: "yes" })).status, 400);
  });

  it("S6 존재하지 않는 업종 → 404 NOT_FOUND", async () => {
    const { status, body } = await get("/offices/recommend", { ...base, industry: "no-such-industry" });
    assert.equal(status, 404);
    assert.equal(body.error.code, "NOT_FOUND");
  });

  it("인허가 요건 업종(교육)은 인허가 지원 지점만", async () => {
    const { body } = await get("/offices/recommend", { ...base, industry: "education" });
    assert.ok(body.data.total > 0);
    for (const item of body.data.items) assert.equal(item.permitAddressSupported, true);
  });

  it("신청 불가 업종(보험업)은 결과 없음", async () => {
    const { body } = await get("/offices/recommend", { ...base, industry: "insurance", region: "전체" });
    assert.equal(body.data.total, 0);
  });

  it("지점의 계약 불가 업종은 제외 (세종 Mock 지점은 교육 서비스업 불가)", async () => {
    const { body } = await get("/offices/recommend", { industry: "education", businessType: "CORPORATE", region: "세종" });
    assert.equal(body.data.total, 0);
  });
});

describe("GET /api/industries/search", () => {
  it("키워드 부분 일치: '온라인 쇼핑몰', '전자상거래' → 소매업", async () => {
    for (const q of ["온라인 쇼핑몰", "전자상거래", "쇼핑"]) {
      const { body } = await get("/industries/search", { q });
      assert.ok(body.data.items.some((i: { name: string }) => i.name === "소매업"), `q=${q}`);
    }
  });
  it("업종명 일치가 먼저 정렬됨", async () => {
    const { body } = await get("/industries/search", { q: "출판" });
    assert.equal(body.data.items[0].name, "출판업");
  });
  it("검색어 없으면 전체 목록(limit 적용)", async () => {
    assert.equal((await get("/industries/search")).body.data.items.length, 30);
    assert.equal((await get("/industries/search", { limit: "5" })).body.data.items.length, 5);
  });
  it("LIKE 특수문자는 이스케이프됨", async () => {
    assert.equal((await get("/industries/search", { q: "%" })).body.data.items.length, 0);
  });
  it("limit 범위 밖이면 400", async () => {
    assert.equal((await get("/industries/search", { limit: "1000" })).status, 400);
  });
});

describe("GET /api/offices/regions, /api/offices/:id, /api/industries/:id", () => {
  it("지역별 개수", async () => {
    const { body } = await get("/offices/regions", { industry: "retail", businessType: "INDIVIDUAL" });
    const seoul = body.data.items.find((i: { region: string }) => i.region === "서울");
    assert.ok(seoul.count > 0);
  });
  it("지점 상세 + 404", async () => {
    const { body } = await get("/offices/seoul-geumcheon");
    assert.equal(body.data.name, "서울 금천 Mock 지점");
    assert.ok(Array.isArray(body.data.industries) && body.data.industries.length > 0);
    assert.equal((await get("/offices/nope")).status, 404);
  });
  it("업종 상세 + 404", async () => {
    assert.equal((await get("/industries/retail")).body.data.name, "소매업");
    assert.equal((await get("/industries/nope")).status, 404);
  });
  it("알 수 없는 경로는 JSON 404", async () => {
    const { status, body } = await get("/nothing");
    assert.equal(status, 404);
    assert.equal(body.error.code, "NOT_FOUND");
  });
});

describe("GET /api/stats", () => {
  it("등록 가능 업종 수 · 지점 수 · 지점이 있는 지역 수를 DB 기준으로 반환", async () => {
    const { status, body } = await get("/stats");
    assert.equal(status, 200);
    assert.equal(body.data.industries, 26); // 30개 중 신청 불가 4개 제외
    assert.equal(body.data.offices, 15);
    assert.equal(body.data.regions, 7);
  });
});
