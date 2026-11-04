import { useState } from "react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { useAuth } from "../lib/auth";
import type { Role, User } from "../lib/types";
import { date, label } from "../lib/format";
import { Badge, PageHeader, State } from "../components/ui";

const roles: Role[] = ["CUSTOMER", "PROVIDER", "ADMIN"];

export default function Users() {
  const { user: me } = useAuth();
  const [role, setRole] = useState("");
  const [q, setQ] = useState("");
  const query = new URLSearchParams({ ...(role ? { role } : {}), ...(q ? { q } : {}) }).toString();
  const { data, loading, error, reload } = useApi<User[]>(`/admin/users?${query}`);

  async function update(u: User, body: Partial<User>) {
    try {
      await api(`/admin/users/${u.id}`, { method: "PATCH", body });
      void reload();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <>
      <PageHeader title="Users" subtitle="Customers, providers and admins" />
      <div className="toolbar">
        <div className="tabs">
          <button className={!role ? "active" : ""} onClick={() => setRole("")}>
            All
          </button>
          {roles.map((r) => (
            <button key={r} className={role === r ? "active" : ""} onClick={() => setRole(r)}>
              {label(r)}s
            </button>
          ))}
        </div>
        <input className="search" placeholder="Search phone or name…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card table-card">
        <State loading={loading && !data} error={error} empty={data?.length === 0} />
        {data && data.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Bookings</th>
                <th>Listings</th>
                <th>Joined</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name ?? "—"}</strong>
                    <small className="muted block">
                      +91 {u.phone}
                      {u.email ? ` · ${u.email}` : ""}
                    </small>
                  </td>
                  <td>
                    <select
                      value={u.role}
                      disabled={u.id === me?.id}
                      onChange={(e) => update(u, { role: e.target.value as Role })}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {label(r)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{u._count?.bookings ?? 0}</td>
                  <td>{u._count?.businesses ?? 0}</td>
                  <td>{date(u.createdAt)}</td>
                  <td>
                    <Badge value={u.isActive ? "ACTIVE" : "DISABLED"} />
                  </td>
                  <td>
                    {u.id !== me?.id && (
                      <button
                        className={`btn btn-sm ${u.isActive ? "btn-danger" : ""}`}
                        onClick={() => update(u, { isActive: !u.isActive })}
                      >
                        {u.isActive ? "Disable" : "Enable"}
                      </button>
                    )}
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
