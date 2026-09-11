import { z } from "zod";

/** "true" | "1" → true, "false" | "0" | 미지정 → false */
const booleanParam = z
  .enum(["true", "false", "1", "0"])
  .transform((v) => v === "true" || v === "1")
  .default(false);

/** GET /api/offices/recommend 쿼리 */
export const recommendQuerySchema = z.object({
  industry: z.string().trim().min(1, "업종은 필수입니다."),
  businessType: z.enum(["INDIVIDUAL", "CORPORATE"]),
  /** 지역 라벨(예: 서울). "전체"면 모든 지역 */
  region: z.string().trim().min(1, "지역은 필수입니다."),
  nonCongested: booleanParam,
  permitAddressSupported: booleanParam,
  /** 월환산 가격 상한 (원) */
  maxPrice: z.coerce.number().int().positive().optional(),
});

/** GET /api/offices/regions 쿼리 */
export const regionsQuerySchema = recommendQuerySchema.pick({ industry: true, businessType: true });

/** GET /api/industries/search 쿼리 */
export const industrySearchQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
