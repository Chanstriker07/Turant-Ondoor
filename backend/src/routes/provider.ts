import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { parse, param } from "../lib/validate";
import { badRequest, forbidden, notFound } from "../lib/errors";
import { signToken } from "../lib/jwt";
import type { BookingStatus } from "../lib/constants";
import { requireAuth, requireRole, currentUser } from "../middleware/auth";
import { bookingInclude } from "./bookings";

const router = Router();
router.use(requireAuth);

const profileSchema = z.object({
  bio: z.string().trim().max(500).default(""),
  experienceYears: z.number().int().min(0).max(60).default(0),
  city: z.string().trim().min(2).max(60),
  categoryIds: z.array(z.string()).min(1, "Select at least one service category"),
});

router.post("/register", async (req, res) => {
  const user = currentUser(req);
  if (user.role === "ADMIN") throw badRequest("Admins cannot register as providers");
  const data = parse(profileSchema, req.body);
  const existing = await prisma.providerProfile.findUnique({ where: { userId: user.id } });
  if (existing) throw badRequest("You are already registered as a provider");

  const { categoryIds, ...rest } = data;
  const profile = await prisma.providerProfile.create({
    data: {
      ...rest,
      userId: user.id,
      categories: { connect: categoryIds.map((id) => ({ id })) },
    },
    include: { categories: true },
  });
  await prisma.user.update({ where: { id: user.id }, data: { role: "PROVIDER" } });
  res.status(201).json({ profile, token: signToken({ sub: user.id, role: "PROVIDER" }) });
});

router.use(requireRole("PROVIDER"));

router.get("/profile", async (req, res) => {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId: currentUser(req).id },
    include: { categories: true },
  });
  if (!profile) throw notFound("Provider profile");
  res.json(profile);
});

router.patch("/profile", async (req, res) => {
  const data = parse(
    profileSchema.partial().extend({ isAvailable: z.boolean().optional() }),
    req.body,
  );
  const { categoryIds, ...rest } = data;
  const profile = await prisma.providerProfile.update({
    where: { userId: currentUser(req).id },
    data: {
      ...rest,
      ...(categoryIds ? { categories: { set: categoryIds.map((id) => ({ id })) } } : {}),
    },
    include: { categories: true },
  });
  res.json(profile);
});

router.get("/jobs", async (req, res) => {
  const jobs = await prisma.booking.findMany({
    where: { providerId: currentUser(req).id },
    include: bookingInclude,
    orderBy: { scheduledAt: "asc" },
  });
  res.json(jobs);
});

const transitions: Record<string, { from: BookingStatus[]; to: BookingStatus }> = {
  accept: { from: ["ASSIGNED"], to: "ACCEPTED" },
  start: { from: ["ACCEPTED"], to: "IN_PROGRESS" },
  complete: { from: ["IN_PROGRESS"], to: "COMPLETED" },
  reject: { from: ["ASSIGNED", "ACCEPTED"], to: "PENDING" },
};

router.post("/jobs/:id/:action", async (req, res) => {
  const action = param(req.params.action);
  const transition = transitions[action];
  if (!transition) throw notFound("Action");

  const job = await prisma.booking.findUnique({ where: { id: param(req.params.id) } });
  if (!job) throw notFound("Job");
  if (job.providerId !== currentUser(req).id) throw forbidden("This job is not assigned to you");
  if (!transition.from.includes(job.status as BookingStatus)) {
    throw badRequest(`Cannot ${action} a job that is ${job.status.toLowerCase()}`);
  }

  const updated = await prisma.booking.update({
    where: { id: job.id },
    data: {
      status: transition.to,
      ...(action === "reject" ? { providerId: null } : {}),
      ...(action === "complete" ? { paymentStatus: "PAID" } : {}),
    },
    include: bookingInclude,
  });
  res.json(updated);
});

export default router;
