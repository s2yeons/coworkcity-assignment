import Link from "next/link";

const LINKS = [
  { label: "조건으로 지점 찾기", href: "/offices/recommend" },
  { label: "사업자등록증으로 찾기", href: "/offices/recommend/registration" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <div>
          <p className="wordmark text-lg text-ink">Coworkcity</p>
          <p className="mt-1 text-sm text-ink-3">사업자등록 주소가 필요한 모든 사업자에게, 조건에 맞는 비상주사무실을 찾아드려요.</p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-2">
          {LINKS.map((link) => (
            <li key={link.label}>
              <Link href={link.href} className="inline-flex min-h-9 items-center hover:text-brand-700">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <p className="border-t border-line px-4 py-4 text-xs text-ink-3 sm:px-6 lg:px-10">
        코워크시티 채용 과제 구현물이에요. 지점 데이터는 서비스 구조 검증용 가상 데이터이고, 업종 정보는 코워크시티 공개 페이지를 참고했어요.
      </p>
    </footer>
  );
}
