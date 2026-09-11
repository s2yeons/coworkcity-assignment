"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** 이 과제에서 구현한 메뉴만 둡니다. (코워크시티 헤더의 시각 스타일만 차용) */
const NAV = [
  { label: "비상주사무실", href: "/offices/recommend", match: /^\/offices/ },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center px-4 sm:px-6 lg:px-10">
        <Link href="/" className="wordmark text-[22px] text-ink" aria-label="코워크시티 홈">
          Coworkcity
        </Link>

        <nav aria-label="주요 메뉴" className="ml-4 hidden items-center md:flex">
          {NAV.map((item) => {
            const current = Boolean(pathname && item.match.test(pathname));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "relative flex h-16 items-center px-3.5 text-[15px] font-medium text-ink transition-colors hover:text-brand-700",
                  current && "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/offices/recommend/registration"
            className="hidden h-10 items-center rounded-md border border-line-2 bg-white px-4 text-sm font-medium text-ink transition-colors hover:bg-surface md:inline-flex"
          >
            사업자등록증으로 찾기
          </Link>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-md text-ink hover:bg-surface md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true" className="text-xl leading-none">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="모바일 메뉴" className=" border-t border-line bg-white md:hidden">
          <ul className="mx-auto flex max-w-[1280px] flex-col px-4 py-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center text-[15px] font-medium text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-2 pb-2">
              <Link
                href="/offices/recommend/registration"
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center justify-center rounded-lg border border-line-2 text-sm font-medium text-ink"
              >
                사업자등록증으로 찾기
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
