import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { parse } from "../lib/validate";
import { issueOtp, consumeOtp } from "../lib/otp";
import { signToken } from "../lib/jwt";
import { HttpError } from "../lib/errors";
import { requireAuth, currentUser } from "../middleware/auth";
import type { Role } from "../lib/constants";

const router = Router();

const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");

const userSelect = {
  id: true,
  phone: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  provider: { include: { categories: true } },
} as const;

router.post("/otp/request", async (req, res) => {
  const { phone } = parse(z.object({ phone: phoneSchema }), req.body);
  const { devMode } = await issueOtp(phone);
  res.json({ sent: true, devMode });
});

router.post("/otp/verify", async (req, res) => {
  const { phone, code } = parse(
    z.object({ phone: phoneSchema, code: z.string().length(6) }),
    req.body,
  );
  if (!(await consumeOtp(phone, code))) throw new HttpError(401, "Invalid or expired OTP");

  let user = await prisma.user.findUnique({ where: { phone } });
  const isNew = !user;
  if (!user) user = await prisma.user.create({ data: { phone } });
  if (!user.isActive) throw new HttpError(403, "Your account has been disabled");

  const token = signToken({ sub: user.id, role: user.role as Role });
  const profile = await prisma.user.findUnique({ where: { id: user.id }, select: userSelect });
  res.json({ token, user: profile, isNew });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: currentUser(req).id },
    select: userSelect,
  });
  res.json(user);
});

router.patch("/me", requireAuth, async (req, res) => {
  const data = parse(
    z.object({
      name: z.string().trim().min(1).max(80).optional(),
      email: z.string().email().optional().or(z.literal("")),
    }),
    req.body,
  );
  const user = await prisma.user.update({
    where: { id: currentUser(req).id },
    data: { ...data, email: data.email || null },
    select: userSelect,
  });
  res.json(user);
});

export default router;
