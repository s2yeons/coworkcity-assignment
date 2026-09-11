"use client";

import { useRef } from "react";

/** 히어로 오른쪽에 떠 있는 조건 칩들. 추천 결과에서 실제로 쓰는 뱃지와 같은 어휘 (랜딩 전용 장식) */
const CHIPS: Array<{ label: string; x: string; y: string; i: number; depth: number; tone: "white" | "green" | "cream" }> = [
  { label: "비과밀", x: "8%", y: "12%", i: 3, depth: 18, tone: "green" },
  { label: "인허가 업종 주소지 지원", x: "38%", y: "4%", i: 4, depth: 26, tone: "white" },
  { label: "월 20,000원~", x: "62%", y: "30%", i: 5, depth: 14, tone: "cream" },
  { label: "실사가능", x: "14%", y: "46%", i: 6, depth: 22, tone: "white" },
  { label: "개인 · 법인", x: "44%", y: "58%", i: 7, depth: 16, tone: "green" },
  { label: "소매업 등록 가능", x: "22%", y: "78%", i: 8, depth: 24, tone: "white" },
  { label: "추천 이유 표시", x: "60%", y: "84%", i: 9, depth: 20, tone: "cream" },
];

const TONE = {
  white: "bg-white text-ink",
  green: "bg-brand-700 text-white",
  cream: "bg-cream text-[#7a5a14]",
};

/**
 * 커서를 올려 움직이는 동안에만 칩이 살짝 따라 움직이는 패럴랙스 효과.
 * 자동 재생 애니메이션(animate-float) 대신 마우스 위치에만 반응한다.
 */
export function HeroChips() {
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    containerRef.current?.style.setProperty("--mx", dx.toFixed(3));
    containerRef.current?.style.setProperty("--my", dy.toFixed(3));
  };

  const handlePointerLeave = () => {
    containerRef.current?.style.setProperty("--mx", "0");
    containerRef.current?.style.setProperty("--my", "0");
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-hidden="true"
      className="relative hidden h-[360px] lg:block"
      style={{ "--mx": 0, "--my": 0 } as React.CSSProperties}
    >
      {CHIPS.map((c) => (
        <span
          key={c.label}
          className={`stagger absolute inline-flex select-none items-center rounded-full px-4 py-2 text-sm font-bold shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out ${TONE[c.tone]}`}
          style={
            {
              left: c.x,
              top: c.y,
              "--i": c.i,
              transform: `translate3d(calc(var(--mx) * ${c.depth}px), calc(var(--my) * ${c.depth}px), 0)`,
            } as React.CSSProperties
          }
        >
          {c.label}
        </span>
      ))}
    </div>
  );
}
