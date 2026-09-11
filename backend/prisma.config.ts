import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * DATABASE_URL이 아직 없어도(예: 최초 npm install 직후의 postinstall `prisma generate`)
 * 실패하지 않도록 docker-compose.yml과 동일한 로컬 기본값으로 폴백합니다.
 * 실제 접속값은 backend/.env 의 DATABASE_URL이 우선합니다.
 */
const LOCAL_DATABASE_URL = "postgresql://coworkcity:coworkcity@localhost:5432/coworkcity";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? LOCAL_DATABASE_URL,
  },
});
