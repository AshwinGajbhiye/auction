# CampusLoop — College-Only Buy, Sell & Timed Auction Marketplace

CampusLoop is a production-grade, mobile-responsive student marketplace and timed-auction platform designed for college campuses. It bridges trust, locality, and speed by verifying student `.edu` domains and providing real-time bidding, structured counter-offer negotiations, and instant buyer-seller messaging.

---

## 🌟 Key Features

* **Campus Isolation & Student Verification**: Strict `.edu` / approved email domain onboarding per campus.
* **Fixed-Price Marketplace**: Browse items with rich filters (condition, price range, college categories), pickup spot details, and full-text search.
* **Negotiation Engine**: Structured offers and counter-offers with 48-hour expirations and automatic status transitions.
* **Timed Competitive Auctions**: Live bidding with real-time Socket.IO room broadcasts, row-level concurrency locks (`SELECT FOR UPDATE`), and anti-sniping dynamic time extensions (5-minute extensions for last-minute bids).
* **Automated Auction Worker**: Background `node-cron` worker automatically closes expired auctions and transitions scheduled ones.
* **Real-Time Campus Chat**: Instant 1-on-1 buyer-seller messaging powered by Socket.IO with unread indicators and read receipts.
* **Deals & Handshake Flow**: Purchase request confirmation workflow, handoff completion, and post-transaction 5-star ratings & reviews.
* **Moderation & Admin Panel**: Listing moderation, report queues, user status controls, and audit logging.

---

## 🏗️ Architecture & Monorepo Layout

Built with an `npm workspaces` monorepo structure:

```
ebayclone/
├── packages/
│   └── shared/       # Shared Zod schemas, TypeScript types, and enums (@campusloop/shared)
├── apps/
│   ├── api/          # Node.js + Express + Prisma + PostgreSQL + Socket.IO + node-cron (Port 4000)
│   └── web/          # Vite + React 18 + TypeScript + Tailwind CSS + TanStack Query (Port 5173)
├── docker-compose.yml # PostgreSQL 16 on port 5434
├── .env.example      # Environment variable template
└── package.json      # Workspaces root
```

---

## 🚀 Quick Start

### 1. Prerequisites
* **Node.js**: `v20+` (tested on Node v22.22.0)
* **npm**: `v10+`
* **Docker & Docker Compose** (for PostgreSQL)

### 2. Start PostgreSQL Database
```bash
docker compose up -d
```
*Port mapped: `5434` (to avoid conflicts with default `5432`).*

### 3. Setup Environment Variables
```bash
cp .env.example .env
cp .env.example apps/api/.env
```
Ensure `DATABASE_URL` is set to:
```env
DATABASE_URL="postgresql://campusloop:campusloop_dev@localhost:5434/campusloop?schema=public"
```

### 4. Install Dependencies & Build Shared Package
```bash
npm install
npm run build --workspace=packages/shared
```

### 5. Push Schema & Seed Database
```bash
npx prisma db push --schema=apps/api/prisma/schema.prisma
npm run seed --workspace=apps/api
```

### 6. Run Development Servers
In separate terminals:
```bash
# Terminal 1: Backend API & Socket.IO server (http://localhost:4000)
npm run dev --workspace=apps/api

# Terminal 2: Frontend Web App (http://localhost:5173)
npm run dev --workspace=apps/web
```

---

## 🧪 Testing

CampusLoop includes automated unit and integration tests powered by **Vitest**:

```bash
# Run all tests across the API
npm test --workspace=apps/api
```

### Test Coverage (21/21 passing):
* **Auth Service** (`auth.service.test.ts`): Domain validation, Argon2id verification, conflict handling.
* **Auctions Service** (`auctions.service.test.ts`): Self-bid rejection, minimum increment enforcement, concurrency checks.
* **Offers Service** (`offers.service.test.ts`): Negotiation state machine, counter-offer logic, reservation on acceptance.
* **Purchases Service** (`purchases.service.test.ts`): Purchase lifecycle, double-sale prevention, two-party exchange confirmation.
* **Conversations Service** (`conversations.service.test.ts`): Chat initialization, message delivery, read status tracking.

---

## 👥 Demo Accounts

You can log in to `http://localhost:5173/login` using any of these seeded demo accounts:

| Role | Email | Password | College Domain |
|---|---|---|---|
| **Admin** | `admin@campusloop.dev` | `Admin@123456` | Platform-wide |
| **Moderator** | `mod@demo.edu` | `Mod@123456` | `demo.edu` |
| **Seller** | `bob@student.demo.edu` | `Student@123456` | `student.demo.edu` |
| **Buyer** | `carol@student.demo.edu` | `Student@123456` | `student.demo.edu` |

---

## 📦 Production Build

To verify full monorepo compilation and asset optimization:

```bash
npm run build
```
Generates clean type definitions and optimized Vite bundles ready for deployment.
