"use client";

import { useId, useState } from "react";
import { toApiError, type ApiError } from "@/lib/api";
import { verifyRegistrationFields } from "@/lib/office-recommendation/api";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge, RegistrationStatusBadge } from "@/components/office-recommendation/Badge";
import { BUSINESS_TYPES, REGIONS, regionIdFromLabel } from "@/lib/office-recommendation/constants";
import { RESULT_STEP, serializeState } from "@/lib/office-recommendation/search-params";
import type {
  BusinessRegistrationAnalysis,
  BusinessType,
  RegionId,
  RegistrationFieldsInput,
} from "@/lib/office-recommendation/types";

/** 사업자등록번호 입력을 000-00-00000 형태로 정리 (OCR이 O/I로 읽은 글자도 숫자로) */
function formatBizNumberInput(raw: string): string {
  const digits = raw.replace(/[Oo]/g, "0").replace(/[Il|]/g, "1").replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function toInput(a: BusinessRegistrationAnalysis): RegistrationFieldsInput {
  return {
    businessNumber: a.fields.businessNumber,
    businessType: a.fields.businessType,
    companyName: a.fields.companyName,
    representative: a.fields.representative,
    openedAt: a.fields.openedAt,
    address: a.fields.address,
    businessCategories: [...new Set(a.fields.businessCategories)],
    businessItems: a.fields.businessItems,
  };
}

type Props = {
  analysis: BusinessRegistrationAnalysis;
  sourceLabel: string;
  previewUrl: string | null;
  onReset: () => void;
};

/** 국세청 확인 결과를 한 줄 상태로 요약. 색은 사이트 톤(초록 / 크림+주황 / 회색)만 사용 */
function VerificationStatus({ analysis }: { analysis: BusinessRegistrationAnalysis }) {
  const { verification, fields, warnings } = analysis;
  const matched = verification.checked && verification.identity?.matched === true;
  const problem = verification.checked && (verification.identity?.matched === false || (verification.businessStatus && verification.businessStatus.code !== "01"));

  const dot = matched ? "bg-brand-500" : problem ? "bg-accent" : "bg-line-2";
  const title = matched
    ? "국세청 기록과 일치하는 사업자예요"
    : problem
      ? "국세청 기록과 확인이 필요해요"
      : verification.checked
        ? "국세청 상태 조회 완료"
        : "국세청 확인은 하지 않았어요";

  const notes = [
    fields.businessNumberValid === true ? "사업자등록번호 형식 검증 통과" : fields.businessNumberValid === false ? "사업자등록번호 형식 검증 실패" : null,
    verification.businessStatus && verification.checked
      ? `${verification.businessStatus.label}${verification.businessStatus.taxType && verification.businessStatus.code ? ` · ${verification.businessStatus.taxType}` : ""}`
      : null,
    !verification.checked ? verification.summary : null,
    ...warnings,
  ].filter((n): n is string => Boolean(n));

  return (
    <div className="rounded-2xl border border-line bg-white p-5" role="status">
      <p className="flex items-center gap-2 text-[15px] font-bold text-ink">
        <span aria-hidden="true" className={cn("size-2 rounded-full", dot)} />
        {title}
      </p>
      {notes.length > 0 && (
        <ul className="mt-2 space-y-1 pl-4 text-sm text-ink-2">
          {notes.map((n) => (
            <li key={n} className="flex gap-2">
              <span aria-hidden="true" className="text-ink-3">·</span>
              <span>{n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** OCR 결과를 확인·수정하고 추천 조건으로 넘기는 화면 */
export function RegistrationResult({ analysis: initial, sourceLabel, previewUrl, onReset }: Props) {
  const [analysis, setAnalysis] = useState(initial);
  const { fields, suggestion, ocr } = analysis;
  const [form, setForm] = useState<RegistrationFieldsInput>(() => toInput(initial));
  const [dirty, setDirty] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<ApiError | null>(null);
  const [businessType, setBusinessType] = useState<BusinessType | null>(suggestion.businessType);
  const [regionId, setRegionId] = useState<RegionId | null>(suggestion.region ? regionIdFromLabel(suggestion.region) : null);
  const [industryId, setIndustryId] = useState<string | null>(suggestion.industries[0]?.id ?? null);
  const regionSelectId = useId();
  const formId = useId();

  const edit = <K extends keyof RegistrationFieldsInput>(key: K, value: RegistrationFieldsInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  /** 고친 값으로 국세청 확인·업종 매칭을 다시 수행. 이미지는 다시 보내지 않습니다. */
  async function reverify() {
    setVerifying(true);
    setVerifyError(null);
    try {
      const next = await verifyRegistrationFields({ ...form, businessType: form.businessType ?? businessType });
      setAnalysis(next);
      setForm(toInput(next));
      setDirty(false);
      if (next.suggestion.businessType) setBusinessType(next.suggestion.businessType);
      if (next.suggestion.region) setRegionId(regionIdFromLabel(next.suggestion.region));
      if (!next.suggestion.industries.some((i) => i.id === industryId)) setIndustryId(next.suggestion.industries[0]?.id ?? null);
    } catch (e) {
      setVerifyError(toApiError(e));
    } finally {
      setVerifying(false);
    }
  }

  const ready = Boolean(businessType && regionId && industryId);
  const baseFilters = { nonCongested: false, permitAddressSupported: false, maxMonthlyPrice: null };
  const targetQuery = serializeState({ industryId, businessType, regionId, ...baseFilters }, ready ? RESULT_STEP : 1);

  const inputClass =
    "h-11 w-full rounded-lg border border-line-2 bg-white px-3 text-sm font-medium text-ink placeholder:font-normal placeholder:text-ink-3 focus:border-ink focus:outline-none";
  const textFields: Array<{ key: "companyName" | "representative" | "address"; label: string; placeholder: string }> = [
    { key: "companyName", label: fields.businessType === "CORPORATE" ? "법인명" : "상호", placeholder: "등록증의 상호(법인명)" },
    { key: "representative", label: fields.businessType === "CORPORATE" ? "대표자" : "성명", placeholder: "대표자 성명" },
    { key: "address", label: "사업장 소재지", placeholder: "시·도부터 입력 (예: 서울특별시 …)" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-ink sm:text-[26px]">등록증에서 읽은 정보를 확인해 주세요</h2>
          <p className="mt-2 text-sm text-ink-3">
            {sourceLabel}
            {ocr ? ` · 인식 신뢰도 ${ocr.confidence}%` : " · 수정한 값으로 다시 확인함"} · 잘못 읽힌 값은 아래에서 바로 고칠 수 있어요. 읽은 정보는 저장하지 않아요.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-10 items-center rounded-lg border border-line-2 bg-white px-4 text-sm font-medium text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          다른 이미지 올리기
        </button>
      </div>

      <div className="mt-6">
        <VerificationStatus analysis={analysis} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <section aria-labelledby="read-heading" className="rounded-3xl bg-surface p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 id="read-heading" className="text-[15px] font-bold text-ink">읽은 정보</h3>
              <p className="mt-1 text-xs text-ink-3">틀린 곳은 고치고 다시 확인하세요</p>
            </div>
            {previewUrl && (
              <Image
                src={previewUrl}
                alt="업로드한 사업자등록증 미리보기"
                width={80}
                height={113}
                unoptimized
                className="h-24 w-auto shrink-0 rounded-md border border-line bg-white object-contain"
              />
            )}
          </div>
          <form
            id={formId}
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              reverify();
            }}
          >
            <div>
              <div className="min-w-0 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-ink-3">사업자등록번호</span>
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="000-00-00000"
                    value={form.businessNumber ?? ""}
                    onChange={(e) => edit("businessNumber", formatBizNumberInput(e.target.value) || null)}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {textFields.slice(0, 2).map((f) => (
                    <label key={f.key} className="block">
                      <span className="mb-1 block text-xs font-medium text-ink-3">{f.label}</span>
                      <input
                        className={inputClass}
                        autoComplete="off"
                        placeholder={f.placeholder}
                        value={form[f.key] ?? ""}
                        onChange={(e) => edit(f.key, e.target.value || null)}
                      />
                    </label>
                  ))}
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-ink-3">개업연월일</span>
                  <input
                    type="date"
                    className={inputClass}
                    value={form.openedAt ?? ""}
                    onChange={(e) => edit("openedAt", e.target.value || null)}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-ink-3">사업장 소재지</span>
                  <input
                    className={inputClass}
                    autoComplete="off"
                    placeholder="시·도부터 입력 (예: 서울특별시 …)"
                    value={form.address ?? ""}
                    onChange={(e) => edit("address", e.target.value || null)}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-ink-3">업태</span>
                    <input
                      className={inputClass}
                      autoComplete="off"
                      placeholder="쉼표로 구분"
                      value={form.businessCategories.join(", ")}
                      onChange={(e) => edit("businessCategories", e.target.value.split(",").map((v) => v.trim()).filter(Boolean))}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-ink-3">종목</span>
                    <input
                      className={inputClass}
                      autoComplete="off"
                      placeholder="쉼표로 구분"
                      value={form.businessItems.join(", ")}
                      onChange={(e) => edit("businessItems", e.target.value.split(",").map((v) => v.trim()).filter(Boolean))}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={verifying || !dirty}
                className={cn(
                  "h-11 rounded-lg px-5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
                  dirty && !verifying ? "bg-ink text-white hover:bg-black" : "cursor-not-allowed bg-line-2 text-ink-3",
                )}
              >
                {verifying ? "확인 중…" : "수정한 정보로 다시 확인"}
              </button>
              <p className="text-xs text-ink-3" role="status">
                {verifying
                  ? "국세청 기록과 업종을 다시 확인하고 있어요."
                  : dirty
                    ? "값을 고쳤어요. 다시 확인하면 국세청 결과와 추천 조건이 갱신돼요."
                    : "국세청 확인은 등록번호·개업일·대표자명으로 이뤄져요."}
              </p>
            </div>
            {verifyError && (
              <p role="alert" className="mt-2 text-sm text-ink-2">
                {verifyError.message}
              </p>
            )}
          </form>
        </section>

        <section aria-labelledby="cond-heading" className="rounded-3xl border border-line bg-white p-6 shadow-[0_8px_24px_rgba(17,52,36,0.06)]">
          <h3 id="cond-heading" className="text-[15px] font-bold text-ink">추천에 사용할 조건</h3>
          <p className="mt-1 text-sm text-ink-3">자동으로 채웠어요. 잘못 읽혔다면 여기서 바로 고칠 수 있어요.</p>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold text-ink">사업자 유형</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {BUSINESS_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setBusinessType(type.id)}
                  aria-pressed={businessType === type.id}
                  className={cn(
                    "h-12 rounded-xl border text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
                    businessType === type.id ? "border-brand-500 bg-brand-50 text-brand-800" : "border-line-2 text-ink-2 hover:border-ink",
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-5">
            <label htmlFor={regionSelectId} className="text-sm font-semibold text-ink">
              지역
            </label>
            <select
              id={regionSelectId}
              value={regionId ?? ""}
              onChange={(e) => setRegionId((e.target.value || null) as RegionId | null)}
              className="mt-2 h-12 w-full rounded-xl border border-line-2 bg-white px-4 text-sm font-medium text-ink focus:border-ink focus:outline-none"
            >
              <option value="">지역을 선택해 주세요</option>
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            {fields.region && !suggestion.region && (
              <p className="mt-1.5 text-xs text-ink-2">등록증 주소는 &lsquo;{fields.region}&rsquo;이지만 아직 지점이 없어요. 전체나 가까운 지역을 골라 주세요.</p>
            )}
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold text-ink">업종</legend>
            {suggestion.industries.length === 0 ? (
              <p className="mt-2 text-sm text-ink-3">업태·종목에 맞는 업종을 찾지 못했어요. 아래에서 직접 검색해 주세요.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {suggestion.industries.map((industry, index) => (
                  <li key={industry.id}>
                    <button
                      type="button"
                      onClick={() => setIndustryId(industry.id)}
                      aria-pressed={industryId === industry.id}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
                        industryId === industry.id ? "border-brand-500 bg-brand-50" : "border-line-2 hover:border-ink",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px]",
                          industryId === industry.id ? "border-brand-500 bg-brand-500 text-white" : "border-line-2 text-transparent",
                        )}
                      >
                        ✓
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-ink">{industry.name}</span>
                          <RegistrationStatusBadge status={industry.registrationStatus} />
                          {index === 0 && <Badge tone="info">가장 가까움</Badge>}
                        </span>
                        {industry.matchedTerms.length > 0 && (
                          <span className="mt-0.5 block text-xs text-ink-3">일치: {industry.matchedTerms.join(", ")}</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`/offices/recommend?${serializeState({ industryId: null, businessType, regionId, ...baseFilters }, 1)}`}
              className="mt-1 inline-flex min-h-10 items-center text-xs font-semibold text-brand-700 underline-offset-2 hover:underline"
            >
              다른 업종 직접 검색하기
            </Link>
          </fieldset>

          <div className="mt-6 border-t border-line pt-5">
            {!ready && (
              <p className="mb-3 text-sm text-ink-3" role="status">
                사업자 유형, 지역, 업종을 모두 정하면 지점을 찾을 수 있어요.
              </p>
            )}
            <Link
              href={`/offices/recommend?${targetQuery}`}
              aria-disabled={!ready}
              tabIndex={ready ? 0 : -1}
              onClick={(e) => !ready && e.preventDefault()}
              className={cn(
                "flex h-[52px] w-full items-center justify-center rounded-xl px-6 text-base font-bold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
                ready ? "bg-brand-500 hover:bg-brand-600" : "cursor-not-allowed bg-line-2",
              )}
            >
              이 조건으로 지점 찾기
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
