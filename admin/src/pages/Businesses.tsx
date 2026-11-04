import { useState } from "react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import type { Business, BusinessStatus, Category } from "../lib/types";
import { date, label } from "../lib/format";
import { Badge, Field, Modal, PageHeader, State } from "../components/ui";

const statuses: BusinessStatus[] = ["PENDING", "APPROVED", "REJECTED"];

export default function Businesses() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const query = new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}) }).toString();
  const { data, loading, error, reload } = useApi<Business[]>(`/admin/businesses?${query}`);
  const cats = useApi<Category[]>("/admin/listing-categories");
  const [editing, setEditing] = useState<Business | "new" | null>(null);

  async function update(b: Business, body: Partial<Business>) {
    try {
      await api(`/admin/businesses/${b.id}`, { method: "PATCH", body });
      void reload();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function remove(b: Business) {
    if (!confirm(`Delete ${b.name}?`)) return;
    await api(`/admin/businesses/${b.id}`, { method: "DELETE" });
    void reload();
  }

  return (
    <>
      <PageHeader
        title="Local listings"
        subtitle="Business directory: review submissions, feature and verify listings"
        actions={
          <button className="btn btn-primary" onClick={() => setEditing("new")}>
            + Add business
          </button>
        }
      />
      <div className="toolbar">
        <div className="tabs">
          <button className={!status ? "active" : ""} onClick={() => setStatus("")}>
            All
          </button>
          {statuses.map((s) => (
            <button key={s} className={status === s ? "active" : ""} onClick={() => setStatus(s)}>
              {label(s)}
            </button>
          ))}
        </div>
        <input className="search" placeholder="Search name, city, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card table-card">
        <State loading={loading && !data} error={error} empty={data?.length === 0} />
        {data && data.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Business</th>
                <th>Category</th>
                <th>City</th>
                <th>Contact</th>
                <th>Rating</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((b) => (
                <tr key={b.id}>
                  <td>
                    <strong>
                      {b.name} {b.isVerified && <span title="Verified">✅</span>} {b.isFeatured && <span title="Featured">⭐</span>}
                    </strong>
                    <small className="muted block">
                      {b.owner ? `Submitted by ${b.owner.name ?? b.owner.phone}` : "Added by admin"} · {date(b.createdAt)}
                    </small>
                  </td>
                  <td>
                    {b.category.icon} {b.category.name}
                  </td>
                  <td>{b.city}</td>
                  <td>{b.phone}</td>
                  <td>
                    ★ {b.rating.toFixed(1)} <small className="muted">({b.reviewCount})</small>
                  </td>
                  <td>
                    <Badge value={b.status} />
                  </td>
                  <td className="row gap wrap">
                    {b.status !== "APPROVED" && (
                      <button className="btn btn-sm btn-primary" onClick={() => update(b, { status: "APPROVED" })}>
                        Approve
                      </button>
                    )}
                    {b.status === "PENDING" && (
                      <button className="btn btn-sm btn-danger" onClick={() => update(b, { status: "REJECTED" })}>
                        Reject
                      </button>
                    )}
                    <button className="btn btn-sm" onClick={() => update(b, { isFeatured: !b.isFeatured })}>
                      {b.isFeatured ? "Unfeature" : "Feature"}
                    </button>
                    <button className="btn btn-sm" onClick={() => setEditing(b)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(b)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {editing && cats.data && (
        <BusinessModal
          business={editing === "new" ? null : editing}
          categories={cats.data}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void reload();
          }}
        />
      )}
    </>
  );
}

function BusinessModal({
  business,
  categories,
  onClose,
  onSaved,
}: {
  business: Business | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    categoryId: business?.categoryId ?? categories[0]?.id ?? "",
    name: business?.name ?? "",
    description: business?.description ?? "",
    phone: business?.phone ?? "",
    whatsapp: business?.whatsapp ?? "",
    email: business?.email ?? "",
    website: business?.website ?? "",
    address: business?.address ?? "",
    city: business?.city ?? "",
    pincode: business?.pincode ?? "",
    openingHours: business?.openingHours ?? "",
    isFeatured: business?.isFeatured ?? false,
    isVerified: business?.isVerified ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const input = (k: keyof typeof form) => ({
    value: form[k] as string,
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value }),
  });

  async function save() {
    setError(null);
    try {
      await api(business ? `/admin/businesses/${business.id}` : "/admin/businesses", {
        method: business ? "PATCH" : "POST",
        body: form,
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Modal title={business ? "Edit business" : "Add business"} onClose={onClose}>
      <div className="grid-2">
        <Field label="Name">
          <input {...input("name")} />
        </Field>
        <Field label="Category">
          <select {...input("categoryId")}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Description">
        <textarea rows={2} {...input("description")} />
      </Field>
      <div className="grid-2">
        <Field label="Phone">
          <input {...input("phone")} />
        </Field>
        <Field label="WhatsApp">
          <input {...input("whatsapp")} />
        </Field>
        <Field label="Email">
          <input {...input("email")} />
        </Field>
        <Field label="Website">
          <input {...input("website")} placeholder="https://" />
        </Field>
      </div>
      <Field label="Address">
        <input {...input("address")} />
      </Field>
      <div className="grid-2">
        <Field label="City">
          <input {...input("city")} />
        </Field>
        <Field label="Pincode">
          <input {...input("pincode")} />
        </Field>
      </div>
      <Field label="Opening hours">
        <input {...input("openingHours")} placeholder="9:00 AM - 9:00 PM" />
      </Field>
      <div className="row gap">
        <label className="checkbox">
          <input type="checkbox" checked={form.isVerified} onChange={(e) => setForm({ ...form, isVerified: e.target.checked })} /> Verified
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Featured
        </label>
      </div>
      {error && <div className="alert">{error}</div>}
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={save}>
          Save
        </button>
      </div>
    </Modal>
  );
}
