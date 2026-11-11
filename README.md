# 🌿 AuraPure Nutrition — Premium D2C E-Commerce Platform

A production-ready, full-stack **MERN** D2C e-commerce platform built for the Indian market, inspired by the minimalist elegance and functional wellness standards of leading health brands (Earthful, Apple, Stripe).

---

## 1. Primary Technology Stack

- **Frontend Customer Storefront**: React.js 18, Vite, TypeScript, Tailwind CSS, React Router 7, TanStack Query, React Hook Form, Zod, Axios, Lucide React.
- **Frontend Admin Portal**: React.js 18, Vite, TypeScript, Tailwind CSS, React Router 7, TanStack Query, Axios, Lucide React.
- **Backend API Server**: Node.js, Express.js, TypeScript, Mongoose ODM, Zod request validation, JWT authentication with HttpOnly refresh token rotation, PDFKit invoice generation.
- **Database**: MongoDB 7.0 / MongoDB Atlas with multi-document ACID replica-set transactions.
- **Third-Party Integrations**:
  - **Razorpay**: Official payment gateway with HMAC SHA256 cryptographic signature validation & idempotent webhooks.
  - **Meta WhatsApp Business Cloud API**: Automated message templates (Order Confirmation, Shipping Tracking, Delivery).
  - **Shiprocket**: Indian PIN code serviceability, rate calculations, AWB assignment & tracking updates.
  - **Cloudinary**: Media CDN storage & WebP compression.
  - **Nodemailer SMTP**: Transactional emails with attached GST tax invoice PDFs.
- **DevOps & Infrastructure**: Docker, Docker Compose, Nginx reverse proxy, Cloudflare CDN.

---

## 2. Monorepo Structure

```
d:/Health & Nutrition E-Commerce/
├── backend/                  # Node.js + Express + TypeScript API Server
│   ├── src/
│   │   ├── config/           # Database, env validation, third-party SDKs
│   │   ├── middleware/       # JWT auth, RBAC, rate-limiting, error handling
│   │   ├── models/           # All 22 Mongoose schemas & indexes
│   │   ├── modules/          # Auth, Products, Cart, Orders, Admin, etc.
│   │   ├── integrations/     # Razorpay, WhatsApp, Shiprocket, PDFKit
│   │   ├── seeds/            # Realistic catalog database seeder
│   │   ├── app.ts            # Express application configuration
│   │   └── server.ts         # Server bootstrap & graceful shutdown
│   └── tests/                # Automated Vitest test suite
├── frontend-customer/        # Storefront Single Page Application (Port 3000)
│   ├── src/
│   │   ├── components/       # Reusable design tokens, cards, drawers, modals
│   │   ├── context/          # AuthContext, CartContext, WishlistContext
│   │   ├── pages/            # PDP, Collections, Cart, Checkout, Account
│   │   └── services/         # Axios client with automatic token rotation
├── frontend-admin/           # Separate Admin Portal (Port 3001)
│   ├── src/
│   │   ├── components/       # Layout, Metrics, Data tables
│   │   ├── pages/            # Dashboard, Orders, Catalog, Inventory, Coupons
│   │   └── services/         # Admin API client
├── docker/                   # Dockerfiles & Nginx reverse proxy config
├── scripts/                  # Automated MongoDB backup and restore scripts
├── docker-compose.yml        # Multi-container orchestration
├── .env.example              # Environment variables template
└── README.md
```

---

## 3. Database Architecture (All 22 Collections)

| Collection | Description |
| :--- | :--- |
| `users` | Customer & administrator accounts with bcrypt password hashes & refresh hashes. |
| `roles` | RBAC roles (`customer`, `admin`, `inventory_manager`, `support`). |
| `addresses` | Customer address book with Indian 6-digit PIN codes & default flags. |
| `categories` | Product hierarchy with SEO slugs and promotion badges. |
| `products` | Clean-label plant formulations with benefits, certifications & nutrition tables. |
| `productVariants` | SKUs, flavor variations, pack sizes (500g, 1kg), MRP & selling prices. |
| `inventory` | Atomic stock on hand, reserved stock, and low-stock alerts. |
| `inventoryTransactions` | Audit ledger for holds, commitments, restocks, and damage write-offs. |
| `carts` | Persistent authenticated and guest shopping carts with TTL auto-expiry. |
| `wishlists` | Customer saved items with quick move-to-bag capabilities. |
| `orders` | Authoritative order snapshots with item snapshots and financial totals. |
| `payments` | Razorpay payment orders, payment IDs, signatures & webhook audit trails. |
| `refunds` | Payment refund records and authorization tracking. |
| `coupons` | Discount engine supporting Flat (₹) and Percentage (%) discounts with caps. |
| `couponUsages` | Redemptions tracker enforcing per-user and total campaign limits. |
| `shipments` | Shiprocket shipment IDs, AWBs, couriers, and live tracking checkpoints. |
| `invoices` | Sequential GST tax invoices (`INV-2026-XXXX`) with PDF records. |
| `reviews` | Customer product ratings, comments, and verified buyer badges. |
| `notifications` | Asynchronous WhatsApp, Email, and SMS dispatch log. |
| `banners` | Dynamic homepage hero and promotional banner ribbon controls. |
| `faqs` | Searchable product and shipping FAQs. |
| `auditLogs` | Administrator action log recording state changes and diffs. |

---

## 4. Quick Start & Local Development

### Prerequisites
- Node.js v20+ or v22+
- MongoDB 7.0 running locally or MongoDB Atlas connection URI

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Seed Database
Run the seed script to populate realistic Indian wellness products:
```bash
cd backend
npx tsx src/seeds/seed.ts
```
*Seeds:*
- Admin account: `admin@aurapure.in` / `Admin@AuraPure2026`
- Demo customer: `customer@aurapure.in` / `Customer@2026`
- Formulations: Belgian Dark Chocolate Plant Protein, Madagascar Vanilla Bean, 100% Raw Unflavored, Ayurvedic Golden Turmeric Super-Elixir, Daily Greens & Superfoods.
- Coupons: `AURAPURE10` (10% off), `WELCOME200` (₹200 off above ₹1,499).

### 3. Run Applications
- **Backend API**:
  ```bash
  npm --workspace=backend run dev
  # Server listening on http://localhost:5000
  ```
- **Customer Storefront**:
  ```bash
  npm --workspace=frontend-customer run dev
  # Open in browser: http://localhost:3000
  ```
- **Admin Dashboard**:
  ```bash
  npm --workspace=frontend-admin run dev
  # Open in browser: http://localhost:3001
  ```

---

## 5. Automated Tests

Execute the Vitest suite:
```bash
cd backend
npm test
```
Tests verify:
- Currency conversion between Rupees and minor paise units.
- 18% GST calculation (intra-state CGST/SGST vs inter-state IGST).
- Health check API status.
- API index route.
- 404 route handling.
- Zod schema validation errors.

---

## 6. Docker & Production VPS Deployment

Run the complete stack with Docker Compose:
```bash
docker-compose up --build -d
```
Containers started:
- `aurapure-mongodb`: Database on port `27017`
- `aurapure-backend`: Express API on port `5000`
- `aurapure-customer`: Storefront on port `80` (mapped via Nginx)
- `aurapure-admin`: Admin portal on port `80` (mapped via Nginx `/admin`)
- `aurapure-nginx`: Reverse proxy on ports `80` and `443`

---

## 7. Production Launch Checklist

- [x] Strict MERN technology compliance (no Spring Boot, Postgres, or PHP).
- [x] Zero trust frontend pricing: all subtotals, GST, discounts, and shipping computed server-side.
- [x] Multi-document ACID replica set transactions for inventory reservation.
- [x] Cryptographic Razorpay payment verification with HMAC SHA-256.
- [x] Meta WhatsApp Cloud API template integration for order updates.
- [x] Shiprocket PIN code serviceability verification and AWB dispatch.
- [x] PDFKit automated GST tax invoice generation.
- [x] Independent Customer Storefront and separate Admin Dashboard.
- [x] Responsive on mobile (360px, 390px, 430px), tablets (768px), and desktops.
- [x] Automated test suite passing with Vitest.
- [x] Security headers with Helmet, CORS allowlist, and rate limiting.
