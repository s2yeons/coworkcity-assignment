import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다. backend/.env.example을 참고하세요.");
}

/** 앱 전체에서 공유하는 Prisma 클라이언트 (Prisma 7 + pg driver adapter) */
export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
