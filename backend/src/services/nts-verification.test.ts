import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NTS_BASE_URL, createNtsVerifier } from "./nts-verification";

const status = (over: Partial<Record<string, string>> = {}) => ({
  b_no: "1234567891",
  b_stt: "계속사업자",
  b_stt_cd: "01",
  tax_type: "부가가치세 일반과세자",
  tax_type_cd: "01",
  end_dt: "",
  utcc_yn: "N",
  tax_type_change_dt: "",
  invoice_apply_dt: "",
  ...over,
});

function mockFetch(handler: (url: string, body: unknown) => unknown, calls: Array<{ url: string; body: unknown }> = []) {
  const f = (async (url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    calls.push({ url: String(url), body });
    return new Response(JSON.stringify(handler(String(url), body)), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  return f;
}

const input = { businessNumber: "123-45-67891", openedAt: "2022-03-02", representative: "홍길동", companyName: "코워크샘플상사" };

describe("createNtsVerifier", () => {
  it("API 키가 없으면 호출하지 않고 미확인으로 표시", async () => {
    let called = false;
    const verify = createNtsVerifier({ apiKey: undefined, fetchImpl: (async () => { called = true; return new Response("{}"); }) as typeof fetch });
    const r = await verify(input);
    assert.equal(r.checked, false);
    assert.equal(r.skippedReason, "NO_API_KEY");
    assert.equal(called, false);
  });

  it("번호가 없으면 건너뜀", async () => {
    const r = await createNtsVerifier({ apiKey: "k" })({ ...input, businessNumber: null });
    assert.equal(r.skippedReason, "NO_BUSINESS_NUMBER");
  });

  it("진위확인: 개업일·대표자 있으면 /validate 호출, 일치(01) → matched", async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    const verify = createNtsVerifier({
      apiKey: "test-key",
      fetchImpl: mockFetch(() => ({ status_code: "OK", data: [{ b_no: "1234567891", valid: "01", status: status() }] }), calls),
    });
    const r = await verify(input);
    assert.equal(r.checked, true);
    assert.equal(r.identity?.matched, true);
    assert.equal(r.businessStatus?.label, "계속사업자");
    assert.match(r.summary, /일치/);
    assert.equal(calls[0].url, `${NTS_BASE_URL}/validate?serviceKey=test-key`);
    const sent = (calls[0].body as { businesses: Array<Record<string, string>> }).businesses[0];
    assert.equal(sent.b_no, "1234567891");
    assert.equal(sent.start_dt, "20220302");
    assert.equal(sent.p_nm, "홍길동");
  });

  it("진위확인 불일치(02) → matched=false + 메시지", async () => {
    const verify = createNtsVerifier({
      apiKey: "k",
      fetchImpl: mockFetch(() => ({ status_code: "OK", data: [{ b_no: "1234567891", valid: "02", valid_msg: "확인할 수 없습니다.", status: status({ b_stt_cd: "03", b_stt: "폐업자", end_dt: "20240101" }) }] })),
    });
    const r = await verify(input);
    assert.equal(r.identity?.matched, false);
    assert.equal(r.businessStatus?.label, "폐업자");
    assert.equal(r.businessStatus?.closedAt, "20240101");
    assert.match(r.summary, /일치하지 않아요/);
  });

  it("진위 불일치(02)에 status가 없으면 /status를 추가 호출해 미등록/폐업 표시", async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    const verify = createNtsVerifier({
      apiKey: "k",
      fetchImpl: mockFetch((url) =>
        url.includes("/validate")
          ? { status_code: "OK", data: [{ b_no: "1234567891", valid: "02", valid_msg: "확인할 수 없습니다." }] }
          : { status_code: "OK", data: [status({ b_stt: "", b_stt_cd: "", tax_type: "국세청에 등록되지 않은 사업자등록번호입니다." })] }, calls),
    });
    const r = await verify(input);
    assert.equal(calls.length, 2);
    assert.match(calls[1].url, /\/status\?/);
    assert.equal(r.identity?.matched, false);
    assert.equal(r.businessStatus?.label, "국세청에 등록되지 않은 번호");
  });

  it("개업일·대표자가 없으면 /status 상태조회만", async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    const verify = createNtsVerifier({ apiKey: "k", fetchImpl: mockFetch(() => ({ status_code: "OK", data: [status({ b_stt_cd: "02", b_stt: "휴업자" })] }), calls) });
    const r = await verify({ ...input, openedAt: null });
    assert.match(calls[0].url, /\/status\?/);
    assert.deepEqual(calls[0].body, { b_no: ["1234567891"] });
    assert.equal(r.businessStatus?.label, "휴업자");
    assert.equal(r.identity, undefined);
  });

  it("미등록 번호 → 국세청에 등록되지 않은 번호", async () => {
    const verify = createNtsVerifier({ apiKey: "k", fetchImpl: mockFetch(() => ({ status_code: "OK", data: [status({ b_stt: "", b_stt_cd: "", tax_type: "국세청에 등록되지 않은 사업자등록번호입니다." })] })) });
    const r = await verify({ ...input, openedAt: null });
    assert.equal(r.businessStatus?.label, "국세청에 등록되지 않은 번호");
  });

  it("API 오류·타임아웃 → checked=false, API_ERROR (기능은 계속 동작)", async () => {
    const verify = createNtsVerifier({ apiKey: "k", fetchImpl: (async () => new Response("bad", { status: 500 })) as typeof fetch });
    assert.equal((await verify(input)).skippedReason, "API_ERROR");
    const slow = createNtsVerifier({ apiKey: "k", timeoutMs: 20, fetchImpl: ((_u: unknown, init?: RequestInit) => new Promise((_res, rej) => init?.signal?.addEventListener("abort", () => rej(new Error("aborted"))))) as typeof fetch });
    assert.equal((await slow(input)).skippedReason, "API_ERROR");
  });
});
