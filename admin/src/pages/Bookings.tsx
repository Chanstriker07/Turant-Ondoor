import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import type { Booking, BookingStatus, Provider } from "../lib/types";
import { dateTime, label, rupees } from "../lib/format";
import { Badge, Field, Modal, PageHeader, State, Stars } from "../components/ui";

const statuses: BookingStatus[] = ["PENDING", "ASSIGNED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function Bookings() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const [q, setQ] = useState("");
  const query = new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}) }).toString();
  const { data, loading, error, reload } = useApi<Booking[]>(`/admin/bookings?${query}`);
  const [selected, setSelected] = useState<Booking | null>(null);

  return (
    <>
      <PageHeader title="Bookings" subtitle="Assign providers and track service jobs" />
      <div className="toolbar">
        <div className="tabs">
          <button className={!status ? "active" : ""} onClick={() => setParams({})}>
            All
          </button>
          {statuses.map((s) => (
            <button key={s} className={status === s ? "active" : ""} onClick={() => setParams({ status: s })}>
              {label(s)}
            </button>
          ))}
        </div>
        <input className="search" placeholder="Search phone, name, service…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card table-card">
        <State loading={loading && !data} error={error} empty={data?.length === 0} />
        {data && data.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Customer</th>
                <th>Scheduled</th>
                <th>Provider</th>
                <th>Amount</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((b) => (
                <tr key={b.id}>
                  <td>
                    <strong>{b.service.name}</strong>
                    <small className="muted block">
                      {b.service.category.icon} {b.service.category.name}
                    </small>
                  </td>
                  <td>
                    {b.customer.name ?? "—"}
                    <small className="muted block">{b.customer.phone}</small>
                  </td>
                  <td>{dateTime(b.scheduledAt)}</td>
                  <td>{b.provider ? b.provider.name ?? b.provider.phone : <span className="muted">Unassigned</span>}</td>
                  <td>{rupees(b.price)}</td>
                  <td>
                    <Badge value={b.status} />
                  </td>
                  <td>
                    <button className="btn btn-sm" onClick={() => setSelected(b)}>
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && (
        <BookingModal
          booking={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            void reload();
          }}
        />
      )}
    </>
  );
}

function BookingModal({ booking, onClose, onSaved }: { booking: Booking; onClose: () => void; onSaved: () => void }) {
  const { data: providers } = useApi<Provider[]>(
    `/admin/providers?verified=true&categoryId=${booking.service.categoryId}`,
  );
  const [providerId, setProviderId] = useState(booking.provider?.id ?? "");
  const [status, setStatus] = useState<BookingStatus>(booking.status);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      if (providerId !== (booking.provider?.id ?? "")) body.providerId = providerId || null;
      if (status !== booking.status) body.status = status;
      if (Object.keys(body).length) await api(`/admin/bookings/${booking.id}`, { method: "PATCH", body });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const a = booking.address;
  return (
    <Modal title={booking.service.name} onClose={onClose}>
      <dl className="details">
        <dt>Booking ID</dt>
        <dd className="mono">{booking.id}</dd>
        <dt>Customer</dt>
        <dd>
          {booking.customer.name ?? "—"} · +91 {booking.customer.phone}
        </dd>
        <dt>Address</dt>
        <dd>
          {a.label}: {a.line1}
          {a.line2 ? `, ${a.line2}` : ""}
          {a.landmark ? ` (near ${a.landmark})` : ""}, {a.city} - {a.pincode}
        </dd>
        <dt>Scheduled</dt>
        <dd>{dateTime(booking.scheduledAt)}</dd>
        <dt>Amount</dt>
        <dd>
          {rupees(booking.price)} · {booking.paymentMethod} · {label(booking.paymentStatus)}
        </dd>
        {booking.notes && (
          <>
            <dt>Notes</dt>
            <dd>{booking.notes}</dd>
          </>
        )}
        {booking.cancelReason && (
          <>
            <dt>Cancel reason</dt>
            <dd>{booking.cancelReason}</dd>
          </>
        )}
        {booking.review && (
          <>
            <dt>Review</dt>
            <dd>
              <Stars value={booking.review.rating} /> {booking.review.comment}
            </dd>
          </>
        )}
      </dl>
      <Field label="Assigned provider">
        <select value={providerId} onChange={(e) => setProviderId(e.target.value)}>
          <option value="">— Unassigned —</option>
          {providers?.map((p) => (
            <option key={p.user.id} value={p.user.id} disabled={!p.isAvailable}>
              {p.user.name ?? p.user.phone} · {p.city} · ★ {p.rating.toFixed(1)}
              {p.isAvailable ? "" : " (unavailable)"}
            </option>
          ))}
        </select>
        {providers?.length === 0 && <small className="muted">No verified providers for this category yet.</small>}
      </Field>
      <Field label="Status">
        <select value={status} onChange={(e) => setStatus(e.target.value as BookingStatus)}>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
      </Field>
      {error && <div className="alert">{error}</div>}
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </Modal>
  );
}
