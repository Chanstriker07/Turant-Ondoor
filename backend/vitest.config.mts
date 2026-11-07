import { defineConfig } from "vitest/config";

const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? "postgresql://turant:turant@localhost:5432/turant_test";

export default defineConfig({
  test: {
    env: { DATABASE_URL: testDatabaseUrl, OTP_DEV_CODE: "123456", JWT_SECRET: "test", NODE_ENV: "test" },
    globalSetup: "./tests/setup.ts",
    fileParallelism: false,
  },
});
