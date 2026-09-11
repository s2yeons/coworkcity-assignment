/**
 * 지점/업종 데이터 접근 계층. 필수 조건은 최대한 DB where 절에서 거릅니다.
 */
import { prisma } from "../lib/prisma";
import type { Prisma } from "../generated/prisma/client";
import type { IndustryRegistrationStatus } from "../generated/prisma/client";
import {
  buildRequiredWhere,
  getRelaxationCandidates,
  rankOffices,
  type OfficeRecord,
  type RecommendationFilters,
} from "./recommendation";

export const ALL_REGIONS = "전체";

const officeSelect = {
  id: true,
  name: true,
  region: true,
  district: true,
  address: true,
  price: true,
  priceUnit: true,
  isNonCongested: true,
  permitAddressSupported: true,
  siteInspectionSupported: true,
  buildingUse: true,
  lat: true,
  lng: true,
  businessTypes: { select: { businessType: true } },
} satisfies Prisma.OfficeSelect;

type OfficeRow = Prisma.OfficeGetPayload<{ select: typeof officeSelect }>;

function toRecord(row: OfficeRow): OfficeRecord {
  const { businessTypes, ...rest } = row;
  return { ...rest, businessTypes: businessTypes.map((b) => b.businessType) };
}

export function findIndustryById(id: string) {
  return prisma.industry.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      category: true,
      description: true,
      registrationStatus: true,
      note: true,
    },
  });
}

/**
 * 업종 검색: 업종명·대분류·설명·키워드(배열 요소 부분 일치)를 공백 무시하고 비교합니다.
 * 키워드 배열의 부분 일치는 Prisma 필터로 표현할 수 없어 raw SQL을 사용합니다.
 */
/** 검색어가 없을 때의 기본 노출 순서: 비상주 등록 사례가 많은 대표 업종부터 */
const INDUSTRY_PRIORITY = [
  "retail", "software", "freelancer", "professional", "other-professional", "video-production",
  "business-support", "wholesale", "publishing", "info-service", "rental", "arts", "finance-service",
  "real-estate", "logistics-service", "association", "rnd", "auto-parts",
];

export async function searchIndustries(query: string, limit: number) {
  const normalized = query.replace(/\s+/g, "");
  if (!normalized) {
    const all = await prisma.industry.findMany({
      select: { id: true, name: true, category: true, description: true, registrationStatus: true },
    });
    const rank = (id: string) => {
      const i = INDUSTRY_PRIORITY.indexOf(id);
      return i === -1 ? INDUSTRY_PRIORITY.length : i;
    };
    const statusRank: Record<string, number> = { AVAILABLE: 0, OEM_REQUIRED: 1, PERMIT_REQUIRED: 2, UNAVAILABLE: 3 };
    return all
      .sort(
        (a, b) =>
          statusRank[a.registrationStatus] - statusRank[b.registrationStatus] ||
          rank(a.id) - rank(b.id) ||
          a.name.localeCompare(b.name, "ko"),
      )
      .slice(0, limit);
  }

  const pattern = `%${normalized.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  return prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      category: string;
      description: string | null;
      registrationStatus: IndustryRegistrationStatus;
    }>
  >`
    SELECT "id", "name", "category", "description", "registrationStatus"
    FROM "Industry"
    WHERE replace("name", ' ', '') ILIKE ${pattern}
       OR replace("category", ' ', '') ILIKE ${pattern}
       OR replace(coalesce("description", ''), ' ', '') ILIKE ${pattern}
       OR EXISTS (
         SELECT 1 FROM unnest("keywords") AS k WHERE replace(k, ' ', '') ILIKE ${pattern}
       )
    ORDER BY (replace("name", ' ', '') ILIKE ${pattern}) DESC, "registrationStatus" ASC, "name" ASC
    LIMIT ${limit}
  `;
}

export async function getRecommendation(filters: RecommendationFilters) {
  const industry = await findIndustryById(filters.industryId);
  if (!industry) return null;

  const where = buildRequiredWhere(filters, industry.registrationStatus);
  const rows = await prisma.office.findMany({ where, select: officeSelect });
  const items = rankOffices(rows.map(toRecord), filters);

  // 결과가 없으면 필수 조건을 하나 완화했을 때의 개수를 계산해 제안합니다.
  const suggestions =
    items.length > 0
      ? []
      : (
          await Promise.all(
            getRelaxationCandidates(filters).map(async (candidate) => ({
              label: candidate.label,
              region: candidate.filters.region,
              businessType: candidate.filters.businessType,
              count: await prisma.office.count({
                where: buildRequiredWhere(candidate.filters, industry.registrationStatus),
              }),
            })),
          )
        )
          .filter((s) => s.count > 0)
          .sort((a, b) => b.count - a.count);

  return { industry, total: items.length, items, suggestions };
}

/** 지역 단계에서 미리 보여줄 지역별 지점 수 (업종·사업자 유형 조건 적용) */
export async function countOfficesByRegion(
  filters: Pick<RecommendationFilters, "industryId" | "businessType">,
) {
  const industry = await findIndustryById(filters.industryId);
  if (!industry) return null;

  const groups = await prisma.office.groupBy({
    by: ["region"],
    where: buildRequiredWhere({ ...filters, region: null }, industry.registrationStatus),
    _count: { _all: true },
  });
  return groups.map((g) => ({ region: g.region, count: g._count._all }));
}

export function findOfficeById(id: string) {
  return prisma.office.findUnique({
    where: { id },
    select: {
      ...officeSelect,
      description: true,
      industries: {
        select: { industry: { select: { id: true, name: true, registrationStatus: true } } },
        orderBy: { industry: { name: "asc" } },
      },
    },
  });
}
