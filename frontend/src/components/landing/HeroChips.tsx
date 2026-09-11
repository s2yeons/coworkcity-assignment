/** 히어로 오른쪽에 떠 있는 조건 칩들. 추천 결과에서 실제로 쓰는 뱃지와 같은 어휘 (랜딩 전용 장식) */
const CHIPS: Array<{ label: string; x: string; y: string; i: number; tone: "white" | "green" | "cream" }> = [
  { label: "비과밀", x: "8%", y: "12%", i: 3, tone: "green" },
  { label: "인허가 업종 주소지 지원", x: "38%", y: "4%", i: 4, tone: "white" },
  { label: "월 20,000원~", x: "62%", y: "30%", i: 5, tone: "cream" },
  { label: "실사가능", x: "14%", y: "46%", i: 6, tone: "white" },
  { label: "개인 · 법인", x: "44%", y: "58%", i: 7, tone: "green" },
  { label: "소매업 등록 가능", x: "22%", y: "78%", i: 8, tone: "white" },
  { label: "추천 이유 표시", x: "60%", y: "84%", i: 9, tone: "cream" },
];

const TONE = {
  white: "bg-white text-ink",
  green: "bg-brand-700 text-white",
  cream: "bg-cream text-[#7a5a14]",
};

export function HeroChips() {
  return (
    <div aria-hidden="true" className="relative hidden h-[360px] lg:block">
      {CHIPS.map((c, idx) => (
        <span
          key={c.label}
          className={`stagger absolute inline-flex items-center rounded-full px-4 py-2 text-sm font-bold shadow-[0_10px_30px_rgba(0,0,0,0.12)] ${TONE[c.tone]} ${idx % 2 ? "animate-float-slow" : "animate-float"}`}
          style={{ left: c.x, top: c.y, "--i": c.i, animationDelay: `${c.i * 70}ms, ${idx * 700}ms` } as React.CSSProperties}
        >
          {c.label}
        </span>
      ))}
    </div>
  );
}
