import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { parse, param } from "../lib/validate";
import { badRequest, notFound } from "../lib/errors";
import { CANCELLABLE_STATUSES, type BookingStatus } from "../lib/constants";
import { refreshProviderRating } from "../lib/ratings";
import { requireAuth, currentUser } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

export const bookingInclude = {
  service: { include: { category: true } },
  address: true,
  customer: { select: { id: true, name: true, phone: true } },
  provider: {
    select: {
      id: true,
      name: true,
      phone: true,
      provider: { select: { rating: true, ratingCount: true, experienceYears: true } },
    },
  },
  review: true,
} as const;

router.post("/", async (req, res) => {
  const user = currentUser(req);
  const data = parse(
    z.object({
      serviceId: z.string().min(1),
      addressId: z.string().min(1),
      scheduledAt: z.coerce.date(),
      notes: z.string().trim().max(500).optional(),
    }),
    req.body,
  );
  if (data.scheduledAt.getTime() < Date.now()) throw badRequest("Pick a time in the future");

  const [service, address] = await Promise.all([
    prisma.service.findFirst({ where: { id: data.serviceId, isActive: true } }),
    prisma.address.findFirst({ where: { id: data.addressId, userId: user.id } }),
  ]);
  if (!service) throw notFound("Service");
  if (!address) throw notFound("Address");

  const booking = await prisma.booking.create({
    data: {
      customerId: user.id,
      serviceId: service.id,
      addressId: address.id,
      scheduledAt: data.scheduledAt,
      notes: data.notes,
      price: service.price,
    },
    include: bookingInclude,
  });
  res.status(201).json(booking);
});

router.get("/", async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { customerId: currentUser(req).id },
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
  });
  res.json(bookings);
});

async function findOwnBooking(id: string, userId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id, customerId: userId },
    include: bookingInclude,
  });
  if (!booking) throw notFound("Booking");
  return booking;
}

router.get("/:id", async (req, res) => {
  res.json(await findOwnBooking(param(req.params.id), currentUser(req).id));
});

router.post("/:id/cancel", async (req, res) => {
  const booking = await findOwnBooking(param(req.params.id), currentUser(req).id);
  const { reason } = parse(z.object({ reason: z.string().max(300).optional() }), req.body ?? {});
  if (!CANCELLABLE_STATUSES.includes(booking.status as BookingStatus)) {
    throw badRequest(`Booking cannot be cancelled once ${booking.status.toLowerCase()}`);
  }
  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED", cancelReason: reason ?? "Cancelled by customer" },
    include: bookingInclude,
  });
  res.json(updated);
});

router.post("/:id/review", async (req, res) => {
  const booking = await findOwnBooking(param(req.params.id), currentUser(req).id);
  const data = parse(
    z.object({
      rating: z.number().int().min(1).max(5),
      comment: z.string().trim().max(1000).optional(),
    }),
    req.body,
  );
  if (booking.status !== "COMPLETED") throw badRequest("You can rate only completed bookings");
  if (booking.review) throw badRequest("You have already rated this booking");
  const review = await prisma.bookingReview.create({ data: { ...data, bookingId: booking.id } });
  if (booking.providerId) await refreshProviderRating(booking.providerId);
  res.status(201).json(review);
});

export default router;
