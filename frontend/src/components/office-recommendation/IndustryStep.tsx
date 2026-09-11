"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useApiQuery } from "@/hooks/useApiQuery";
import { searchIndustries } from "@/lib/office-recommendation/api";
import type { Industry, IndustrySummary } from "@/lib/office-recommendation/types";
import { RegistrationStatusBadge } from "./Badge";
import { CheckIcon } from "./Icons";
import { ErrorState, ListSkeleton } from "./QueryStates";

type Props = {
  value: string | null;
  /** 부모가 API로 조회한 선택 업종 (note 포함). 아직 없으면 목록에서 찾아 표시합니다. */
  selectedIndustry: Industry | null;
  onChange: (industryId: string | null) => void;
};

/** 사용자가 실제로 입력하는 표현. 클릭하면 검색어로 들어갑니다. */
const QUICK_PICKS = ["온라인 쇼핑몰", "앱 개발", "디자인", "컨설팅", "유튜브", "프리랜서", "무역", "화장품 브랜드", "온라인 교육", "인테리어"];

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="9" r="5.5" />
      <path d="M13.2 13.2 17 17" strokeLinecap="round" />
    </svg>
  );
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function IndustryStep({ value, selectedIndustry, onChange }: Props) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 250);
  const inputId = useId();
  const listId = useId();

  const search = useApiQuery(
    `industries:${debouncedQuery}`,
    (signal) => searchIndustries(debouncedQuery, signal),
    { keepPreviousData: true },
  );
  const results = search.data?.items ?? [];
  const selected: Industry | IndustrySummary | undefined =
    selectedIndustry ?? results.find((industry) => industry.id === value);
  const selectedNote = selectedIndustry?.note ?? null;

  return (
    <section aria-labelledby="industry-step-heading">
      <h2 id="industry-step-heading" className="text-[22px] font-bold tracking-[-0.02em] text-ink sm:text-[26px]">
        어떤 사업을 하고 계신가요?
      </h2>
      <p className="mt-2 text-[15px] text-ink-2">
        하려는 사업을 검색해 보세요. 관련 업종과 비상주 등록 가능 여부를 함께 보여드려요.
      </p>

      <div className="mt-6">
        <label htmlFor={inputId} className="sr-only">
          사업 또는 업종 검색
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3">
            <SearchIcon />
          </span>
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 온라인 쇼핑몰, 앱 개발"
            autoComplete="off"
            aria-controls={listId}
            className="min-h-14 w-full rounded-xl border border-line-2 bg-white py-3 pl-12 pr-4 text-base text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none"
          />
        </div>
        {!query && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-3">자주 찾는 사업</span>
            {QUICK_PICKS.map((pick) => (
              <button
                key={pick}
                type="button"
                onClick={() => setQuery(pick)}
                className="transition-colors rounded-full border border-line-2 bg-white px-3 py-1.5 text-sm text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                {pick}
              </button>
            ))}
          </div>
        )}
        {!value && (
          <p className="mt-4 text-sm text-ink-2">
            이미 사업자가 있다면{" "}
            <Link href="/offices/recommend/registration" className="inline-flex min-h-9 items-center font-semibold text-brand-700 underline-offset-2 hover:underline">
              사업자등록증을 올려 조건을 자동으로 채울
            </Link>{" "}
            수 있어요.
          </p>
        )}
      </div>

      {selected && (
        <div
          className={cn(
            "mt-4 rounded-lg border p-4",
            selected.registrationStatus === "UNAVAILABLE"
              ? "border-red-200 bg-red-50"
              : "border-brand-100 bg-brand-50",
          )}
          role="status"
        >
          <p className="text-xs font-medium text-ink-3">선택한 업종</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">{selected.name}</span>
            <RegistrationStatusBadge status={selected.registrationStatus} />
          </div>
          {selected.registrationStatus === "UNAVAILABLE" ? (
            <p className="mt-2 text-sm text-red-700">
              이 업종은 비상주사무실로 사업자등록을 할 수 없어요. 다른 업종을 선택해 주세요.
              {selectedNote && ` ${selectedNote}`}
            </p>
          ) : (
            selectedNote && <p className="mt-2 text-sm text-ink-2">{selectedNote}</p>
          )}
        </div>
      )}

      <div className="mt-6 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-ink-2">
          {debouncedQuery ? "관련 업종" : "업종 목록"}
        </h3>
        <span className="text-xs text-ink-3" aria-live="polite">
          {search.isLoading && !search.data ? "불러오는 중" : `${results.length}개`}
        </span>
      </div>

      {search.error && !search.data ? (
        <div className="mt-3">
          <ErrorState error={search.error} onRetry={search.refetch} title="업종을 불러오지 못했어요." />
        </div>
      ) : search.isLoading && !search.data ? (
        <ListSkeleton />
      ) : results.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-line-2 p-6 text-center text-sm text-ink-2">
          &lsquo;{debouncedQuery}&rsquo;에 맞는 업종이 없어요. 다른 표현으로 검색해 보세요.
        </p>
      ) : (
        <ul id={listId} key={debouncedQuery} className={cn("mt-3 grid gap-2 sm:grid-cols-2", search.isLoading && "opacity-60 transition-opacity")}>
          {results.map((industry) => {
            const isSelected = industry.id === value;
            return (
              <li key={industry.id}>
                <button
                  type="button"
                  onClick={() => onChange(isSelected ? null : industry.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex min-h-12 w-full items-start gap-3 rounded-xl border bg-white p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
                    isSelected
                      ? "border-brand-500 bg-brand-50/50 ring-1 ring-brand-500"
                      : "border-line hover:border-brand-300",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                      isSelected
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-line-2 text-transparent",
                    )}
                  >
                    <CheckIcon className="size-3" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink">{industry.name}</span>
                      <RegistrationStatusBadge status={industry.registrationStatus} />
                    </span>
                    <span className="mt-1 block text-xs text-ink-3">{industry.category}</span>
                    {industry.description && (
                      <span className="mt-1 block text-sm text-ink-2">{industry.description}</span>
                    )}
                  </span>
                  {isSelected && <span className="sr-only">(선택됨)</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
