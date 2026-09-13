import { readFile } from "node:fs/promises";
import path from "node:path";
import express, { Router } from "express";
import multer from "multer";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { HttpError, notFound, ok } from "../lib/http";
import { validateImage } from "../lib/image-validation";
import { convertPdfFirstPageToPng, isPdf } from "../lib/pdf-conversion";
import { normalizeRegistrationFields } from "../services/business-registration-parser";
import { analyzeRegistrationFields, analyzeRegistrationImage } from "../services/business-registration-service";

const router = Router();

/**
 * 보안·개인정보 처리 원칙 (사업자등록증에는 대표자 이름·주소·등록번호가 있습니다)
 * 1. 이미지는 메모리에서만 처리하고 디스크·DB·로그에 남기지 않습니다. 처리 후 버퍼를 0으로 덮어씁니다.
 * 2. 파일 형식은 Content-Type이 아니라 매직 바이트로 판별하고, 픽셀 크기 상한을 둡니다.
 * 3. OCR은 CPU를 많이 쓰므로 IP당 요청 수를 제한합니다.
 * 4. 응답은 캐시되지 않도록 no-store 로 보냅니다.
 * 5. OCR 원문(rawText)은 응답에 포함하지 않고, 추천에 필요한 필드만 돌려줍니다.
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 0 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.has(file.mimetype)) cb(null, true);
    else cb(new HttpError(400, "UNSUPPORTED_FILE_TYPE", "PNG, JPEG, WEBP 이미지 또는 PDF 파일만 올릴 수 있어요."));
  },
});

/**
 * OCR 요청 속도 제한: IP당 1분에 기본 300회 (환경변수 OCR_RATE_LIMIT로 조정).
 * 운영에서는 로그인 사용자 단위로 더 낮게(예: 20회/분) 잡는 것을 권장합니다.
 */
const ocrLimiter = rateLimit({
  windowMs: 60_000,
  limit: Number(process.env.OCR_RATE_LIMIT ?? 300),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "요청이 너무 많아요. 잠시 후 다시 시도해주세요." } },
});

const noStore: express.RequestHandler = (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
};

/**
 * 채점/체험용 샘플 등록증. 개인정보가 없는 가상 정보로 생성한 이미지입니다.
 * (backend/test/fixtures/business-registration/generate.py)
 */
const SAMPLES_DIR = path.resolve(__dirname, "../../test/fixtures/business-registration");
export const SAMPLES = [
  { id: "individual-seoul-ecommerce", file: "individual-seoul-ecommerce.png", label: "개인사업자 · 서울 · 전자상거래", description: "일반과세자, 도매 및 소매업 / 전자상거래 소매업" },
  { id: "corporate-gyeonggi-software", file: "corporate-gyeonggi-software.png", label: "법인사업자 · 경기 · 소프트웨어", description: "법인사업자, 정보통신업 / 응용 소프트웨어 개발" },
  { id: "individual-busan-design-photo", file: "individual-busan-design-photo.jpg", label: "개인사업자 · 부산 · 디자인 (촬영본)", description: "간이과세자, 기울어짐·노이즈가 있는 촬영본" },
] as const;

/** GET /api/business-registration/samples */
router.get("/samples", (_req, res) => {
  return ok(res, {
    items: SAMPLES.map((s) => ({ ...s, imageUrl: `/api/business-registration/samples/${s.file}` })),
  });
});

/** GET /api/business-registration/samples/:file → 이미지 파일 (가상 샘플만 제공) */
router.use("/samples", express.static(SAMPLES_DIR, { index: false, dotfiles: "deny", extensions: [] }));

/** POST /api/business-registration/analyze  (multipart/form-data, field: file) */
router.post("/analyze", ocrLimiter, noStore, (req, res, next) => {
  upload.single("file")(req, res, async (error: unknown) => {
    const buffer = req.file?.buffer;
    let imageBuffer: Buffer | undefined;
    try {
      if (error instanceof multer.MulterError) {
        throw new HttpError(
          error.code === "LIMIT_FILE_SIZE" ? 413 : 400,
          error.code,
          error.code === "LIMIT_FILE_SIZE" ? "파일은 10MB 이하로 올려주세요." : error.message,
        );
      }
      if (error) throw error;
      if (!req.file || !buffer) throw new HttpError(400, "VALIDATION_ERROR", "file 필드에 사업자등록증 이미지 또는 PDF를 첨부해 주세요.");

      // PDF는 OCR이 직접 읽을 수 없어 첫 페이지를 이미지로 변환한 뒤, 이미지와 같은 검증·OCR 경로를 탑니다.
      const fromPdf = isPdf(buffer);
      imageBuffer = fromPdf ? await convertPdfFirstPageToPng(buffer) : buffer;

      const validation = validateImage(imageBuffer, fromPdf ? undefined : req.file.mimetype);
      if (!validation.ok) throw new HttpError(400, validation.code, validation.message);

      return ok(res, await analyzeRegistrationImage(imageBuffer));
    } catch (e) {
      next(e);
    } finally {
      // 개인정보가 담긴 이미지 바이트를 즉시 소거 (GC 전까지 메모리에 남지 않도록)
      buffer?.fill(0);
      if (imageBuffer && imageBuffer !== buffer) imageBuffer.fill(0);
    }
  });
});

const sampleBodySchema = z.object({ sample: z.string().min(1) });

/** POST /api/business-registration/analyze-sample  { sample: "individual-seoul-ecommerce" } */
router.post("/analyze-sample", ocrLimiter, noStore, async (req, res) => {
  const { sample } = sampleBodySchema.parse(req.body ?? {});
  const meta = SAMPLES.find((s) => s.id === sample);
  if (!meta) throw notFound("샘플을 찾을 수 없습니다.");
  const image = await readFile(path.join(SAMPLES_DIR, meta.file));
  return ok(res, await analyzeRegistrationImage(image));
});

export default router;

const verifyBodySchema = z.object({
  businessNumber: z.string().trim().max(20).nullable().optional(),
  businessType: z.enum(["INDIVIDUAL", "CORPORATE"]).nullable().optional(),
  companyName: z.string().trim().max(100).nullable().optional(),
  representative: z.string().trim().max(50).nullable().optional(),
  openedAt: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식").nullable().optional(),
  address: z.string().trim().max(200).nullable().optional(),
  businessCategories: z.array(z.string().trim().max(60)).max(10).optional(),
  businessItems: z.array(z.string().trim().max(60)).max(10).optional(),
});

/**
 * POST /api/business-registration/verify
 * OCR이 잘못 읽은 값을 사용자가 고친 뒤, 이미지 없이 텍스트만으로 국세청 확인·업종 매칭을 다시 수행합니다.
 */
router.post("/verify", ocrLimiter, noStore, async (req, res) => {
  const body = verifyBodySchema.parse(req.body ?? {});
  const fields = normalizeRegistrationFields({
    ...body,
    openedAt: body.openedAt ?? null,
  });
  return ok(res, await analyzeRegistrationFields(fields, null));
});
