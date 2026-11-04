import type { ReactNode } from "react";
import { label } from "../lib/format";

export function Badge({ value }: { value: string }) {
  return <span className={`badge badge-${value.toLowerCase()}`}>{label(value)}</span>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="row gap">{actions}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function State({ loading, error, empty }: { loading?: boolean; error?: string | null; empty?: boolean }) {
  if (loading) return <div className="state">Loading…</div>;
  if (error) return <div className="state error">{error}</div>;
  if (empty) return <div className="state">Nothing here yet.</div>;
  return null;
}

export function Stars({ value }: { value: number }) {
  return <span className="stars">{"★".repeat(Math.round(value))}{"☆".repeat(5 - Math.round(value))}</span>;
}
