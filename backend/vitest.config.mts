import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: { DATABASE_URL: "file:./test.db", OTP_DEV_CODE: "123456", JWT_SECRET: "test", NODE_ENV: "test" },
    globalSetup: "./tests/setup.ts",
    fileParallelism: false,
  },
});
