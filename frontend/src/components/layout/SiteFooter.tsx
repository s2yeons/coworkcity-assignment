import Link from "next/link";

const COLUMNS: Array<{ title: string; items: Array<{ label: string; href?: string }> }> = [
  {
    title: "사이트맵",
    items: [
      { label: "전국 지점", href: "/offices/recommend" },
      { label: "내 조건으로 지점 찾기", href: "/offices/recommend" },
      { label: "사업자등록증으로 찾기", href: "/offices/recommend/registration" },
    ],
  },
  { title: "회사", items: [{ label: "회사 소개" }, { label: "서비스 이용 가이드" }, { label: "채용" }] },
  { title: "약관", items: [{ label: "서비스 이용약관" }, { label: "개인정보 처리방침" }, { label: "운영정책" }] },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid gap-8 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="wordmark text-lg text-ink">Coworkcity</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-3">
              사업자등록 주소가 필요한 모든 사업자에게, 조건에 맞는 비상주사무실을 찾아드려요.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-ink">{col.title}</p>
              <ul className="mt-2 flex flex-col text-sm text-ink-2">
                {col.items.map((item) => (
                  <li key={item.label}>
                    {item.href ? (
                      <Link href={item.href} className="inline-flex min-h-9 items-center hover:text-brand-700">
                        {item.label}
                      </Link>
                    ) : (
                      <span className="inline-flex min-h-9 items-center text-ink-3">{item.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 border-t border-line pt-6 text-xs text-ink-3">
          코워크시티 채용 과제 구현물이에요. 지점 데이터는 서비스 구조 검증용 가상 데이터이고, 업종 정보는 코워크시티 공개 페이지를 참고했어요.
        </p>
      </div>
    </footer>
  );
}
