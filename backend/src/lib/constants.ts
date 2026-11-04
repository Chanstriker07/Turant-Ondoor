export const ROLES = ["CUSTOMER", "PROVIDER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const BOOKING_STATUSES = [
  "PENDING",
  "ASSIGNED",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const CANCELLABLE_STATUSES: BookingStatus[] = ["PENDING", "ASSIGNED", "ACCEPTED"];

export const BUSINESS_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
