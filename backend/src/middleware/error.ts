import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { HttpError } from "../lib/errors";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      res.status(404).json({ error: "Resource not found" });
      return;
    }
    if (err.code === "P2002") {
      res.status(409).json({ error: "Already exists" });
      return;
    }
    if (err.code === "P2003") {
      res.status(400).json({ error: "Related resource does not exist or is still in use" });
      return;
    }
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
