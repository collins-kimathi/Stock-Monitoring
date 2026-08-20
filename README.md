# Dekar SmartPOS + Inventory System

A modern React inventory and sales interface for **Dekar Cyber and Stationaries Limited**, backed by an Express + PostgreSQL (Supabase) API.

## Architecture

```
stock-monitor/
├── frontend/                # React (Vite) UI — unchanged Dekar SmartPOS components
│   └── src/
│       ├── api/client.js    # fetch wrappers to the Express backend
│       ├── hooks/           # useInventoryData() loads products/services/sales
│       └── App.jsx          # dashboard + routing, now backed by the API
│
├── server/                  # Express + pg (PostgreSQL) backend
│   └── src/
│       ├── routes/          # products, services, sales, dashboard
│       ├── controllers/     # request handling + snake_case → camelCase mapping
│       ├── services/        # stockService.js — atomic, negative-stock-safe sales
│       ├── middleware/      # centralized error handling
│       └── db.js            # pg Pool connection (from DATABASE_URL)
│
└── database/
    └── schema.sql           # products / services / sales tables (+ seed services)
```

## Features

- Dashboard with revenue, sales, inventory value, and low-stock alerts
- Product inventory management (categories: Books / Stationery / Printing / Cyber / Office)
- Fast sales screen with receipt preview
- Cyber services sales tracking
- Reports for best sellers, profit, stock, and expenses
- **Persistent data**: all reads/writes go through the Express API to Postgres
- **Concurrency-safe stock**: a sale decrements stock inside a DB transaction and refuses to let quantity go negative

## Data model

- **products** — `id, name, sku, category, unit, quantity, reorder_level, buying_price, selling_price, created_at, updated_at`
- **services** — `id, name, category, unit, price, created_at`
- **sales** — `id, type (product|service), product_id, item_name, quantity, unit_price, cost_price, total (computed), payment_method, staff_id, created_at`

`sales` is the single audit trail for both product and service sales; low-stock is computed as `quantity <= reorder_level`.

## Setup

### 1. Database (Supabase or any Postgres 13+)

1. Create a project at [supabase.com](https://supabase.com) (or use any Postgres host).
2. Open the **SQL editor** and paste the contents of [`database/schema.sql`](database/schema.sql), then run it.
3. Copy the Postgres connection string: **Project Settings → Database → Connection string**.

### 2. Backend

```bash
cd server
cp .env.example .env      # fill in DATABASE_URL (and PORT / CORS_ORIGIN if needed)
```

Install and run:

```bash
npm.cmd install --prefix server
npm.cmd run dev --prefix server
```

Backend API: `http://localhost:4000`
- `GET /api/health` — connectivity + DB check
- `GET|POST /api/products`, `PATCH|DELETE /api/products/:id`, `GET /api/products/low-stock`
- `GET|POST /api/services`
- `GET|POST /api/sales` (POST decrements stock atomically; 400 if it would go negative)
- `GET /api/dashboard`

### 3. Frontend

```bash
cd frontend
cp .env.example .env      # set VITE_API_URL=http://localhost:4000
```

Install and run:

```bash
npm.cmd install --prefix frontend
npm.cmd run dev
```

Frontend: `http://localhost:5173`

Both processes must run for data to persist. With the backend running, the topbar shows **MySQL connected** (the status pill flips away from "Frontend only").

## Production

- **Frontend** → Vercel / Netlify (set `VITE_API_URL` to the deployed API)
- **Backend** → Render / Railway (set `DATABASE_URL`, `CORS_ORIGIN` to your frontend origin, and enable SSL)
- **Database** → hosted Supabase Postgres (already where your schema lives)

## Next-phase ideas

- **Auth** (Supabase Auth) — log staff in and record `staff_id` on every sale (field already exists)
- **Suppliers / schools** as linked records for stock-in / stock-out workflows
- **Email alerts** (Resend / SendGrid) when stock crosses `reorder_level`
- **Category-aware filtering** and reports across all product categories
