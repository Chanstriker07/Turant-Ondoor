# Turant Ondoor

Home services (Urban Company-style) and a local business directory (Justdial-style) in one app.

| Folder     | What it is                                       | Stack                                     |
| ---------- | ------------------------------------------------ | ----------------------------------------- |
| `backend/` | REST API                                         | Node, Express 5, TypeScript, Prisma, JWT  |
| `mobile/`  | Customer and professional app (Android/iOS/web)  | Expo (React Native) + Expo Router         |
| `admin/`   | Web admin panel                                  | React, Vite, TypeScript                   |

## Features

**Customers (mobile)**
- Phone OTP login
- Browse and search service categories and services, then book with a date, time slot and saved address
- Track booking status (placed → assigned → confirmed → in progress → completed), cancel, and rate the job
- Local business directory: categories, search, featured listings, call and WhatsApp buttons, reviews
- List your own business (it goes live after admin approval)

**Professionals (mobile)**
- Register as a professional (pick categories, city, experience)
- Availability toggle; see assigned jobs; accept, decline, start, and complete them; call the customer and get directions

**Admin (web)**
- Dashboard with totals, revenue and booking status breakdown
- Bookings: filter, search, assign a professional, change status
- Service categories and services CRUD
- Verify professionals
- Approve, reject, feature, edit and create business listings; manage listing categories
- Users (role and block/unblock) and review moderation

## Quick start

Requires Node 22+ and Docker (for the local Postgres database).

```bash
npm run db:up        # starts Postgres on localhost:5432 (docker compose)
cp backend/.env.example backend/.env
cp admin/.env.example admin/.env
cp mobile/.env.example mobile/.env
npm run setup        # installs all three apps, creates the database tables, seeds demo data
npm run api          # http://localhost:4000
npm run admin        # http://localhost:5173 (proxies /api to the API)
npm run mobile       # Expo dev server (press w for web, a for Android, or scan with Expo Go)
```

### Demo accounts

OTP login is simulated in development: no SMS is sent, and the code is always `OTP_DEV_CODE` (`123456` by default).

| Role         | Phone        |
| ------------ | ------------ |
| Admin        | `9999999999` |
| Professional | `8888888888` |
| Customer     | `7777777777` |

Any other 10-digit number creates a new customer account.

### Mobile API URL

`mobile/.env` sets `EXPO_PUBLIC_API_URL`. If unset, it uses `http://10.0.2.2:4000/api` on the Android emulator and `http://localhost:4000/api` everywhere else. On a physical phone, set it to your computer's LAN IP, e.g. `http://192.168.1.10:4000/api`.

## Checks

```bash
npm test         # backend API tests (Vitest + Supertest, isolated SQLite DB)
npm run check    # typecheck/lint/build for all apps
```

## Free deployment

| Part | Host | Notes |
| --- | --- | --- |
| Database | [Neon](https://neon.tech) free Postgres | Use the direct (non-pooled) connection string as `DATABASE_URL`. |
| API | [Render](https://render.com) free web service | `render.yaml` defines it. Sleeps after ~15 min idle; first request then takes ~1 min. |
| Admin panel | Cloudflare Pages | `cd admin && VITE_API_URL=https://<api>/api npm run build`, deploy `admin/dist`. |
| Mobile web | Cloudflare Pages | `cd mobile && EXPO_PUBLIC_API_URL=https://<api>/api npx expo export -p web`, deploy `mobile/dist`. |

After the first API deploy, seed demo data once from your machine with `DATABASE_URL=<neon url> npm --prefix backend run db:seed` (this wipes existing data).

## Going to production

- **Database:** any Postgres works; set `DATABASE_URL`. Backend tests use `TEST_DATABASE_URL` (default: the `turant_test` database on the local Postgres).
- **Secrets:** set a strong `JWT_SECRET` and remove `OTP_DEV_CODE`.
- **SMS:** plug an SMS provider (MSG91, Twilio, etc.) into `backend/src/lib/otp.ts`.
- **Payments:** bookings are pay-after-service (cash/UPI). `paymentMethod` and `paymentStatus` on `Booking` are ready for a gateway such as Razorpay.
- **Mobile builds:** use EAS (`npx eas build`). The app id is `com.turantondoor.app`.
