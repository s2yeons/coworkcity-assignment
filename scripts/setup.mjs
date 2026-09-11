/**
 * 채점/개발 환경 초기 설정 (한 번만 실행): npm run setup
 * 1) .env 예제 복사  2) PostgreSQL 컨테이너 실행  3) 마이그레이션 적용  4) seed 입력
 * 이후에는 `npm run dev`만 실행하면 됩니다.
 */
import { copyFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const run = (cmd, opts = {}) => execSync(cmd, { stdio: "inherit", ...opts });
const step = (msg) => console.log(`\n▶ ${msg}`);

step("환경변수 파일 준비");
for (const [example, target] of [
  ["backend/.env.example", "backend/.env"],
  ["frontend/.env.local.example", "frontend/.env.local"],
]) {
  if (existsSync(target)) console.log(`  ${target} 이미 있음 (유지)`);
  else {
    copyFileSync(example, target);
    console.log(`  ${target} 생성`);
  }
}

step("PostgreSQL 컨테이너 실행 (docker compose up -d)");
const containerRunning = () => {
  try {
    return execSync("docker inspect -f {{.State.Running}} coworkcity-db", { stdio: "pipe" }).toString().trim() === "true";
  } catch {
    return false;
  }
};
try {
  if (containerRunning()) console.log("  coworkcity-db 컨테이너가 이미 실행 중 (재사용)");
  else run("docker compose up -d");
} catch {
  console.error(
    "\n✖ Docker를 실행할 수 없습니다. Docker Desktop이 켜져 있는지 확인해주세요.\n" +
      "  Docker 없이 진행하려면 backend/.env의 DATABASE_URL을 사용 가능한 PostgreSQL로 바꾼 뒤\n" +
      "  `npm run db:deploy -w backend && npm run db:seed -w backend` 를 실행하세요.",
  );
  process.exit(1);
}

step("DB 준비 대기");
let ready = false;
for (let i = 0; i < 30 && !ready; i++) {
  try {
    execSync("docker exec coworkcity-db pg_isready -U coworkcity -d coworkcity", { stdio: "ignore" });
    ready = true;
  } catch {
    await sleep(1000);
  }
}
if (!ready) {
  console.error("✖ DB가 준비되지 않았습니다. `docker compose logs db` 로 확인해주세요.");
  process.exit(1);
}
console.log("  준비 완료");

step("마이그레이션 적용 (prisma migrate deploy)");
run("npm run db:deploy -w backend");

step("seed 데이터 입력 (업종 30개, 지점 15개)");
run("npm run db:seed -w backend");

console.log("\n✔ 설정 완료. 이제 `npm run dev` 로 프론트(3000)와 백엔드(4000)를 실행하세요.");
