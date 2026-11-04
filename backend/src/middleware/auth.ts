import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../lib/jwt";
import { HttpError, forbidden } from "../lib/errors";
import type { Role } from "../lib/constants";

export interface AuthUser {
  id: string;
  role: Role;
  phone: string;
  name: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new HttpError(401, "Not authenticated");
  let payload;
  try {
    payload = verifyToken(header.slice(7));
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) throw new HttpError(401, "Account not found or disabled");
  req.user = { id: user.id, role: user.role as Role, phone: user.phone, name: user.name };
  next();
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) throw forbidden();
    next();
  };

export const currentUser = (req: Request) => {
  if (!req.user) throw new HttpError(401, "Not authenticated");
  return req.user;
};
