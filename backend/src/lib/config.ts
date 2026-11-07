import path from "node:path";
import dotenv from "dotenv";

// The repo-root .env.local written by `neon deploy` / `neon env pull` takes precedence over backend/.env.
dotenv.config({ path: [path.resolve(__dirname, "../../../.env.local"), path.resolve(__dirname, "../../.env")], quiet: true });

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
  otpDevCode: process.env.OTP_DEV_CODE || undefined,
  otpTtlMinutes: 5,
  realtimeUrl: process.env.NEON_REALTIME_URL || undefined,
  realtimeSecret: process.env.NEON_REALTIME_SECRET || undefined,
  storageBucket: process.env.STORAGE_BUCKET || "assets",
  storageEnabled: Boolean(process.env.AWS_ENDPOINT_URL_S3 && process.env.AWS_ACCESS_KEY_ID),
};
