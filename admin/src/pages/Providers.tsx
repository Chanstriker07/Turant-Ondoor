import { useState } from "react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import type { Provider } from "../lib/types";
import { date } from "../lib/format";
import { Badge, PageHeader, State } from "../components/ui";

export default function Providers() {
  const [verified, setVerified] = useState("");
  const { data, loading, error, reload } = useApi<Provider[]>(`/admin/providers${verified ? `?verified=${verified}` : ""}`);

  async function update(p: Provider, body: Partial<Provider>) {
    try {
      await api(`/admin/providers/${p.id}`, { method: "PATCH", body });
      void reload();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <>
      <PageHeader title="Service providers" subtitle="Verify professionals before they can be assigned jobs" />
      <div className="toolbar">
        <div className="tabs">
          {[
            ["", "All"],
            ["false", "Awaiting verification"],
            ["true", "Verified"],
          ].map(([v, l]) => (
            <button key={v} className={verified === v ? "active" : ""} onClick={() => setVerified(v)}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="card table-card">
        <State loading={loading && !data} error={error} empty={data?.length === 0} />
        {data && data.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Skills</th>
                <th>City</th>
                <th>Experience</th>
                <th>Rating</th>
                <th>Jobs</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.user.name ?? "—"}</strong>
                    <small className="muted block">
                      +91 {p.user.phone} · joined {date(p.createdAt)}
                    </small>
                  </td>
                  <td>{p.categories.map((c) => `${c.icon} ${c.name}`).join(", ")}</td>
                  <td>{p.city}</td>
                  <td>{p.experienceYears} yrs</td>
                  <td>
                    ★ {p.rating.toFixed(1)} <small className="muted">({p.ratingCount})</small>
                  </td>
                  <td>{p.user._count.jobs}</td>
                  <td className="row gap">
                    <Badge value={p.isVerified ? "VERIFIED" : "UNVERIFIED"} />
                    {!p.isAvailable && <Badge value="UNAVAILABLE" />}
                  </td>
                  <td className="row gap">
                    <button
                      className={`btn btn-sm ${p.isVerified ? "" : "btn-primary"}`}
                      onClick={() => update(p, { isVerified: !p.isVerified })}
                    >
                      {p.isVerified ? "Unverify" : "Verify"}
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
