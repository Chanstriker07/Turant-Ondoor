import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { parse, param } from "../lib/validate";
import { badRequest, notFound } from "../lib/errors";
import { refreshBusinessRating } from "../lib/ratings";
import { requireAuth, currentUser } from "../middleware/auth";

const router = Router();

export const businessSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).default(""),
  phone: z.string().regex(/^\d{10,12}$/, "Enter a valid phone number"),
  whatsapp: z
    .string()
    .regex(/^\d{10,12}$/, "Enter a valid WhatsApp number")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  website: z.string().url().optional().or(z.literal("").transform(() => undefined)),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(60),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Enter a valid 6-digit pincode")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  openingHours: z.string().trim().max(120).optional(),
});

router.get("/listing-categories", async (_req, res) => {
  const categories = await prisma.listingCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { businesses: { where: { status: "APPROVED" } } } } },
  });
  res.json(categories);
});

router.get("/businesses", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
  const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
  const featured = req.query.featured === "true";
  const businesses = await prisma.business.findMany({
    where: {
      status: "APPROVED",
      ...(categoryId ? { categoryId } : {}),
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      ...(featured ? { isFeatured: true } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { address: { contains: q, mode: "insensitive" } },
              { category: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { category: true },
    orderBy: [{ isFeatured: "desc" }, { rating: "desc" }, { name: "asc" }],
    take: 100,
  });
  res.json(businesses);
});

router.get("/businesses/mine", requireAuth, async (req, res) => {
  const businesses = await prisma.business.findMany({
    where: { ownerId: currentUser(req).id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(businesses);
});

router.get("/businesses/:id", async (req, res) => {
  const business = await prisma.business.findFirst({
    where: { id: param(req.params.id), status: "APPROVED" },
    include: {
      category: true,
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
  if (!business) throw notFound("Business");
  res.json(business);
});

router.post("/businesses", requireAuth, async (req, res) => {
  const data = parse(businessSchema, req.body);
  const category = await prisma.listingCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) throw notFound("Category");
  const business = await prisma.business.create({
    data: { ...data, ownerId: currentUser(req).id, status: "PENDING" },
    include: { category: true },
  });
  res.status(201).json(business);
});

router.post("/businesses/:id/reviews", requireAuth, async (req, res) => {
  const user = currentUser(req);
  const data = parse(
    z.object({
      rating: z.number().int().min(1).max(5),
      comment: z.string().trim().max(1000).optional(),
    }),
    req.body,
  );
  const business = await prisma.business.findFirst({
    where: { id: param(req.params.id), status: "APPROVED" },
  });
  if (!business) throw notFound("Business");
  if (business.ownerId === user.id) throw badRequest("You cannot review your own business");

  const review = await prisma.businessReview.upsert({
    where: { businessId_userId: { businessId: business.id, userId: user.id } },
    create: { ...data, businessId: business.id, userId: user.id },
    update: data,
  });
  await refreshBusinessRating(business.id);
  res.status(201).json(review);
});

export default router;
