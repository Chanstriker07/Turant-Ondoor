export type Role = "CUSTOMER" | "PROVIDER" | "ADMIN";
export type BookingStatus = "PENDING" | "ASSIGNED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface Category {
  id: string;
  name: string;
  icon: string;
  _count?: { services?: number; businesses?: number };
}

export interface ProviderProfile {
  id: string;
  bio: string;
  experienceYears: number;
  city: string;
  isVerified: boolean;
  isAvailable: boolean;
  rating: number;
  ratingCount: number;
  categories: Category[];
}

export interface User {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: Role;
  provider: ProviderProfile | null;
}

export interface Service {
  id: string;
  categoryId: string;
  category?: Category;
  name: string;
  description: string;
  price: number;
  durationMins: number;
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string | null;
  landmark?: string | null;
  city: string;
  pincode: string;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  scheduledAt: string;
  createdAt: string;
  price: number;
  notes: string | null;
  paymentMethod: string;
  paymentStatus: string;
  cancelReason: string | null;
  service: Service & { category: Category };
  address: Address;
  customer: { id: string; name: string | null; phone: string };
  provider: {
    id: string;
    name: string | null;
    phone: string;
    provider: { rating: number; ratingCount: number; experienceYears: number } | null;
  } | null;
  review: { rating: number; comment: string | null } | null;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user?: { name: string | null };
}

export interface Business {
  id: string;
  categoryId: string;
  category: Category;
  name: string;
  description: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  address: string;
  city: string;
  pincode: string | null;
  openingHours: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isFeatured: boolean;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  reviews?: Review[];
}
