import type { Address, BookingStatus } from "./types";

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

export const duration = (mins: number) =>
  mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} hr${mins % 60 ? ` ${mins % 60} min` : ""}`;

export const addressText = (a: Address) =>
  [a.line1, a.line2, a.landmark && `near ${a.landmark}`, `${a.city} - ${a.pincode}`].filter(Boolean).join(", ");

export const statusInfo: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Finding professional", color: "#92400E", bg: "#FEF3C7" },
  ASSIGNED: { label: "Professional assigned", color: "#3730A3", bg: "#E0E7FF" },
  ACCEPTED: { label: "Confirmed", color: "#1E40AF", bg: "#DBEAFE" },
  IN_PROGRESS: { label: "In progress", color: "#155E75", bg: "#CFFAFE" },
  COMPLETED: { label: "Completed", color: "#166534", bg: "#DCFCE7" },
  CANCELLED: { label: "Cancelled", color: "#991B1B", bg: "#FEE2E2" },
};
