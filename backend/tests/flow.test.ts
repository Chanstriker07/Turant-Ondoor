import { describe, expect, it, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

async function login(phone: string) {
  await request(app).post("/api/auth/otp/request").send({ phone }).expect(200);
  const res = await request(app).post("/api/auth/otp/verify").send({ phone, code: "123456" }).expect(200);
  return res.body.token as string;
}

describe("Turant Ondoor API", () => {
  let customer: string;
  let admin: string;
  let provider: string;
  let providerUserId: string;

  beforeAll(async () => {
    customer = await login("7000000001");
    admin = await login("9999999999");
    provider = await login("8888888888");
    providerUserId = (await request(app).get("/api/auth/me").set("Authorization", `Bearer ${provider}`)).body.id;
  });

  it("rejects a wrong OTP and invalid phone", async () => {
    await request(app).post("/api/auth/otp/request").send({ phone: "12345" }).expect(400);
    await request(app).post("/api/auth/otp/verify").send({ phone: "7000000002", code: "000000" }).expect(401);
  });

  it("lists service catalog publicly", async () => {
    const cats = await request(app).get("/api/categories").expect(200);
    expect(cats.body.length).toBeGreaterThan(5);
    const cat = await request(app).get(`/api/categories/${cats.body[0].id}`).expect(200);
    expect(cat.body.services.length).toBeGreaterThan(0);
    const search = await request(app).get("/api/services?q=AC").expect(200);
    expect(search.body.length).toBeGreaterThan(0);
  });

  it("runs the full booking lifecycle", async () => {
    const auth = { Authorization: `Bearer ${customer}` };
    await request(app).patch("/api/auth/me").set(auth).send({ name: "Test User" }).expect(200);
    const address = await request(app)
      .post("/api/addresses")
      .set(auth)
      .send({ line1: "1 Test Street", city: "Bengaluru", pincode: "560001" })
      .expect(201);
    const services = await request(app).get("/api/services?q=Fan").expect(200);
    const service = services.body[0];

    await request(app)
      .post("/api/bookings")
      .set(auth)
      .send({ serviceId: service.id, addressId: address.body.id, scheduledAt: "2000-01-01T10:00:00Z" })
      .expect(400);

    const booking = await request(app)
      .post("/api/bookings")
      .set(auth)
      .send({
        serviceId: service.id,
        addressId: address.body.id,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      })
      .expect(201);
    expect(booking.body.status).toBe("PENDING");
    expect(booking.body.price).toBe(service.price);

    // customers can't hit admin routes
    await request(app).get("/api/admin/stats").set(auth).expect(403);

    const assigned = await request(app)
      .patch(`/api/admin/bookings/${booking.body.id}`)
      .set("Authorization", `Bearer ${admin}`)
      .send({ providerId: providerUserId })
      .expect(200);
    expect(assigned.body.status).toBe("ASSIGNED");

    const p = { Authorization: `Bearer ${provider}` };
    const jobs = await request(app).get("/api/provider/jobs").set(p).expect(200);
    expect(jobs.body.some((j: { id: string }) => j.id === booking.body.id)).toBe(true);
    await request(app).post(`/api/provider/jobs/${booking.body.id}/complete`).set(p).expect(400);
    for (const action of ["accept", "start", "complete"]) {
      await request(app).post(`/api/provider/jobs/${booking.body.id}/${action}`).set(p).expect(200);
    }

    await request(app).post(`/api/bookings/${booking.body.id}/cancel`).set(auth).expect(400);
    await request(app)
      .post(`/api/bookings/${booking.body.id}/review`)
      .set(auth)
      .send({ rating: 5, comment: "Great" })
      .expect(201);
    await request(app).post(`/api/bookings/${booking.body.id}/review`).set(auth).send({ rating: 4 }).expect(400);

    const profile = await request(app).get("/api/provider/profile").set(p).expect(200);
    expect(profile.body.ratingCount).toBe(1);
    expect(profile.body.rating).toBe(5);

    const stats = await request(app).get("/api/admin/stats").set("Authorization", `Bearer ${admin}`).expect(200);
    expect(stats.body.revenue).toBe(service.price);
  });

  it("lets a customer cancel a pending booking", async () => {
    const auth = { Authorization: `Bearer ${customer}` };
    const [address] = (await request(app).get("/api/addresses").set(auth)).body;
    const [service] = (await request(app).get("/api/services")).body;
    const booking = await request(app)
      .post("/api/bookings")
      .set(auth)
      .send({ serviceId: service.id, addressId: address.id, scheduledAt: new Date(Date.now() + 3600000) })
      .expect(201);
    const cancelled = await request(app).post(`/api/bookings/${booking.body.id}/cancel`).set(auth).send({}).expect(200);
    expect(cancelled.body.status).toBe("CANCELLED");
  });

  it("supports business listings with moderation and reviews", async () => {
    const auth = { Authorization: `Bearer ${customer}` };
    const cats = await request(app).get("/api/listing-categories").expect(200);
    const created = await request(app)
      .post("/api/businesses")
      .set(auth)
      .send({
        categoryId: cats.body[0].id,
        name: "Test Dhaba",
        phone: "9123456789",
        address: "Highway 44, Km 12",
        city: "Hyderabad",
      })
      .expect(201);
    expect(created.body.status).toBe("PENDING");
    await request(app).get(`/api/businesses/${created.body.id}`).expect(404);

    await request(app)
      .patch(`/api/admin/businesses/${created.body.id}`)
      .set("Authorization", `Bearer ${admin}`)
      .send({ status: "APPROVED" })
      .expect(200);

    const found = await request(app).get("/api/businesses?q=Dhaba").expect(200);
    expect(found.body).toHaveLength(1);

    await request(app).post(`/api/businesses/${created.body.id}/reviews`).set(auth).send({ rating: 4 }).expect(400);
    await request(app)
      .post(`/api/businesses/${created.body.id}/reviews`)
      .set({ Authorization: `Bearer ${provider}` })
      .send({ rating: 4, comment: "Tasty" })
      .expect(201);
    const detail = await request(app).get(`/api/businesses/${created.body.id}`).expect(200);
    expect(detail.body.reviewCount).toBe(1);
    expect(detail.body.rating).toBe(4);
  });

  it("registers a new provider pending verification", async () => {
    const token = await login("7000000009");
    const [cat] = (await request(app).get("/api/categories")).body;
    const res = await request(app)
      .post("/api/provider/register")
      .set({ Authorization: `Bearer ${token}` })
      .send({ city: "Pune", experienceYears: 3, categoryIds: [cat.id] })
      .expect(201);
    expect(res.body.profile.isVerified).toBe(false);
    const jobs = await request(app).get("/api/provider/jobs").set({ Authorization: `Bearer ${res.body.token}` });
    expect(jobs.status).toBe(200);
  });
});
