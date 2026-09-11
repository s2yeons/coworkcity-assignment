import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/layout/PageHero";
import { OfficeRecommendation } from "@/components/office-recommendation/OfficeRecommendation";

export const metadata: Metadata = {
  title: "내 사업에 맞는 비상주사무실 찾기 | 코워크시티",
  description: "사업 조건을 입력하면 나에게 적합한 비상주사무실 지점을 찾아볼 수 있어요.",
};

export default function OfficeRecommendPage() {
  return (
    <main className="flex-1 bg-white text-ink">
      <PageHero
        crumbs={[{ label: "홈", href: "/" }, { label: "비상주사무실" }, { label: "내 조건으로 찾기" }]}
        title="내 사업에 맞는 비상주사무실 찾기"
        description="업종 · 사업자 유형 · 지역을 고르면 사업자등록이 가능한 지점과 추천 이유를 보여드려요."
      />
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-2 sm:px-6 lg:px-10">
        <div className="max-w-5xl">
          <Suspense fallback={<p className="text-sm text-ink-3">조건을 불러오는 중이에요.</p>}>
            <OfficeRecommendation />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
