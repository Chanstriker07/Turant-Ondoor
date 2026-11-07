import { createRealtime, rawSql } from "@neon/realtime/server";
import { config } from "./config";
import { HttpError } from "./errors";

export interface LiveBooking {
  id: string;
  status: string;
  price: number;
  scheduledAt: string;
  createdAt: string;
  serviceName: string;
  customerName: string | null;
  customerPhone: string;
}

const databaseName = () => new URL(process.env.DATABASE_URL ?? "postgresql://localhost/neondb").pathname.slice(1);

let realtime: ReturnType<typeof createRealtime> | undefined;
function server() {
  if (!config.realtimeSecret) throw new HttpError(503, "Realtime is not configured");
  realtime ??= createRealtime({ secret: config.realtimeSecret, db: databaseName() });
  return realtime;
}

export const recentBookingsQuery = () =>
  rawSql<LiveBooking>(
    `SELECT b.id, b.status, b.price, b."scheduledAt", b."createdAt", s.name AS "serviceName", u.name AS "customerName", u.phone AS "customerPhone" FROM "Booking" b JOIN "Service" s ON s.id = b."serviceId" JOIN "User" u ON u.id = b."customerId" ORDER BY b."createdAt" DESC LIMIT 10`,
    [],
  );

export const sealRecentBookings = () => server().seal({ query: recentBookingsQuery() });
