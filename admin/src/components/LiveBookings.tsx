import { useCallback, useEffect, useState } from "react";
import type { SealedLiveQuery } from "@neon/realtime/client";
import { RealtimeProvider, useLiveQuery } from "@neon/realtime-react";
import { api } from "../lib/api";
import { dateTime } from "../lib/format";
import { realtimeClient } from "../lib/realtime";
import { Badge, State } from "./ui";

interface LiveBooking {
  id: string;
  status: string;
  price: number;
  scheduledAt: string | Date;
  createdAt: string | Date;
  serviceName: string;
  customerName: string | null;
  customerPhone: string;
}

const fetchSealed = () => api<SealedLiveQuery<LiveBooking>>("/admin/bookings/live", { method: "POST" });

function LiveList({ sealedQuery }: { sealedQuery: SealedLiveQuery<LiveBooking> }) {
  const refreshQuery = useCallback(() => fetchSealed(), []);
  const { data, status, error } = useLiveQuery(sealedQuery, { refreshQuery });
  if (status === "error") return <State error={`Live updates stopped: ${error.message}`} />;
  if (data === undefined) return <State loading />;
  return (
    <>
      <State empty={data.length === 0} />
      <ul className="list" data-live-status={status}>
        {data.map((b) => (
          <li key={b.id}>
            <div>
              <strong>{b.serviceName}</strong>
              <small className="muted">
                {b.customerName ?? b.customerPhone} · {dateTime(new Date(b.scheduledAt).toISOString())}
              </small>
            </div>
            <Badge value={b.status} />
          </li>
        ))}
      </ul>
    </>
  );
}

export function LiveBookings() {
  const [sealed, setSealed] = useState<SealedLiveQuery<LiveBooking>>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    fetchSealed().then(setSealed, (e: Error) => setError(e.message));
  }, []);
  if (!realtimeClient) return null;
  return (
    <section className="card">
      <h2>
        Recent bookings <small className="muted">· live</small>
      </h2>
      {sealed ? (
        <RealtimeProvider client={realtimeClient}>
          <LiveList sealedQuery={sealed} />
        </RealtimeProvider>
      ) : (
        <State loading={!error} error={error} />
      )}
    </section>
  );
}
