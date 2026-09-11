"use client";

import Link from "next/link";

/** 렌더링 중 예기치 못한 오류가 났을 때의 화면 (사이트 톤 유지, 기술 메시지는 노출하지 않음) */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex flex-1 items-center bg-white">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-24 text-center sm:px-6 lg:px-10">
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-ink sm:text-[36px]">잠시 문제가 생겼어요</h1>
        <p className="mt-3 text-ink-2">페이지를 그리는 중에 오류가 났어요. 다시 시도하거나 처음부터 진행해 주세요.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-500 px-6 font-bold text-white transition-colors hover:bg-brand-600">
            다시 시도
          </button>
          <Link href="/offices/recommend" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line-2 bg-white px-6 font-bold text-ink transition-colors hover:bg-surface">
            처음부터 찾기
          </Link>
        </div>
      </div>
    </main>
  );
}
