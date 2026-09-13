import { Router } from "express";
import { notFound, ok } from "../lib/http";
import { recommendQuerySchema, regionsQuerySchema } from "../lib/validation";
import {
  ALL_REGIONS,
  countOfficesByRegion,
  findOfficeById,
  getRecommendation,
} from "../services/office-service";

const router = Router();

/**
 * GET /api/offices/recommend
 *   ?industry=retail&businessType=INDIVIDUAL&region=서울&nonCongested=true&permitAddressSupported=false&maxPrice=30000
 */
router.get("/recommend", async (req, res) => {
  const query = recommendQuerySchema.parse(req.query);
  const result = await getRecommendation({
    industryId: query.industry,
    businessType: query.businessType,
    region: query.region === ALL_REGIONS ? null : query.region,
    nonCongested: query.nonCongested,
    permitAddressSupported: query.permitAddressSupported,
    maxPrice: query.maxPrice ?? null,
  });
  if (!result) throw notFound("업종을 찾을 수 없습니다.");
  return ok(res, {
    total: result.total,
    industry: result.industry,
    filters: query,
    items: result.items,
    suggestions: result.suggestions,
  });
});

/** GET /api/offices/regions?industry=retail&businessType=INDIVIDUAL → 지역별 지점 수 */
router.get("/regions", async (req, res) => {
  const query = regionsQuerySchema.parse(req.query);
  const items = await countOfficesByRegion({
    industryId: query.industry,
    businessType: query.businessType,
  });
  if (!items) throw notFound("업종을 찾을 수 없습니다.");
  return ok(res, { items });
});

/** GET /api/offices/:id */
router.get("/:id", async (req, res) => {
  const office = await findOfficeById(req.params.id);
  if (!office) throw notFound("지점을 찾을 수 없습니다.");
  const { businessTypes, industries, ...rest } = office;
  return ok(res, {
    ...rest,
    businessTypes: businessTypes.map((b) => b.businessType),
    industries: industries.map((i) => i.industry),
  });
});

export default router;
