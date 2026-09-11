import type { ApiError } from "@/lib/api";

/** API 호출 실패 시 공통 오류 UI (다시 시도 제공) */
export function ErrorState({
  error,
  onRetry,
  title = "지점을 불러오지 못했어요.",
}: {
  error: ApiError;
  onRetry: () => void;
  title?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-line bg-white p-6 text-center"
    >
      <p className="font-bold text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink-2">
        {error.status === 0 ? error.message : "잠시 후 다시 시도해주세요."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 min-h-11 rounded-lg border border-line-2 bg-white px-5 font-semibold text-ink transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        다시 시도
      </button>
    </div>
  );
}

/** 카드 목록 로딩 스켈레톤 */
export function CardSkeletons({ count = 3, label = "불러오는 중" }: { count?: number; label?: string }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label={label}>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="animate-pulse rounded-xl border border-line bg-white p-5">
          <div className="h-5 w-2/3 rounded bg-line" />
          <div className="mt-2 h-4 w-1/3 rounded bg-surface" />
          <div className="mt-5 h-6 w-1/2 rounded bg-line" />
          <div className="mt-4 flex gap-2">
            <div className="h-5 w-16 rounded bg-surface" />
            <div className="h-5 w-16 rounded bg-surface" />
          </div>
          <div className="mt-4 h-4 w-3/4 rounded bg-surface" />
          <div className="mt-2 h-4 w-1/2 rounded bg-surface" />
          <div className="mt-6 h-11 rounded-lg bg-surface" />
        </li>
      ))}
      <li className="sr-only" aria-live="polite">
        {label}
      </li>
    </ul>
  );
}

export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-2" aria-busy="true" aria-label="업종을 불러오는 중">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="animate-pulse rounded-lg border border-line bg-white p-4">
          <div className="h-5 w-1/2 rounded bg-line" />
          <div className="mt-2 h-3 w-1/4 rounded bg-surface" />
          <div className="mt-2 h-4 w-3/4 rounded bg-surface" />
        </li>
      ))}
    </ul>
  );
}
