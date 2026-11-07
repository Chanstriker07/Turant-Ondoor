import { Link } from "react-router-dom";
import { useApi } from "../lib/useApi";
import type { BookingStatus, Stats } from "../lib/types";
import { dateTime, rupees } from "../lib/format";
import { Badge, PageHeader, State } from "../components/ui";
import { LiveBookings } from "../components/LiveBookings";
import { realtimeClient } from "../lib/realtime";

const statuses: BookingStatus[] = ["PENDING", "ASSIGNED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function Dashboard() {
  const { data, loading, error } = useApi<Stats>("/admin/stats");
  if (!data) return <State loading={loading} error={error} />;

  const cards = [
    { label: "Revenue (completed)", value: rupees(data.revenue), to: "/bookings?status=COMPLETED" },
    { label: "Total bookings", value: data.bookings, sub: `${data.bookingsToday} today`, to: "/bookings" },
    { label: "Awaiting assignment", value: data.pendingBookings, to: "/bookings?status=PENDING", warn: data.pendingBookings > 0 },
    { label: "Customers", value: data.users, to: "/users" },
    { label: "Providers", value: data.providers, sub: `${data.pendingProviders} to verify`, to: "/providers", warn: data.pendingProviders > 0 },
    { label: "Live listings", value: data.businesses, sub: `${data.pendingBusinesses} to review`, to: "/businesses", warn: data.pendingBusinesses > 0 },
  ];
  const max = Math.max(1, ...statuses.map((s) => data.bookingsByStatus[s] ?? 0));

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of Turant Ondoor operations" />
      <div className="stat-grid">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className={`stat-card ${c.warn ? "warn" : ""}`}>
            <span className="muted">{c.label}</span>
            <strong>{c.value}</strong>
            {c.sub && <small>{c.sub}</small>}
          </Link>
        ))}
      </div>
      <div className="grid-2">
        <section className="card">
          <h2>Bookings by status</h2>
          {statuses.map((s) => (
            <div key={s} className="bar-row">
              <Badge value={s} />
              <div className="bar">
                <div style={{ width: `${((data.bookingsByStatus[s] ?? 0) / max) * 100}%` }} />
              </div>
              <strong>{data.bookingsByStatus[s] ?? 0}</strong>
            </div>
          ))}
        </section>
        {realtimeClient ? (
          <LiveBookings />
        ) : (
          <section className="card">
            <h2>Recent bookings</h2>
            <State empty={data.recentBookings.length === 0} />
            <ul className="list">
              {data.recentBookings.map((b) => (
                <li key={b.id}>
                  <div>
                    <strong>{b.service.name}</strong>
                    <small className="muted">
                      {b.customer.name ?? b.customer.phone} · {dateTime(b.scheduledAt)}
                    </small>
                  </div>
                  <Badge value={b.status} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
