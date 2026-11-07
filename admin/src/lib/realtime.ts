import { createRealtimeClient } from "@neon/realtime/client";

const url = import.meta.env.VITE_NEON_REALTIME_URL as string | undefined;

export const realtimeClient = url ? createRealtimeClient({ url }) : null;
