"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ApiError, toApiError } from "@/lib/api";
import { useApiQuery } from "@/hooks/useApiQuery";
import {
  API_BASE_URL,
  analyzeRegistrationImage,
  analyzeRegistrationSample,
  getRegistrationSamples,
} from "@/lib/office-recommendation/api";
import type { BusinessRegistrationAnalysis } from "@/lib/office-recommendation/types";
import { PdfThumbnail, type Preview } from "./PdfThumbnail";
import { RegistrationResult } from "./RegistrationResult";

const ACCEPT = "image/png,image/jpeg,image/webp,application/pdf";
const MAX_SIZE = 10 * 1024 * 1024;

type Status =
  | { kind: "idle" }
  | { kind: "analyzing"; label: string }
  | { kind: "done"; analysis: BusinessRegistrationAnalysis; sourceLabel: string }
  | { kind: "error"; error: ApiError; retry: () => void };

export function RegistrationUpload() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const samples = useApiQuery("registration-samples", (signal) => getRegistrationSamples(signal));

  useEffect(() => {
    return () => {
      if (preview?.url.startsWith("blob:")) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  async function runAnalysis(task: () => Promise<BusinessRegistrationAnalysis>, label: string, nextPreview: Preview | null) {
    setPreview(nextPreview);
    setStatus({ kind: "analyzing", label });
    try {
      const analysis = await task();
      setStatus({ kind: "done", analysis, sourceLabel: label });
    } catch (error) {
      setStatus({ kind: "error", error: toApiError(error), retry: () => runAnalysis(task, label, nextPreview) });
    }
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type)) {
      setStatus({ kind: "error", error: new ApiError(400, "UNSUPPORTED_FILE_TYPE", "PNG, JPEG, WEBP 이미지 또는 PDF 파일만 올릴 수 있어요."), retry: () => inputRef.current?.click() });
      return;
    }
    if (file.size > MAX_SIZE) {
      setStatus({ kind: "error", error: new ApiError(413, "LIMIT_FILE_SIZE", "파일은 10MB 이하로 올려주세요."), retry: () => inputRef.current?.click() });
      return;
    }
    runAnalysis(() => analyzeRegistrationImage(file), file.name, { url: URL.createObjectURL(file), isPdf: file.type === "application/pdf" });
  }

  function reset() {
    setStatus({ kind: "idle" });
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (status.kind === "done") {
    return (
      <RegistrationResult
        analysis={status.analysis}
        sourceLabel={status.sourceLabel}
        preview={preview}
        onReset={reset}
      />
    );
  }

  return (
    <div>
      <section aria-labelledby="upload-heading">
        <h2 id="upload-heading" className="text-[22px] font-bold tracking-[-0.02em] text-ink sm:text-[26px]">
          사업자등록증을 올려주세요
        </h2>
        <p className="mt-2 text-[15px] text-ink-2">
          사업자 유형, 사업장 지역, 업태·종목을 읽어 추천 조건을 채워드려요. 이미지는 분석 후 즉시 폐기되고 저장하지 않아요.
        </p>

        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "mt-6 flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-surface/60 p-8 text-center transition-colors",
            dragging ? "border-brand-500 bg-brand-50" : "border-line-2 hover:border-ink",
            status.kind === "analyzing" && "pointer-events-none opacity-60",
          )}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-8 text-ink-3" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 16V4m0 0-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" />
          </svg>
          <span className="mt-1 text-base font-semibold text-ink">등록증 이미지를 여기에 놓거나 클릭해서 선택</span>
          <span className="text-sm text-ink-3">PNG · JPEG · WEBP · PDF · 10MB 이하 · 등록증 전체가 보이게</span>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            disabled={status.kind === "analyzing"}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>

        {status.kind === "analyzing" && (
          <div role="status" aria-live="polite" className="mt-4 flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4">
            {preview && (preview.isPdf ? (
              <PdfThumbnail className="h-16 w-12" />
            ) : (
              <Image src={preview.url} alt="" width={48} height={64} unoptimized className="h-16 w-12 rounded object-cover" />
            ))}
            <div>
              <p className="font-medium text-brand-900">등록증을 읽는 중</p>
              <p className="text-sm text-brand-800">{status.label}</p>
            </div>
            <span aria-hidden="true" className="ml-auto size-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
          </div>
        )}

        {status.kind === "error" && (
          <div role="alert" className="mt-4 rounded-xl border border-line bg-white p-4">
            <p className="flex items-center gap-2 font-bold text-ink"><span aria-hidden="true" className="size-2 rounded-full bg-accent" />
              {status.error.status === 0
                ? "서버에 연결할 수 없어요."
                : status.error.status === 429
                  ? "잠시 요청이 많아요."
                  : "등록증을 읽지 못했어요."}
            </p>
            <p className="mt-1 text-sm text-ink-2">{status.error.message}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={status.retry}
                className="transition-colors min-h-10 rounded-lg border border-line-2 bg-white px-4 text-sm font-semibold text-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                다시 시도
              </button>
              <button
                type="button"
                onClick={reset}
                className="transition-colors min-h-10 rounded-lg px-4 text-sm font-medium text-ink-2 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                처음으로
              </button>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="samples-heading" className="mt-10 border-t border-line pt-8">
        <h2 id="samples-heading" className="text-sm font-semibold text-ink">
          등록증이 없다면 샘플로 체험
        </h2>
        <p className="mt-1 text-xs text-ink-3">
          가상 정보로 만든 테스트용 등록증이에요. 실제 사업자와 무관해요.
        </p>
        {samples.error ? (
          <p className="mt-3 text-sm text-ink-3">샘플 목록을 불러오지 못했어요.</p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {(samples.data?.items ?? []).map((sample) => (
              <li key={sample.id}>
                <button
                  type="button"
                  disabled={status.kind === "analyzing"}
                  onClick={() =>
                    runAnalysis(() => analyzeRegistrationSample(sample.id), sample.label, { url: `${API_BASE_URL}${sample.imageUrl}`, isPdf: false })
                  }
                  className="flex min-h-12 w-full items-center gap-3 rounded-lg border border-line bg-white p-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Image
                    src={`${API_BASE_URL}${sample.imageUrl}`}
                    alt=""
                    width={40}
                    height={56}
                    unoptimized
                    className="h-14 w-10 shrink-0 rounded border border-line object-cover"
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">{sample.label}</span>
                    <span className="mt-0.5 block text-xs text-ink-3">{sample.description}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-sm text-ink-3">
        처음 창업하시나요?{" "}
        <Link href="/offices/recommend" className="inline-flex min-h-9 items-center font-medium text-brand-700 underline-offset-2 hover:underline">
          업종을 검색해서 시작하기
        </Link>
      </p>
    </div>
  );
}
