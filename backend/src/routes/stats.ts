import { Router } from "express";
import { prisma } from "../lib/prisma";
import { ok } from "../lib/http";

const router = Router();

/** GET /api/stats — 랜딩에 표시하는 실제 DB 기준 수치 */
router.get("/", async (_req, res) => {
  const [industries, offices, regions] = await Promise.all([
    prisma.industry.count({ where: { registrationStatus: { not: "UNAVAILABLE" } } }),
    prisma.office.count(),
    prisma.office.groupBy({ by: ["region"] }),
  ]);
  return ok(res, { industries, offices, regions: regions.length });
});

export default router;
