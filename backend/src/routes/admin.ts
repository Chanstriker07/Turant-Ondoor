import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { parse, param } from "../lib/validate";
import { badRequest, notFound } from "../lib/errors";
import { BOOKING_STATUSES, BUSINESS_STATUSES, ROLES } from "../lib/constants";
import { refreshBusinessRating, refreshProviderRating } from "../lib/ratings";
import { requireAuth, requireRole } from "../middleware/auth";
import { bookingInclude } from "./bookings";
import { businessSchema } from "./listings";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// ---------- Dashboard ----------
router.get("/stats", async (_req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [
    users,
    providers,
    pendingProviders,
    bookings,
    bookingsToday,
    pendingBookings,
    businesses,
    pendingBusinesses,
    revenue,
    byStatus,
    recentBookings,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.providerProfile.count(),
    prisma.providerProfile.count({ where: { isVerified: false } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.business.count({ where: { status: "APPROVED" } }),
    prisma.business.count({ where: { status: "PENDING" } }),
    prisma.booking.aggregate({ where: { status: "COMPLETED" }, _sum: { price: true } }),
    prisma.booking.groupBy({ by: ["status"], _count: true }),
    prisma.booking.findMany({ include: bookingInclude, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  res.json({
    users,
    providers,
    pendingProviders,
    bookings,
    bookingsToday,
    pendingBookings,
    businesses,
    pendingBusinesses,
    revenue: revenue._sum.price ?? 0,
    bookingsByStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
    recentBookings,
  });
});

// ---------- Service categories ----------
const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  icon: z.string().trim().min(1).max(8).default("🛠️"),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

router.get("/categories", async (_req, res) => {
  res.json(
    await prisma.serviceCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { services: true, providers: true } } },
    }),
  );
});

router.post("/categories", async (req, res) => {
  const data = parse(categorySchema, req.body);
  res.status(201).json(await prisma.serviceCategory.create({ data: { ...data, slug: slugify(data.name) } }));
});

router.patch("/categories/:id", async (req, res) => {
  const data = parse(categorySchema.partial(), req.body);
  res.json(
    await prisma.serviceCategory.update({
      where: { id: param(req.params.id) },
      data: { ...data, ...(data.name ? { slug: slugify(data.name) } : {}) },
    }),
  );
});

router.delete("/categories/:id", async (req, res) => {
  const id = param(req.params.id);
  if (await prisma.booking.count({ where: { service: { categoryId: id } } })) {
    throw badRequest("Category has bookings; deactivate it instead");
  }
  await prisma.serviceCategory.delete({ where: { id } });
  res.status(204).end();
});

// ---------- Services ----------
const serviceSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).default(""),
  price: z.number().int().min(0),
  durationMins: z.number().int().min(15).max(24 * 60).default(60),
  isActive: z.boolean().default(true),
});

router.get("/services", async (req, res) => {
  const categoryId = str(req.query.categoryId);
  res.json(
    await prisma.service.findMany({
      where: categoryId ? { categoryId } : {},
      include: { category: true, _count: { select: { bookings: true } } },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    }),
  );
});

router.post("/services", async (req, res) => {
  const data = parse(serviceSchema, req.body);
  res.status(201).json(await prisma.service.create({ data, include: { category: true } }));
});

router.patch("/services/:id", async (req, res) => {
  const data = parse(serviceSchema.partial(), req.body);
  res.json(
    await prisma.service.update({
      where: { id: param(req.params.id) },
      data,
      include: { category: true },
    }),
  );
});

router.delete("/services/:id", async (req, res) => {
  const id = param(req.params.id);
  if (await prisma.booking.count({ where: { serviceId: id } })) {
    throw badRequest("Service has bookings; deactivate it instead");
  }
  await prisma.service.delete({ where: { id } });
  res.status(204).end();
});

// ---------- Bookings ----------
router.get("/bookings", async (req, res) => {
  const status = str(req.query.status);
  const q = str(req.query.q);
  res.json(
    await prisma.booking.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { id: { contains: q, mode: "insensitive" } },
                { customer: { phone: { contains: q, mode: "insensitive" } } },
                { customer: { name: { contains: q, mode: "insensitive" } } },
                { service: { name: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  );
});

router.patch("/bookings/:id", async (req, res) => {
  const data = parse(
    z.object({
      status: z.enum(BOOKING_STATUSES).optional(),
      providerId: z.string().nullable().optional(),
      scheduledAt: z.coerce.date().optional(),
    }),
    req.body,
  );
  const booking = await prisma.booking.findUnique({ where: { id: param(req.params.id) } });
  if (!booking) throw notFound("Booking");

  const update: Record<string, unknown> = { ...data };
  if (data.providerId) {
    const provider = await prisma.providerProfile.findUnique({ where: { userId: data.providerId } });
    if (!provider) throw badRequest("Selected user is not a provider");
    if (!provider.isVerified) throw badRequest("Provider is not verified yet");
    if (!data.status && booking.status === "PENDING") update.status = "ASSIGNED";
  }
  if (data.providerId === null && !data.status && ["ASSIGNED", "ACCEPTED"].includes(booking.status)) {
    update.status = "PENDING";
  }
  if (update.status === "COMPLETED") update.paymentStatus = "PAID";

  res.json(
    await prisma.booking.update({ where: { id: booking.id }, data: update, include: bookingInclude }),
  );
});

// ---------- Providers ----------
router.get("/providers", async (req, res) => {
  const categoryId = str(req.query.categoryId);
  const verified = str(req.query.verified);
  res.json(
    await prisma.providerProfile.findMany({
      where: {
        ...(categoryId ? { categories: { some: { id: categoryId } } } : {}),
        ...(verified ? { isVerified: verified === "true" } : {}),
      },
      include: {
        categories: true,
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            isActive: true,
            _count: { select: { jobs: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  );
});

router.patch("/providers/:id", async (req, res) => {
  const data = parse(
    z.object({ isVerified: z.boolean().optional(), isAvailable: z.boolean().optional() }),
    req.body,
  );
  res.json(
    await prisma.providerProfile.update({
      where: { id: param(req.params.id) },
      data,
      include: { categories: true, user: { select: { id: true, name: true, phone: true } } },
    }),
  );
});

// ---------- Listing categories ----------
router.get("/listing-categories", async (_req, res) => {
  res.json(
    await prisma.listingCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { businesses: true } } },
    }),
  );
});

router.post("/listing-categories", async (req, res) => {
  const data = parse(categorySchema.extend({ icon: z.string().trim().min(1).max(8).default("🏪") }), req.body);
  res.status(201).json(await prisma.listingCategory.create({ data: { ...data, slug: slugify(data.name) } }));
});

router.patch("/listing-categories/:id", async (req, res) => {
  const data = parse(categorySchema.partial(), req.body);
  res.json(
    await prisma.listingCategory.update({
      where: { id: param(req.params.id) },
      data: { ...data, ...(data.name ? { slug: slugify(data.name) } : {}) },
    }),
  );
});

router.delete("/listing-categories/:id", async (req, res) => {
  const id = param(req.params.id);
  if (await prisma.business.count({ where: { categoryId: id } })) {
    throw badRequest("Category has businesses; deactivate it instead");
  }
  await prisma.listingCategory.delete({ where: { id } });
  res.status(204).end();
});

// ---------- Businesses ----------
router.get("/businesses", async (req, res) => {
  const status = str(req.query.status);
  const q = str(req.query.q);
  res.json(
    await prisma.business.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { city: { contains: q, mode: "insensitive" } }, { phone: { contains: q, mode: "insensitive" } }] } : {}),
      },
      include: { category: true, owner: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  );
});

router.post("/businesses", async (req, res) => {
  const data = parse(
    businessSchema.extend({ isFeatured: z.boolean().default(false), isVerified: z.boolean().default(false) }),
    req.body,
  );
  res.status(201).json(
    await prisma.business.create({ data: { ...data, status: "APPROVED" }, include: { category: true } }),
  );
});

router.patch("/businesses/:id", async (req, res) => {
  const data = parse(
    businessSchema.partial().extend({
      status: z.enum(BUSINESS_STATUSES).optional(),
      isFeatured: z.boolean().optional(),
      isVerified: z.boolean().optional(),
    }),
    req.body,
  );
  res.json(
    await prisma.business.update({
      where: { id: param(req.params.id) },
      data,
      include: { category: true, owner: { select: { id: true, name: true, phone: true } } },
    }),
  );
});

router.delete("/businesses/:id", async (req, res) => {
  await prisma.business.delete({ where: { id: param(req.params.id) } });
  res.status(204).end();
});

// ---------- Users ----------
router.get("/users", async (req, res) => {
  const role = str(req.query.role);
  const q = str(req.query.q);
  res.json(
    await prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(q ? { OR: [{ phone: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : {}),
      },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { bookings: true, businesses: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  );
});

router.patch("/users/:id", async (req, res) => {
  const data = parse(
    z.object({ isActive: z.boolean().optional(), role: z.enum(ROLES).optional() }),
    req.body,
  );
  if (param(req.params.id) === req.user?.id && (data.isActive === false || (data.role && data.role !== "ADMIN"))) {
    throw badRequest("You cannot disable or demote your own account");
  }
  res.json(
    await prisma.user.update({
      where: { id: param(req.params.id) },
      data,
      select: { id: true, phone: true, name: true, role: true, isActive: true },
    }),
  );
});

// ---------- Reviews ----------
router.get("/reviews", async (_req, res) => {
  const [serviceReviews, businessReviews] = await Promise.all([
    prisma.bookingReview.findMany({
      include: {
        booking: {
          select: {
            id: true,
            service: { select: { name: true } },
            customer: { select: { name: true, phone: true } },
            provider: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.businessReview.findMany({
      include: {
        business: { select: { id: true, name: true } },
        user: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);
  res.json({ serviceReviews, businessReviews });
});

router.delete("/reviews/service/:id", async (req, res) => {
  const review = await prisma.bookingReview.delete({
    where: { id: param(req.params.id) },
    include: { booking: true },
  });
  if (review.booking.providerId) await refreshProviderRating(review.booking.providerId);
  res.status(204).end();
});

router.delete("/reviews/business/:id", async (req, res) => {
  const review = await prisma.businessReview.delete({ where: { id: param(req.params.id) } });
  await refreshBusinessRating(review.businessId);
  res.status(204).end();
});

export default router;
