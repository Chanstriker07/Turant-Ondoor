import { Router } from "express";
import { prisma } from "../lib/prisma";
import { notFound } from "../lib/errors";
import { param } from "../lib/validate";

const router = Router();

router.get("/categories", async (_req, res) => {
  const categories = await prisma.serviceCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { services: { where: { isActive: true } } } } },
  });
  res.json(categories);
});

router.get("/categories/:id", async (req, res) => {
  const category = await prisma.serviceCategory.findFirst({
    where: { id: param(req.params.id), isActive: true },
    include: { services: { where: { isActive: true }, orderBy: { price: "asc" } } },
  });
  if (!category) throw notFound("Category");
  res.json(category);
});

router.get("/services", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
  const services = await prisma.service.findMany({
    where: {
      isActive: true,
      category: { isActive: true },
      ...(categoryId ? { categoryId } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : {}),
    },
    include: { category: true },
    orderBy: { name: "asc" },
    take: 50,
  });
  res.json(services);
});

router.get("/services/:id", async (req, res) => {
  const service = await prisma.service.findFirst({
    where: { id: param(req.params.id), isActive: true },
    include: { category: true },
  });
  if (!service) throw notFound("Service");
  const reviews = await prisma.bookingReview.findMany({
    where: { booking: { serviceId: service.id } },
    include: { booking: { select: { customer: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  res.json({ ...service, reviews });
});

export default router;
