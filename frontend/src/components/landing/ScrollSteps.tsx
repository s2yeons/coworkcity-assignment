const STEPS = [
  ["업종", "사업 내용으로 검색해요. 신청 불가 업종은 이 단계에서 바로 알려드려요."],
  ["사업자 유형", "개인 또는 법인. 법인은 비과밀 여부가 등록세에 영향을 줘요."],
  ["지역", "앞 조건에 맞는 지점 수를 지역별로 미리 보여드려요."],
  ["추가 조건과 결과", "비과밀·인허가·가격을 고르면 충족 여부를 카드마다 표시해요."],
] as const;

/** "이렇게 진행돼요" 섹션. 애니메이션 없이 4단계 카드를 정적으로 보여줍니다. */
export function ScrollSteps() {
  return (
    <section className="bg-surface" aria-labelledby="how-heading">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-16 text-center sm:px-6 lg:px-10">
        <h2 id="how-heading" className="text-[26px] font-bold tracking-[-0.02em] text-ink sm:text-[32px]">
          이렇게 진행돼요
        </h2>

        <ol className="mt-10 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="rounded-2xl bg-white p-6">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">{i + 1}</span>
              <p className="mt-4 text-[17px] font-bold text-ink">{t}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
