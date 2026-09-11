import { Router } from "express";
import { notFound, ok } from "../lib/http";
import { industrySearchQuerySchema } from "../lib/validation";
import { findIndustryById, searchIndustries } from "../services/office-service";

const router = Router();

/** GET /api/industries/search?q=온라인&limit=20 */
router.get("/search", async (req, res, next) => {
  try {
    const { q, limit } = industrySearchQuerySchema.parse(req.query);
    const items = await searchIndustries(q, limit);
    return ok(res, { items });
  } catch (error) {
    next(error);
  }
});

/** GET /api/industries/:id */
router.get("/:id", async (req, res, next) => {
  try {
    const industry = await findIndustryById(req.params.id);
    if (!industry) throw notFound("업종을 찾을 수 없습니다.");
    return ok(res, industry);
  } catch (error) {
    next(error);
  }
});

export default router;
