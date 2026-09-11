/**
 * 사업자등록증 OCR API 통합 테스트. 실행 중인 서버(+ seed DB)가 필요합니다.
 * 샘플 이미지 3장을 실제로 OCR → 파싱 → 업종 매칭까지 통과시킵니다.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const FIXTURES = path.resolve(__dirname, "fixtures/business-registration");

async function analyzeFile(file: string, type = "image/png") {
  const buf = await readFile(path.join(FIXTURES, file));
  const form = new FormData();
  form.append("file", new Blob([buf], { type }), file);
  const res = await fetch(`${API_URL}/api/business-registration/analyze`, { method: "POST", body: form });
  return { status: res.status, body: await res.json() };
}

describe("POST /api/business-registration/analyze", () => {
  it("개인 · 서울 · 전자상거래 등록증 → 유형/지역/업종(소매업) 자동 추출", async () => {
    const { status, body } = await analyzeFile("individual-seoul-ecommerce.png");
    assert.equal(status, 200);
    const { fields, suggestion, ocr, warnings } = body.data;
    assert.equal(fields.businessNumber, "123-45-67891");
    assert.equal(fields.businessNumberValid, true);
    assert.equal(fields.businessType, "INDIVIDUAL");
    assert.equal(fields.companyName, "코워크샘플상사");
    assert.equal(fields.region, "서울");
    assert.equal(suggestion.region, "서울");
    assert.equal(suggestion.industries[0].id, "retail", JSON.stringify(suggestion.industries));
    assert.ok(ocr.confidence >= 80, `confidence ${ocr.confidence}`);
    // 국세청 경고(가상 번호라 미등록)는 NTS_API_KEY 유무에 따라 달라지므로 OCR 관련 경고만 없는지 확인
    assert.deepEqual(warnings.filter((w: string) => !w.includes("국세청")), []);
    assert.equal(typeof body.data.verification.checked, "boolean");
  });

  it("법인 · 경기 · 소프트웨어 등록증 → CORPORATE, 경기, 소프트웨어 업종", async () => {
    const { body } = await analyzeFile("corporate-gyeonggi-software.png");
    const { fields, suggestion } = body.data;
    assert.equal(fields.businessNumber, "220-87-91033");
    assert.equal(fields.businessType, "CORPORATE");
    assert.equal(fields.companyName, "주식회사 샘플소프트");
    assert.equal(suggestion.region, "경기");
    assert.equal(suggestion.industries[0].id, "software", JSON.stringify(suggestion.industries));
  });

  it("촬영본(기울어짐·노이즈) → 부산, 디자인 업종, 핵심 필드 유지", async () => {
    const { body } = await analyzeFile("individual-busan-design-photo.jpg", "image/jpeg");
    const { fields, suggestion } = body.data;
    assert.equal(fields.businessNumber, "617-12-90133");
    assert.equal(fields.businessType, "INDIVIDUAL");
    assert.equal(suggestion.region, "부산");
    assert.equal(suggestion.industries[0].id, "other-professional", JSON.stringify(suggestion.industries));
  });

  it("이미지가 아닌 파일 → 400", async () => {
    const form = new FormData();
    form.append("file", new Blob(["hello"], { type: "text/plain" }), "a.txt");
    const res = await fetch(`${API_URL}/api/business-registration/analyze`, { method: "POST", body: form });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error.code, "UNSUPPORTED_FILE_TYPE");
  });

  it("파일 없음 → 400", async () => {
    const res = await fetch(`${API_URL}/api/business-registration/analyze`, { method: "POST", body: new FormData() });
    assert.equal(res.status, 400);
  });

  it("10MB 초과 → 413", async () => {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(11 * 1024 * 1024)], { type: "image/png" }), "big.png");
    const res = await fetch(`${API_URL}/api/business-registration/analyze`, { method: "POST", body: form });
    assert.equal(res.status, 413);
  });

  it("등록증이 아닌 이미지 → 200이지만 경고와 null 필드", async () => {
    // 1x1 흰색 PNG
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=", "base64");
    const form = new FormData();
    form.append("file", new Blob([png], { type: "image/png" }), "blank.png");
    const res = await fetch(`${API_URL}/api/business-registration/analyze`, { method: "POST", body: form });
    assert.equal(res.status, 200);
    const { data } = await res.json();
    assert.equal(data.fields.businessNumber, null);
    assert.ok(data.warnings.length >= 3);
  });
});

describe("보안 검증", () => {
  it("Content-Type을 image/png로 속인 텍스트 → 400 (매직 바이트 검사)", async () => {
    const form = new FormData();
    form.append("file", new Blob(["<html>not an image</html>"], { type: "image/png" }), "fake.png");
    const res = await fetch(`${API_URL}/api/business-registration/analyze`, { method: "POST", body: form });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error.code, "UNSUPPORTED_FILE_TYPE");
  });
  it("픽셀 크기가 과대한 PNG 헤더 → 400 IMAGE_TOO_LARGE (디코딩 전 차단)", async () => {
    const png = Buffer.alloc(64);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(png, 0);
    png.writeUInt32BE(13, 8);
    png.write("IHDR", 12, "ascii");
    png.writeUInt32BE(30000, 16);
    png.writeUInt32BE(30000, 20);
    const form = new FormData();
    form.append("file", new Blob([png], { type: "image/png" }), "bomb.png");
    const res = await fetch(`${API_URL}/api/business-registration/analyze`, { method: "POST", body: form });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error.code, "IMAGE_TOO_LARGE");
  });
  it("응답은 no-store, 보안 헤더 포함", async () => {
    const res = await fetch(`${API_URL}/api/business-registration/analyze-sample`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sample: "individual-seoul-ecommerce" }),
    });
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.equal(res.headers.get("x-powered-by"), null);
    const body = await res.json();
    assert.equal("rawText" in body.data, false, "OCR 원문은 응답에 포함하지 않음");
  });
});

describe("POST /api/business-registration/verify (수정한 값으로 재확인)", () => {
  it("텍스트 필드만으로 국세청 확인 + 업종 매칭 수행 (ocr=null)", async () => {
    const res = await fetch(`${API_URL}/api/business-registration/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessNumber: "123-45-67891",
        businessType: "INDIVIDUAL",
        companyName: "코워크샘플상사",
        representative: "홍길동",
        openedAt: "2022-03-02",
        address: "서울특별시 마포구 양화로 100",
        businessCategories: ["도매 및 소매업"],
        businessItems: ["전자상거래 소매업"],
      }),
    });
    assert.equal(res.status, 200);
    const { data } = await res.json();
    assert.equal(data.ocr, null);
    assert.equal(data.fields.businessNumberValid, true);
    assert.equal(data.fields.region, "서울");
    assert.equal(data.suggestion.industries[0].id, "retail");
    assert.equal(typeof data.verification.checked, "boolean");
  });
  it("번호 오타를 고치면 형식 검증이 다시 계산됨 (O→0 보정 포함)", async () => {
    const res = await fetch(`${API_URL}/api/business-registration/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessNumber: "123-45-6789O", representative: "홍길동", openedAt: "2022-03-02" }),
    });
    const { data } = await res.json();
    assert.equal(data.fields.businessNumber, "123-45-67890");
    assert.equal(data.fields.businessNumberValid, false);
    assert.ok(data.warnings.some((w: string) => w.includes("검증에 실패")));
  });
  it("개업일 형식이 틀리면 400", async () => {
    const res = await fetch(`${API_URL}/api/business-registration/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessNumber: "123-45-67891", openedAt: "2022.03.02" }),
    });
    assert.equal(res.status, 400);
  });
});

describe("샘플 API", () => {
  it("GET /samples 목록 + 이미지 제공", async () => {
    const res = await fetch(`${API_URL}/api/business-registration/samples`);
    const { data } = await res.json();
    assert.equal(data.items.length, 3);
    const img = await fetch(`${API_URL}${data.items[0].imageUrl}`);
    assert.equal(img.status, 200);
    assert.match(img.headers.get("content-type") ?? "", /image\/png/);
  });
  it("POST /analyze-sample", async () => {
    const res = await fetch(`${API_URL}/api/business-registration/analyze-sample`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sample: "corporate-gyeonggi-software" }),
    });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).data.fields.businessType, "CORPORATE");
    const missing = await fetch(`${API_URL}/api/business-registration/analyze-sample`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sample: "nope" }),
    });
    assert.equal(missing.status, 404);
  });
});

/**
 * 속도 제한 테스트는 한도를 실제로 소진시켜 이후 1분간 다른 요청이 429가 되므로 기본으로는 건너뜁니다.
 * 실행: OCR_RATE_LIMIT=20 npm run dev  (서버)  +  RATE_LIMIT_TEST=1 npm run test:api
 */
describe("속도 제한 (마지막에 실행, RATE_LIMIT_TEST=1 일 때만)", { skip: !process.env.RATE_LIMIT_TEST }, () => {
  it("한도 초과 → 429 RATE_LIMITED", async () => {
    const limit = Number(process.env.OCR_RATE_LIMIT ?? 20);
    let last = 0;
    for (let i = 0; i < limit + 10; i++) {
      const res = await fetch(`${API_URL}/api/business-registration/analyze`, { method: "POST", body: new FormData() });
      last = res.status;
      if (last === 429) break;
    }
    assert.equal(last, 429);
  });
});
