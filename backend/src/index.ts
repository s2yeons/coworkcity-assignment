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
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:3000";

// 미들웨어
// helmet: 기본 보안 헤더. 이 API는 프론트(다른 origin)에서 이미지·JSON을 가져가므로 CORP만 cross-origin으로 둡니다.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: "16kb" }));

// 라우트
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
