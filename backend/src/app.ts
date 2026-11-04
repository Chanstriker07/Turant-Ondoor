import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/auth";
import catalogRoutes from "./routes/catalog";
import addressRoutes from "./routes/addresses";
import bookingRoutes from "./routes/bookings";
import providerRoutes from "./routes/provider";
import listingRoutes from "./routes/listings";
import adminRoutes from "./routes/admin";
import { errorHandler } from "./middleware/error";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.use("/api/auth", authRoutes);
  app.use("/api", catalogRoutes);
  app.use("/api", listingRoutes);
  app.use("/api/addresses", addressRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/provider", providerRoutes);
  app.use("/api/admin", adminRoutes);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
  app.use(errorHandler);
  return app;
}
