import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center bg-white">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-24 text-center sm:px-6 lg:px-10">
        <p className="wordmark text-sm text-brand-500">404</p>
        <h1 className="mt-3 text-[28px] font-bold tracking-[-0.03em] text-ink sm:text-[36px]">페이지를 찾을 수 없어요</h1>
        <p className="mt-3 text-ink-2">주소가 바뀌었거나 없는 지점이에요. 조건을 다시 입력해서 지점을 찾아보세요.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/offices/recommend" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-500 px-6 font-bold text-white transition-colors hover:bg-brand-600">
            내 조건으로 지점 찾기
          </Link>
          <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line-2 bg-white px-6 font-bold text-ink transition-colors hover:bg-surface">
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}
