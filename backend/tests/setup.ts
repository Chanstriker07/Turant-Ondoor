import { execSync } from "node:child_process";

export default function setup() {
  const env = {
    ...process.env,
    DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgresql://turant:turant@localhost:5432/turant_test",
  };
  execSync("npx prisma db push --force-reset --skip-generate", { env, stdio: "ignore" });
  execSync("npx tsx prisma/seed.ts", { env, stdio: "ignore" });
}
