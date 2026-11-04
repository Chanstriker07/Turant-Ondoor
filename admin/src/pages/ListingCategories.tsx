import { useState } from "react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import type { Category } from "../lib/types";
import { Badge, PageHeader, State } from "../components/ui";
import CategoryModal from "../components/CategoryModal";

export default function ListingCategories() {
  const { data, loading, error, reload } = useApi<Category[]>("/admin/listing-categories");
  const [editing, setEditing] = useState<Category | "new" | null>(null);

  async function remove(c: Category) {
    if (!confirm(`Delete ${c.name}?`)) return;
    try {
      await api(`/admin/listing-categories/${c.id}`, { method: "DELETE" });
      setEditing(null);
      void reload();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Listing categories"
        subtitle="Categories for the local business directory"
        actions={
          <button className="btn btn-primary" onClick={() => setEditing("new")}>
            + Category
          </button>
        }
      />
      <State loading={loading && !data} error={error} empty={data?.length === 0} />
      <div className="tile-grid">
        {data?.map((c) => (
          <button key={c.id} className="tile" onClick={() => setEditing(c)}>
            <span className="tile-icon">{c.icon}</span>
            <strong>{c.name}</strong>
            <small className="muted">{c._count?.businesses ?? 0} businesses</small>
            {!c.isActive && <Badge value="INACTIVE" />}
          </button>
        ))}
      </div>
      {editing && (
        <CategoryModal
          basePath="/admin/listing-categories"
          category={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void reload();
          }}
          onDelete={editing !== "new" ? () => remove(editing) : undefined}
        />
      )}
    </>
  );
}
