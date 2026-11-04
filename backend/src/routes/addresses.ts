import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { parse, param } from "../lib/validate";
import { notFound } from "../lib/errors";
import { requireAuth, currentUser } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

export const addressSchema = z.object({
  label: z.string().trim().min(1).max(30).default("Home"),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  landmark: z.string().trim().max(100).optional(),
  city: z.string().trim().min(2).max(60),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

router.get("/", async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: currentUser(req).id },
    orderBy: { createdAt: "desc" },
  });
  res.json(addresses);
});

router.post("/", async (req, res) => {
  const data = parse(addressSchema, req.body);
  const address = await prisma.address.create({ data: { ...data, userId: currentUser(req).id } });
  res.status(201).json(address);
});

router.delete("/:id", async (req, res) => {
  const address = await prisma.address.findFirst({
    where: { id: param(req.params.id), userId: currentUser(req).id },
    include: { _count: { select: { bookings: true } } },
  });
  if (!address) throw notFound("Address");
  if (address._count.bookings > 0) {
    // Keep addresses referenced by bookings; just detach from the user's list.
    res.status(409).json({ error: "Address is used by a booking and cannot be deleted" });
    return;
  }
  await prisma.address.delete({ where: { id: address.id } });
  res.status(204).end();
});

export default router;
