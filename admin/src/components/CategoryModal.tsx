import { useState } from "react";
import { api } from "../lib/api";
import type { Category } from "../lib/types";
import { Field, Modal } from "./ui";

export default function CategoryModal({
  basePath,
  category,
  onClose,
  onSaved,
  onDelete,
}: {
  basePath: string;
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState({
    name: category?.name ?? "",
    icon: category?.icon ?? "🛠️",
    sortOrder: category?.sortOrder ?? 0,
    isActive: category?.isActive ?? true,
  });
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    try {
      await api(category ? `${basePath}/${category.id}` : basePath, {
        method: category ? "PATCH" : "POST",
        body: form,
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Modal title={category ? "Edit category" : "New category"} onClose={onClose}>
      <div className="grid-icon">
        <Field label="Icon (emoji)">
          <input value={form.icon} maxLength={8} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
        </Field>
        <Field label="Name">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
      </div>
      <Field label="Sort order">
        <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
      </Field>
      <label className="checkbox">
        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
      </label>
      {error && <div className="alert">{error}</div>}
      <div className="modal-actions">
        {onDelete && (
          <button className="btn btn-danger" onClick={onDelete} style={{ marginRight: "auto" }}>
            Delete
          </button>
        )}
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
