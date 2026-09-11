/**
 * 국세청 사업자등록정보 진위확인·상태조회 (공공데이터포털 API).
 *   https://www.data.go.kr/data/15081808/openapi.do
 *
 * - NTS_API_KEY 환경변수가 있을 때만 호출합니다. 없으면 "미확인"으로 표시하고 기능은 계속 동작합니다.
 * - 진위확인(validate): 등록번호 + 개업일자 + 대표자명이 국세청 기록과 일치하는지 → 등록증이 위·변조되지 않았는지
 * - 상태조회(status): 계속사업자 / 휴업자 / 폐업자, 과세 유형
 * - 국세청에 보내는 값은 OCR로 읽은 번호·개업일·대표자명뿐이며 이미지는 보내지 않습니다.
 */

export const NTS_BASE_URL = "https://api.odcloud.kr/api/nts-businessman/v1";

export type NtsStatus = {
  b_no: string;
  b_stt: string;
  b_stt_cd: "01" | "02" | "03" | "";
  tax_type: string;
  tax_type_cd: string;
  end_dt: string;
  utcc_yn: string;
  tax_type_change_dt: string;
  invoice_apply_dt: string;
};

type StatusResponse = { status_code: string; match_cnt?: number; request_cnt?: number; data?: NtsStatus[] };
type ValidateResponse = {
  status_code: string;
  data?: Array<{ b_no: string; valid: "01" | "02"; valid_msg?: string; status?: NtsStatus }>;
};

export type VerificationResult = {
  /** 국세청 API를 실제로 호출했는지 */
  checked: boolean;
  /** checked=false 인 이유 */
  skippedReason?: "NO_API_KEY" | "NO_BUSINESS_NUMBER" | "API_ERROR";
  /** 상태조회 결과 */
  businessStatus?: { code: NtsStatus["b_stt_cd"]; label: string; taxType: string; closedAt: string | null };
  /** 진위확인 결과 (개업일·대표자명이 있을 때만) */
  identity?: { matched: boolean; message: string };
  /** 사용자에게 보여줄 한 줄 요약 */
  summary: string;
};

export type VerificationInput = {
  businessNumber: string | null; // 000-00-00000
  openedAt: string | null; // YYYY-MM-DD
  representative: string | null;
  companyName?: string | null;
};

type FetchLike = typeof fetch;

const STATUS_LABEL: Record<string, string> = {
  "01": "계속사업자",
  "02": "휴업자",
  "03": "폐업자",
};

export function createNtsVerifier(options: { apiKey?: string; fetchImpl?: FetchLike; timeoutMs?: number } = {}) {
  const apiKey = options.apiKey ?? process.env.NTS_API_KEY;
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 5000;

  async function post<T>(path: "status" | "validate", body: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(`${NTS_BASE_URL}/${path}?serviceKey=${encodeURIComponent(apiKey!)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`NTS ${path} HTTP ${res.status}`);
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  return async function verify(input: VerificationInput): Promise<VerificationResult> {
    const digits = input.businessNumber?.replace(/\D/g, "") ?? "";
    if (digits.length !== 10) {
      return { checked: false, skippedReason: "NO_BUSINESS_NUMBER", summary: "사업자등록번호를 읽지 못해 국세청 확인을 건너뛰었어요." };
    }
    if (!apiKey) {
      return {
        checked: false,
        skippedReason: "NO_API_KEY",
        summary: "국세청 진위확인은 NTS_API_KEY 설정 시 동작해요. (형식 검증만 수행)",
      };
    }

    try {
      const canValidate = Boolean(input.openedAt && input.representative);
      if (canValidate) {
        const res = await post<ValidateResponse>("validate", {
          businesses: [
            {
              b_no: digits,
              start_dt: input.openedAt!.replace(/-/g, ""),
              p_nm: input.representative!,
              p_nm2: "",
              b_nm: input.companyName ?? "",
              corp_no: "",
              b_sector: "",
              b_type: "",
              b_adr: "",
            },
          ],
        });
        const item = res.data?.[0];
        if (!item) throw new Error("NTS validate: empty data");
        const matched = item.valid === "01";
        // 불일치(02)면 status가 오지 않으므로 상태조회를 한 번 더 해 미등록/휴업/폐업까지 보여줍니다.
        const status =
          item.status ?? (await post<StatusResponse>("status", { b_no: [digits] })).data?.[0];
        const businessStatus = status
          ? {
              code: status.b_stt_cd,
              label: STATUS_LABEL[status.b_stt_cd] ?? (status.b_stt || "국세청에 등록되지 않은 번호"),
              taxType: status.tax_type,
              closedAt: status.end_dt || null,
            }
          : undefined;
        return {
          checked: true,
          businessStatus,
          identity: { matched, message: matched ? "등록번호·개업일·대표자명이 국세청 기록과 일치해요." : item.valid_msg || "국세청 기록과 일치하지 않아요." },
          summary: matched
            ? `국세청 확인: ${businessStatus?.label ?? "확인됨"} · 등록증 정보 일치`
            : `국세청 확인: 등록증 정보가 기록과 일치하지 않아요${businessStatus ? ` (${businessStatus.label})` : ""}`,
        };
      }

      const res = await post<StatusResponse>("status", { b_no: [digits] });
      const status = res.data?.[0];
      if (!status) throw new Error("NTS status: empty data");
      const label = STATUS_LABEL[status.b_stt_cd] ?? (status.b_stt || "국세청에 등록되지 않은 번호");
      return {
        checked: true,
        businessStatus: { code: status.b_stt_cd, label, taxType: status.tax_type, closedAt: status.end_dt || null },
        summary: `국세청 확인: ${label}${status.tax_type ? ` · ${status.tax_type}` : ""} (개업일·대표자를 읽지 못해 진위확인은 생략)`,
      };
    } catch {
      return { checked: false, skippedReason: "API_ERROR", summary: "국세청 조회에 실패했어요. 잠시 후 다시 시도해주세요." };
    }
  };
}

/** 앱 전역 인스턴스 (환경변수 기반) */
export const verifyWithNts = createNtsVerifier();
