export type Role = "CUSTOMER" | "PROVIDER" | "ADMIN";
export type BookingStatus = "PENDING" | "ASSIGNED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type BusinessStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  _count?: { bookings: number; businesses: number };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { services?: number; providers?: number; businesses?: number };
}

export interface Service {
  id: string;
  categoryId: string;
  category: Category;
  name: string;
  description: string;
  price: number;
  durationMins: number;
  isActive: boolean;
  _count?: { bookings: number };
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
  service: Service;
  address: Address;
  customer: { id: string; name: string | null; phone: string };
  provider: { id: string; name: string | null; phone: string } | null;
  review: { rating: number; comment: string | null } | null;
}

export interface Provider {
  id: string;
  bio: string;
  experienceYears: number;
  city: string;
  isVerified: boolean;
  isAvailable: boolean;
  rating: number;
  ratingCount: number;
  createdAt: string;
  categories: Category[];
  user: { id: string; name: string | null; phone: string; isActive: boolean; _count: { jobs: number } };
}

export interface Business {
  id: string;
  categoryId: string;
  category: Category;
  owner: { id: string; name: string | null; phone: string } | null;
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
  status: BusinessStatus;
  isFeatured: boolean;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface Stats {
  users: number;
  providers: number;
  pendingProviders: number;
  bookings: number;
  bookingsToday: number;
  pendingBookings: number;
  businesses: number;
  pendingBusinesses: number;
  revenue: number;
  bookingsByStatus: Partial<Record<BookingStatus, number>>;
  recentBookings: Booking[];
}
