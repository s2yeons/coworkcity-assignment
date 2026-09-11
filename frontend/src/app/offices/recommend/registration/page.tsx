import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { RegistrationUpload } from "@/components/business-registration/RegistrationUpload";

export const metadata: Metadata = {
  title: "사업자등록증으로 비상주사무실 찾기 | 코워크시티",
  description: "사업자등록증을 올리면 사업자 유형·지역·업종을 읽어 이전 가능한 비상주사무실 지점을 바로 추천해요.",
};

export default function RegistrationRecommendPage() {
  return (
    <main className="flex-1 bg-white text-ink">
      <PageHero
        crumbs={[
          { label: "홈", href: "/" },
          { label: "비상주사무실", href: "/offices/recommend" },
          { label: "사업자등록증으로 찾기" },
        ]}
        title="사업자등록증으로 비상주사무실 찾기"
        description="등록증 한 장으로 조건을 채우고, 주소 이전이 가능한 지점을 바로 확인해요."
      />
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-2 sm:px-6 lg:px-10">
        <div className="max-w-5xl">
          <RegistrationUpload />
        </div>
      </div>
    </main>
  );
}
