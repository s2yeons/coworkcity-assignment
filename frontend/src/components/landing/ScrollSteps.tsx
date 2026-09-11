"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/layout/Reveal";

const STEPS = [
  ["업종", "사업 내용으로 검색해요. 신청 불가 업종은 이 단계에서 바로 알려드려요."],
  ["사업자 유형", "개인 또는 법인. 법인은 비과밀 여부가 등록세에 영향을 줘요."],
  ["지역", "앞 조건에 맞는 지점 수를 지역별로 미리 보여드려요."],
  ["추가 조건과 결과", "비과밀·인허가·가격을 고르면 충족 여부를 카드마다 표시해요."],
] as const;

/**
 * "이렇게 진행돼요" 섹션.
 * 데스크톱: 섹션을 길게 잡고 내용을 화면에 고정한 뒤, 스크롤 진행도에 따라 카드가 하나씩 켜집니다.
 * 모바일: 카드가 세로로 쌓이므로 각 카드가 화면에 들어올 때 하나씩 나타납니다.
 */
export function ScrollSteps() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(0);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const update = () => {
      raf = 0;
      const el = wrapRef.current;
      if (!el) return;
      if (!mq.matches || reduce) {
        setVisible(STEPS.length);
        return;
      }
      const rect = el.getBoundingClientRect();
      const scrollable = el.offsetHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 1;
      // 진행도 구간마다 카드 하나씩. 시작 직후 첫 카드, 끝에 도달하기 전에 마지막 카드가 켜지도록 여유를 둡니다.
      const count = Math.min(STEPS.length, Math.floor(progress * (STEPS.length + 0.6)) + (progress > 0.02 ? 1 : 0));
      setVisible(count);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onMq = () => {
      setDesktop(mq.matches);
      onScroll();
    };

    onMq();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    mq.addEventListener("change", onMq);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mq.removeEventListener("change", onMq);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="bg-surface" aria-labelledby="how-heading">
      <div ref={wrapRef} className="relative lg:h-[240vh]">
        <div className="lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-64px)] lg:flex-col lg:justify-center">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-16 text-center sm:px-6 lg:px-10 lg:py-0">
            <Reveal>
              <h2 id="how-heading" className="text-[26px] font-bold tracking-[-0.02em] text-ink sm:text-[32px]">
                이렇게 진행돼요
              </h2>
            </Reveal>

            {/* 데스크톱: 스크롤 진행도로 제어 */}
            <ol className="mt-10 hidden gap-4 text-left lg:grid lg:grid-cols-4">
              {STEPS.map(([t, d], i) => {
                const on = i < visible;
                return (
                  <li
                    key={t}
                    aria-hidden={desktop && !on}
                    className={cn(
                      "rounded-2xl bg-white p-6 transition-all duration-700 [transition-timing-function:cubic-bezier(0.2,0.7,0.2,1)]",
                      on ? "translate-y-0 opacity-100 shadow-[0_12px_32px_rgba(17,52,36,0.08)]" : "translate-y-8 opacity-0",
                    )}
                  >
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">{i + 1}</span>
                    <p className="mt-4 text-[17px] font-bold text-ink">{t}</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-2">{d}</p>
                  </li>
                );
              })}
            </ol>

            {/* 모바일·태블릿: 카드가 화면에 들어올 때 하나씩 */}
            <ol className="mt-10 grid gap-4 text-left sm:grid-cols-2 lg:hidden">
              {STEPS.map(([t, d], i) => (
                <Reveal as="li" key={t} index={i % 2} className="rounded-2xl bg-white p-6">
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">{i + 1}</span>
                  <p className="mt-4 text-[17px] font-bold text-ink">{t}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{d}</p>
                </Reveal>
              ))}
            </ol>

            {/* 진행 점 (데스크톱) */}
            <div className="mt-8 hidden justify-center gap-2 lg:flex" aria-hidden="true">
              {STEPS.map((_, i) => (
                <span key={i} className={cn("h-1.5 rounded-full transition-all duration-500", i < visible ? "w-8 bg-brand-500" : "w-3 bg-line-2")} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
