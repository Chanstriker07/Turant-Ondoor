import { execSync } from "node:child_process";

export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://turant:turant@localhost:5432/turant_test";
  const env = { ...process.env, DATABASE_URL: url, DATABASE_URL_UNPOOLED: url };
  execSync("npx prisma db push --force-reset --skip-generate", { env, stdio: "ignore" });
  execSync("npx tsx prisma/seed.ts", { env, stdio: "ignore" });
}
