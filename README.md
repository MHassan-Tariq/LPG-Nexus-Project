## Cylinder Management Dashboard

This project implements the LPG Nexus cylinder management dashboard using **Next.js 14**, **TypeScript**, **Tailwind + shadcn/ui**, and a **PostgreSQL** backend managed through Prisma. It mirrors the provided Figma layout with:

- Real-time cylinder inventory search with server-side pagination (`/api/cylinders`).
- Operational analytics (status doughnut, six-month usage trends, maintenance watchlist) rendered with Chart.js.
- Structured CRUD flows powered by React Hook Form + Zod.
- OTP workflows via Nodemailer and PDF export via React PDF.

---

## Prerequisites

- Node.js 18+ and npm.
- PostgreSQL instance accessible to the app (local or remote).

---

## 1. Environment variables

Copy the template and update the placeholders with your database and SMTP credentials:

```bash
cp .env.example .env
```

Required keys:

- `DATABASE_URL` – PostgreSQL connection string.
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM` – SMTP settings for OTP delivery.

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Database bootstrap

Push the Prisma schema and optionally load the starter data:

```bash
npm run db:push      # creates tables based on prisma/schema.prisma
npm run db:seed      # optional: loads demo cylinders, customers and transactions
```

> The schema and seed data live under `prisma/`.

---

## 4. Run the app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to interact with the dashboard.

---

## Project structure

- `src/app/page.tsx` – dashboard composition (layout, data fetching).
- `src/app/api/**` – REST endpoints (cylinders, customers, transactions, OTP, reports).
- `src/components/dashboard/**` – UI modules mapped from the Figma design.
- `src/lib/**` – Prisma client, OTP helpers, validators, mailer utilities.
- `prisma/schema.prisma` – relational data model with seed script.

---

## Available scripts

| Command            | Description                                |
| ------------------ | ------------------------------------------ |
| `npm run dev`      | Start Next.js in development mode          |
| `npm run build`    | Create production build                    |
| `npm run start`    | Serve the production build                 |
| `npm run lint`     | Run ESLint (core web vitals rules)         |
| `npm run db:push`  | Apply Prisma schema to the database        |
| `npm run db:seed`  | Seed demo data (uses `prisma/seed.ts`)     |
| `npm run db:generate` | Regenerate Prisma client               |

---

## API quick reference

- `GET /api/cylinders?page=1&pageSize=10&q=search` – paginated inventory.
- `POST /api/cylinders` – create cylinder (React Hook Form payload).
- `GET /api/transactions?type=ISSUE` – filtered movement history.
- `POST /api/otp/request` & `POST /api/otp/verify` – OTP lifecycle.
- `GET /api/reports/pdf` – server generated PDF snapshot.

All endpoints rely on the PostgreSQL database through Prisma, so ensure migrations are applied before hitting them.

---

## Testing & validation

- `npm run lint` validates TypeScript + React rules.
- Charts and dashboards use live data; seed the database to visualise the complete layout.
- OTP emailing requires working SMTP credentials; otherwise the UI will show warnings but continue gracefully.
# LPG-Nexus-Project
