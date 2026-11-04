import { useState } from "react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { date } from "../lib/format";
import { PageHeader, State, Stars } from "../components/ui";

interface ServiceReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  booking: {
    id: string;
    service: { name: string };
    customer: { name: string | null; phone: string };
    provider: { name: string | null } | null;
  };
}
interface BusinessReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  business: { id: string; name: string };
  user: { name: string | null; phone: string };
}

export default function Reviews() {
  const { data, loading, error, reload } = useApi<{ serviceReviews: ServiceReview[]; businessReviews: BusinessReview[] }>(
    "/admin/reviews",
  );
  const [tab, setTab] = useState<"service" | "business">("service");

  async function remove(kind: string, id: string) {
    if (!confirm("Delete this review?")) return;
    await api(`/admin/reviews/${kind}/${id}`, { method: "DELETE" });
    void reload();
  }

  const rows =
    tab === "service"
      ? (data?.serviceReviews ?? []).map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          subject: r.booking.service.name,
          detail: r.booking.provider ? `Provider: ${r.booking.provider.name ?? "—"}` : "",
          author: r.booking.customer.name ?? r.booking.customer.phone,
        }))
      : (data?.businessReviews ?? []).map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
          subject: r.business.name,
          detail: "",
          author: r.user.name ?? r.user.phone,
        }));

  return (
    <>
      <PageHeader title="Reviews" subtitle="Moderate service and business reviews" />
      <div className="toolbar">
        <div className="tabs">
          <button className={tab === "service" ? "active" : ""} onClick={() => setTab("service")}>
            Service reviews ({data?.serviceReviews.length ?? 0})
          </button>
          <button className={tab === "business" ? "active" : ""} onClick={() => setTab("business")}>
            Business reviews ({data?.businessReviews.length ?? 0})
          </button>
        </div>
      </div>
      <div className="card table-card">
        <State loading={loading && !data} error={error} empty={!!data && rows.length === 0} />
        {rows.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>{tab === "service" ? "Service" : "Business"}</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>By</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.subject}</strong>
                    {r.detail && <small className="muted block">{r.detail}</small>}
                  </td>
                  <td>
                    <Stars value={r.rating} />
                  </td>
                  <td>{r.comment ?? <span className="muted">—</span>}</td>
                  <td>{r.author}</td>
                  <td>{date(r.createdAt)}</td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(tab, r.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
