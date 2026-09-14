import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler, notFoundHandler } from "./lib/http";
import businessRegistrationRouter from "./routes/business-registration";
import healthRouter from "./routes/health";
import industriesRouter from "./routes/industries";
import officesRouter from "./routes/offices";
import statsRouter from "./routes/stats";
import { warmupOcr } from "./services/ocr";

const app = express();
const PORT = process.env.PORT ?? 4000;
// 콤마로 여러 origin을 지정할 수 있습니다 (예: 배포 도메인 + Vercel 프리뷰 URL).
const CLIENT_URLS = (process.env.CLIENT_URL ?? "http://localhost:3000")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

// helmet: 기본 보안 헤더. 이 API는 프론트(다른 origin)에서 이미지·JSON을 가져가므로 CORP만 cross-origin으로 둡니다.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: CLIENT_URLS }));
app.use(express.json({ limit: "16kb" }));

app.use("/api/health", healthRouter);
app.use("/api/industries", industriesRouter);
app.use("/api/offices", officesRouter);
app.use("/api/business-registration", businessRegistrationRouter);
app.use("/api/stats", statsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  warmupOcr();
});
