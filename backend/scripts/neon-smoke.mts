// End-to-end check of every Neon service against a running API. Usage: API_URL=http://localhost:4000/api tsx scripts/neon-smoke.mts
import path from "node:path";
import dotenv from "dotenv";
import { createRealtimeClient } from "@neon/realtime/client";
import WebSocket from "ws";

dotenv.config({ path: path.resolve(import.meta.dirname, "../../.env.local"), quiet: true });
const API = process.env.API_URL ?? "http://localhost:4000/api";
// Realtime only accepts browser origins listed in neon.ts, so connect as the admin panel would.
const ORIGIN = process.env.REALTIME_ORIGIN ?? "http://localhost:4173";
const env = (k: string) => process.env[k] ?? "";
const results: [string, boolean, string][] = [];
const check = async (name: string, fn: () => Promise<string>) => {
  try {
    results.push([name, true, await fn()]);
  } catch (e) {
    results.push([name, false, (e as Error).message]);
  }
};
async function call<T>(p: string, opts: { method?: string; body?: unknown; token?: string } = {}): Promise<T> {
  const res = await fetch(API + p, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers: { "Content-Type": "application/json", ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${p} → ${res.status} ${JSON.stringify(data)}`);
  return data as T;
}
const login = async (phone: string) => {
  await call("/auth/otp/request", { body: { phone } });
  return (await call<{ token: string }>("/auth/otp/verify", { body: { phone, code: "123456" } })).token;
};

let admin = "";
let customer = "";
await check("Postgres (Prisma via pooled DATABASE_URL)", async () => {
  if (!env("DATABASE_URL").includes("-pooler")) throw new Error("DATABASE_URL is not the pooled Neon URL");
  admin = await login("9999999999");
  customer = await login("7777777777");
  const stats = await call<{ users: number; bookings: number }>("/admin/stats", { token: admin });
  return `OTP login ok; admin stats from Neon: ${stats.users} customers, ${stats.bookings} bookings`;
});

await check("Realtime (live bookings query)", async () => {
  const sealed = await call<any>("/admin/bookings/live", { method: "POST", token: admin });
  const client = createRealtimeClient({
    url: env("NEON_REALTIME_URL"),
    webSocketFactory: (url, protocols) => new WebSocket(url, protocols, { origin: ORIGIN }) as never,
  });
  const sub = client.subscribe<any>(sealed);
  const waitFor = (pred: (rows: any[]) => boolean, ms: number) =>
    new Promise<any[]>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`timeout; last status ${sub.getState().status} ${sub.getState().error?.message ?? ""}`)), ms);
      const test = () => {
        const s = sub.getSnapshot();
        if (s.status === "error") return reject(s.error);
        if (s.data && pred(s.data as any[])) (clearTimeout(t), resolve(s.data as any[]));
      };
      sub.onChange(test);
      test();
    });
  const initial = await waitFor(() => true, 20000);
  const [service] = await call<any[]>("/services");
  const [address] = await call<any[]>("/addresses", { token: customer });
  const booking = await call<any>("/bookings", {
    token: customer,
    body: { serviceId: service.id, addressId: address.id, scheduledAt: new Date(Date.now() + 86400000).toISOString(), notes: "neon realtime smoke" },
  });
  const t0 = Date.now();
  await waitFor((rows) => rows.some((r) => r.id === booking.id), 20000);
  const pushed = Date.now() - t0;
  await call(`/bookings/${booking.id}/cancel`, { token: customer, body: { reason: "smoke test" } });
  await waitFor((rows) => rows.some((r) => r.id === booking.id && r.status === "CANCELLED"), 20000);
  sub.unsubscribe();
  client.close();
  return `initial ${initial.length} rows; new booking ${booking.id} pushed in ${pushed} ms; cancel pushed as CANCELLED`;
});

await check("Object Storage (presigned upload/download)", async () => {
  const body = `turant smoke ${Date.now()}`;
  const up = await call<{ key: string; uploadUrl: string; url: string }>("/admin/uploads", {
    token: admin,
    body: { filename: "smoke.txt", contentType: "text/plain" },
  });
  const put = await fetch(up.uploadUrl, { method: "PUT", body, headers: { "Content-Type": "text/plain" } });
  if (!put.ok) throw new Error(`PUT ${put.status} ${await put.text()}`);
  const { url } = await call<{ url: string }>(`/admin/uploads/url?key=${encodeURIComponent(up.key)}`, { token: admin });
  const got = await (await fetch(url)).text();
  if (got !== body) throw new Error(`downloaded content mismatch: ${got.slice(0, 80)}`);
  return `uploaded and read back ${up.key} (${body.length} bytes) in bucket "assets"`;
});

await check("Functions (hello)", async () => {
  const url = `https://${env("NEON_BRANCH_ID")}-hello.${env("NEON_FUNCTION_HOST_SUFFIX").replace(/^\./, "")}/`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 120)}`);
  return `GET ${url} → ${res.status} "${text}"`;
});

await check("Neon Auth (JWKS reachable)", async () => {
  const res = await fetch(env("NEON_AUTH_JWKS_URL"));
  const jwks = (await res.json()) as { keys?: unknown[] };
  if (!res.ok || !jwks.keys) throw new Error(`${res.status}`);
  return `JWKS → ${res.status}, ${jwks.keys.length} key(s)`;
});

await check("AI Gateway (chat completion)", async () => {
  const res = await fetch(`${env("NEON_AI_GATEWAY_BASE_URL")}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env("NEON_AI_GATEWAY_TOKEN")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: "Say ok" }], max_tokens: 5 }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 200)}`);
  return `200 ${text.slice(0, 120)}`;
});

for (const [name, ok, detail] of results) console.log(`${ok ? "PASS" : "FAIL"}  ${name}: ${detail}`);
process.exit(results.every(([, ok]) => ok) ? 0 : 1);
