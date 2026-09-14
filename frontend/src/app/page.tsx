import Link from "next/link";
import { LiveStats } from "@/components/landing/LiveStats";
import { RegionMarquee } from "@/components/landing/RegionMarquee";
import { ScrollSteps } from "@/components/landing/ScrollSteps";
import { Reveal } from "@/components/layout/Reveal";

export default function Home() {
  return (
    <main className="flex-1 bg-white">
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[64px_64px] mask-[radial-gradient(ellipse_at_center,black_5%,transparent_55%)]"
        />
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="pointer-events-none absolute left-[8%] top-[16%] size-6 -rotate-6 text-white/10">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
        </svg>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="pointer-events-none absolute bottom-[20%] right-[10%] size-5 rotate-12 text-white/10">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
        </svg>
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full bg-white/15 blur-3xl animate-float" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-1/3 size-[360px] rounded-full bg-[#f5e9b8]/20 blur-3xl animate-float-slow" />

        <div className="relative mx-auto flex min-h-130 w-full max-w-180 flex-col items-center px-4 py-24 text-center sm:px-6 lg:min-h-155 lg:py-28">
          <p className="stagger text-sm font-semibold text-white/80" style={{ "--i": 0 } as React.CSSProperties}>비상주사무실</p>
          <h1 className="mt-4 text-[40px] font-bold leading-[1.15] tracking-[-0.03em] sm:text-[60px]">
            <span className="stagger block" style={{ "--i": 1 } as React.CSSProperties}>조건만 입력하면</span>
            <span className="stagger block" style={{ "--i": 2 } as React.CSSProperties}>내 사업에 맞는 지점</span>
          </h1>
          <p className="stagger mt-6 text-lg text-white/90" style={{ "--i": 3 } as React.CSSProperties}>월 20,000원부터 · 업종별 등록 가능 지점만 골라서</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/offices/recommend"
              style={{ "--i": 4 } as React.CSSProperties}
              className="stagger press inline-flex min-h-[56px] items-center justify-center rounded-xl bg-brand-700 px-8 text-base font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              조건 입력해서 찾기
            </Link>
            <Link
              href="/offices/recommend/registration"
              style={{ "--i": 5 } as React.CSSProperties}
              className="stagger press inline-flex min-h-[56px] items-center justify-center rounded-xl bg-white px-8 text-base font-bold text-ink shadow-[0_8px_24px_rgba(0,0,0,0.10)] hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              사업자등록증으로 찾기
            </Link>
          </div>
        </div>
      </section>

      <RegionMarquee />

      <LiveStats />

      <section className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal index={0}>
            <Link
              href="/offices/recommend"
              className="press flex h-full flex-col justify-between rounded-3xl border border-line bg-white p-8 hover:shadow-[0_12px_32px_rgba(17,52,36,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              <div>
                <p className="text-sm font-semibold text-brand-700">처음 시작하는 사업자</p>
                <p className="mt-2 text-[24px] font-bold text-ink">조건 입력해서 찾기</p>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
                  하려는 사업을 검색하면 업종과 등록 가능 여부를 함께 확인하고, 4단계로 조건에 맞는 지점을 찾아요.
                </p>
              </div>
              <span className="mt-8 inline-flex h-11 w-fit items-center rounded-lg bg-brand-500 px-5 text-sm font-bold text-white">시작하기</span>
            </Link>
          </Reveal>
          <Reveal index={1}>
            <Link
              href="/offices/recommend/registration"
              className="press flex h-full flex-col justify-between rounded-3xl border border-line bg-cream p-8 hover:shadow-[0_12px_32px_rgba(17,52,36,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              <div>
                <p className="text-sm font-semibold text-accent">이미 사업자가 있는 경우</p>
                <p className="mt-2 text-[24px] font-bold text-ink">사업자등록증으로 찾기</p>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
                  등록증 이미지에서 사업자 유형·지역·업종을 읽어 조건을 채우고, 국세청 진위확인 결과와 함께 이전 가능한 지점을 보여드려요.
                </p>
              </div>
              <span className="mt-8 inline-flex h-11 w-fit items-center rounded-lg bg-white px-5 text-sm font-bold text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]">등록증 올리기</span>
            </Link>
          </Reveal>
        </div>
      </section>

      <ScrollSteps />
    </main>
  );
}
