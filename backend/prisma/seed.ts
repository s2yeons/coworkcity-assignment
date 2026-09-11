/**
 * 과제용 seed 데이터.
 *
 * 업종 명칭·대분류·등록 상태·참고사항은 코워크시티 업종 안내 페이지에서 확인된 내용을 반영했지만,
 * 지점명("… Mock 지점"), 주소, 각 지점의 조건 값은 서비스 구조 검증을 위해 임의로 구성한 가상의 데이터입니다.
 * 실제 코워크시티 지점 데이터가 아닙니다.
 *
 * 실행: npm run db:seed (prisma db seed) — 여러 번 실행해도 같은 결과가 되도록 upsert 합니다.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { BusinessType, IndustryRegistrationStatus } from "../src/generated/prisma/client";
import { INDUSTRIES } from "./data/industries";
import { OFFICES } from "./data/offices";
import type { RegionId } from "./data/types";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const REGION_LABEL: Record<Exclude<RegionId, "all">, string> = {
  seoul: "서울",
  gyeonggi: "경기",
  incheon: "인천",
  busan: "부산",
  daegu: "대구",
  gwangju: "광주",
  daejeon: "대전",
  ulsan: "울산",
  sejong: "세종",
  jeju: "제주",
};

const STATUS: Record<string, IndustryRegistrationStatus> = {
  available: "AVAILABLE",
  oem_required: "OEM_REQUIRED",
  permit_required: "PERMIT_REQUIRED",
  unavailable: "UNAVAILABLE",
};

const BUSINESS_TYPE: Record<string, BusinessType> = {
  individual: "INDIVIDUAL",
  corporate: "CORPORATE",
};

async function main() {
  console.log(`업종 ${INDUSTRIES.length}개 upsert...`);
  for (const industry of INDUSTRIES) {
    const data = {
      name: industry.name,
      category: industry.category,
      keywords: industry.keywords,
      description: industry.description ?? null,
      registrationStatus: STATUS[industry.registrationStatus],
      note: industry.note ?? null,
    };
    await prisma.industry.upsert({
      where: { id: industry.id },
      create: { id: industry.id, ...data },
      update: data,
    });
  }

  console.log(`지점 ${OFFICES.length}개 upsert...`);
  for (const office of OFFICES) {
    const data = {
      name: office.name.replace(/ 오피스$/, " Mock 지점"),
      region: REGION_LABEL[office.region],
      district: office.district,
      address: office.address ?? null,
      price: office.price,
      priceUnit: office.priceUnit === "year" ? ("YEAR" as const) : ("MONTH" as const),
      isNonCongested: office.isNonCongested,
      permitAddressSupported: office.permitAddressSupported,
      siteInspectionSupported: office.siteInspectionSupported,
      buildingUse: office.buildingUse ?? null,
      description: office.description ?? null,
      lat: office.lat ?? null,
      lng: office.lng ?? null,
    };

    // 이 지점에서 등록 가능한 업종 = 신청 불가 업종 제외, 지점의 계약 불가 업종 제외,
    // 인허가 요건 업종은 인허가 업종 주소지를 지원하는 지점에만 연결
    const registrableIndustryIds = INDUSTRIES.filter(
      (industry) =>
        industry.registrationStatus !== "unavailable" &&
        !office.unavailableIndustryIds.includes(industry.id) &&
        (industry.registrationStatus !== "permit_required" || office.permitAddressSupported),
    ).map((industry) => industry.id);

    await prisma.$transaction([
      prisma.office.upsert({
        where: { id: office.id },
        create: { id: office.id, ...data },
        update: data,
      }),
      prisma.officeBusinessType.deleteMany({ where: { officeId: office.id } }),
      prisma.officeBusinessType.createMany({
        data: office.businessTypes.map((type) => ({
          officeId: office.id,
          businessType: BUSINESS_TYPE[type],
        })),
      }),
      prisma.officeIndustry.deleteMany({ where: { officeId: office.id } }),
      prisma.officeIndustry.createMany({
        data: registrableIndustryIds.map((industryId) => ({ officeId: office.id, industryId })),
      }),
    ]);
  }

  const [industries, offices, links] = await Promise.all([
    prisma.industry.count(),
    prisma.office.count(),
    prisma.officeIndustry.count(),
  ]);
  console.log(`완료: Industry ${industries}, Office ${offices}, OfficeIndustry ${links}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
