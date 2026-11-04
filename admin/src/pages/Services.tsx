import { useState } from "react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import type { Category, Service } from "../lib/types";
import { rupees } from "../lib/format";
import { Badge, Field, Modal, PageHeader, State } from "../components/ui";
import CategoryModal from "../components/CategoryModal";

export default function Services() {
  const cats = useApi<Category[]>("/admin/categories");
  const [categoryId, setCategoryId] = useState("");
  const services = useApi<Service[]>(`/admin/services${categoryId ? `?categoryId=${categoryId}` : ""}`);
  const [editCat, setEditCat] = useState<Category | "new" | null>(null);
  const [editService, setEditService] = useState<Service | "new" | null>(null);

  async function remove(path: string, reload: () => void) {
    if (!confirm("Delete permanently?")) return;
    try {
      await api(path, { method: "DELETE" });
      reload();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Services"
        subtitle="Home service categories and the services customers can book"
        actions={
          <>
            <button className="btn" onClick={() => setEditCat("new")}>
              + Category
            </button>
            <button className="btn btn-primary" onClick={() => setEditService("new")}>
              + Service
            </button>
          </>
        }
      />
      <div className="chip-row">
        <button className={`chip ${!categoryId ? "active" : ""}`} onClick={() => setCategoryId("")}>
          All
        </button>
        {cats.data?.map((c) => (
          <span key={c.id} className={`chip ${categoryId === c.id ? "active" : ""} ${c.isActive ? "" : "inactive"}`}>
            <button onClick={() => setCategoryId(c.id)}>
              {c.icon} {c.name} <small>({c._count?.services ?? 0})</small>
            </button>
            <button className="chip-edit" onClick={() => setEditCat(c)} aria-label={`Edit ${c.name}`}>
              ✎
            </button>
          </span>
        ))}
      </div>
      <div className="card table-card">
        <State loading={services.loading && !services.data} error={services.error} empty={services.data?.length === 0} />
        {services.data && services.data.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Category</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Bookings</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {services.data.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.name}</strong>
                    <small className="muted block truncate">{s.description}</small>
                  </td>
                  <td>
                    {s.category.icon} {s.category.name}
                  </td>
                  <td>{rupees(s.price)}</td>
                  <td>{s.durationMins} min</td>
                  <td>{s._count?.bookings ?? 0}</td>
                  <td>
                    <Badge value={s.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td className="row gap">
                    <button className="btn btn-sm" onClick={() => setEditService(s)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(`/admin/services/${s.id}`, services.reload)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {editCat && (
        <CategoryModal
          basePath="/admin/categories"
          category={editCat === "new" ? null : editCat}
          onClose={() => setEditCat(null)}
          onSaved={() => {
            setEditCat(null);
            void cats.reload();
            void services.reload();
          }}
          onDelete={
            editCat !== "new"
              ? () =>
                  remove(`/admin/categories/${editCat.id}`, () => {
                    setEditCat(null);
                    void cats.reload();
                  })
              : undefined
          }
        />
      )}
      {editService && cats.data && (
        <ServiceModal
          service={editService === "new" ? null : editService}
          categories={cats.data}
          defaultCategoryId={categoryId}
          onClose={() => setEditService(null)}
          onSaved={() => {
            setEditService(null);
            void services.reload();
            void cats.reload();
          }}
        />
      )}
    </>
  );
}

function ServiceModal({
  service,
  categories,
  defaultCategoryId,
  onClose,
  onSaved,
}: {
  service: Service | null;
  categories: Category[];
  defaultCategoryId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    categoryId: service?.categoryId ?? (defaultCategoryId || categories[0]?.id || ""),
    name: service?.name ?? "",
    description: service?.description ?? "",
    price: service?.price ?? 499,
    durationMins: service?.durationMins ?? 60,
    isActive: service?.isActive ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setError(null);
    try {
      await api(service ? `/admin/services/${service.id}` : "/admin/services", {
        method: service ? "PATCH" : "POST",
        body: form,
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Modal title={service ? "Edit service" : "New service"} onClose={onClose}>
      <Field label="Category">
        <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Name">
        <input value={form.name} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <Field label="Description">
        <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </Field>
      <div className="grid-2">
        <Field label="Price (₹)">
          <input type="number" min={0} value={form.price} onChange={(e) => set("price", Number(e.target.value))} />
        </Field>
        <Field label="Duration (minutes)">
          <input
            type="number"
            min={15}
            step={15}
            value={form.durationMins}
            onChange={(e) => set("durationMins", Number(e.target.value))}
          />
        </Field>
      </div>
      <label className="checkbox">
        <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Active (visible in app)
      </label>
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
