# CLAUDE.md — Simple Concepts Mobile Shopping App

This file gives Claude (and any developer) the context, rules and conventions for this project.
Read it fully before writing or changing code.

---

## 1. Project Overview

**Company:** Simple Concepts
**Business:** Sells CCTV cameras and surveillance solutions for:
- **Home** surveillance (indoor/outdoor cameras, doorbell cameras, baby monitors)
- **Building** surveillance (offices, apartments, shops, warehouses — DVR/NVR systems, dome/bullet/PTZ cameras)
- **Land / site** surveillance (farms, plots, construction sites — solar/4G cameras, long-range cameras)
- **Supporting devices** (DVR/NVR, hard disks, cables, connectors, power supplies, mounts, routers)
- **Smart home products** (smart locks, smart plugs, sensors, alarms, video door phones, smart lighting)

**App purpose:** A product-selling (e-commerce) mobile app.
- **Customers** install the app, browse products, add to cart, and place orders.
- **Payment:** Phase 1 = **Cash on Delivery (COD) only**. Phase 2 = online payment (UPI / cards / netbanking via a gateway such as Razorpay).
- **Shop owner (Admin)** logs in with an admin account to add/edit products, set prices and stock, and manage orders.

---

## 2. Tech Stack

> Change these only with the project owner's approval. If you change one, update this section.

| Layer | Choice |
|---|---|
| Mobile app | **React Native with Expo**, **TypeScript** (Android first, iOS supported) |
| Navigation | Expo Router (file-based routing) |
| State / data fetching | TanStack Query (server state) + Zustand (cart, local UI state) |
| Forms & validation | React Hook Form + Zod |
| UI | **NativeWind** (Tailwind for RN) |
| Backend API | **Node.js + NestJS** (TypeScript), REST JSON API |
| Database | **PostgreSQL** with **Prisma** ORM |
| Auth | Phone number + OTP for customers; email/phone + password for admin; JWT access + refresh tokens |
| Image storage | Cloud object storage (AWS S3 / Cloudinary); store only URLs in the DB |
| Push notifications | Expo Notifications (FCM for Android) |
| Payments (Phase 2) | Razorpay (UPI, cards, netbanking, wallets) behind a payment-provider interface |
| Testing | Jest + React Native Testing Library (app); Jest + Supertest (API) |
| Lint / format | ESLint + Prettier, strict TypeScript |

Version notes:
- Prisma is pinned to stable `7.10.1` because npm's `latest` tag currently points to an `8.0.0` release candidate. Don't upgrade to a pre-release.
- NativeWind stays on stable v4 with Tailwind CSS v3.
- Install mobile packages with `npx expo install` so they match the Expo SDK.

---

## 3. Repository Structure

```
/
├── CLAUDE.md
├── apps/
│   ├── mobile/                 # Expo React Native app (customer + admin screens)
│   │   ├── app/                # Expo Router routes
│   │   │   ├── (auth)/         # sign-in, sign-up (phone + OTP)
│   │   │   ├── (customer)/     # tabs (home, categories, search, cart, account), product, checkout,
│   │   │   │                   # orders, notifications, profile, addresses, feedback, review
│   │   │   └── admin/          # URL /admin: login.tsx, (panel)/ = products list, products/new,
│   │   │                       # products/[id], orders, orders/[id], feedback
│   │   ├── components/         # reusable UI components
│   │   ├── features/           # feature modules (cart, catalog, account, orders, feedback, auth, admin)
│   │   ├── lib/                # api client, storage, utils, formatters
│   │   ├── hooks/
│   │   ├── constants/          # theme, config
│   │   └── types/
│   └── api/                    # NestJS backend
│       ├── src/
│       │   ├── auth/           # admin password login, customer OTP (otp-sender.ts), guards
│       │   ├── account/        # /me: profile, addresses, account deletion
│       │   ├── products/
│       │   ├── categories/
│       │   ├── cart/
│       │   ├── orders/         # order-status.ts (allowed transitions), order-pricing.ts
│       │   ├── payments/       # PaymentProvider interface: CodProvider now, RazorpayProvider later
│       │   ├── feedback/       # shop feedback and product reviews
│       │   ├── uploads/
│       │   └── notifications/  # in-app notifications (push later)
│       └── prisma/
│           ├── schema.prisma
│           └── seed.ts
└── packages/
    └── shared/                 # shared TypeScript types and Zod schemas (app + api)
```

---

## 4. User Roles

| Role | Access |
|---|---|
| `CUSTOMER` | Browse, search, cart, place orders, view own orders, cancel before dispatch, manage addresses/profile |
| `ADMIN` (shop owner) | Everything a customer can do **plus** manage products, categories, prices, stock, images, orders, order status, customers, and view the sales dashboard |

Rules:
- Admin screens live under `app/admin/` (URL `/admin`, so the owner can bookmark it) and are only reachable when the logged-in user's role is `ADMIN`.
- **Never trust the app for authorization.** Every admin API endpoint must check the role on the server (NestJS `RolesGuard`).
- Admin accounts are **not** self-registered. The first admin is created by the seed script / CLI; admins can be added only by an existing admin.
- Admin accounts cannot sign in with OTP; they use the admin password login.

---

## 5. Features

### 5.1 Customer app (Phase 1)
- **Onboarding & login:** phone number + OTP, with separate sign-up (name + phone) and sign-in screens. Guest browsing allowed; login required at checkout.
- **Home screen:** banners/offers, category tiles (Home, Building, Land, Supporting Devices, Smart Home), featured and new products.
- **Category & product list:** filter (category, brand, price range, resolution, indoor/outdoor, wired/wireless), sort (price, newest, popular), search.
- **Product detail:** image gallery, name, brand, model number, price, MRP + discount %, stock status, key specs (resolution, night vision range, storage, connectivity, power, warranty), description, ratings and reviews, "Add to cart" / "Buy now".
- **Cart:** change quantity, remove, show subtotal, delivery charge, total.
- **Checkout:** select/add delivery address (name, phone, house/street, area, city, state, **PIN code**), order summary, payment method = **Cash on Delivery**, place order.
- **Order confirmation:** order number, summary, expected delivery.
- **My Orders:** list + detail with status timeline; cancel allowed while status is `PLACED` or `CONFIRMED`.
- **Notifications:** in-app list of order updates with an unread badge on the Account tab.
- **Feedback:** shop feedback form (1–5 stars + message), optionally about one delivered order; product reviews (one per customer per product).
- **Profile:** name, phone, email, saved addresses, logout, delete account.
- **Optional:** "Request installation" checkbox per order (CCTV customers often need installation) and a "Call / WhatsApp us" support button.

### 5.2 Admin panel (Phase 1, inside the same app)
- **Dashboard:** today's orders, pending orders, total sales (day/week/month), low-stock alerts.
- **Products:** list, search, add, edit, deactivate (soft delete). Fields: name, category, brand, model, SKU, description, specs (key–value), **price (selling)**, **MRP**, **cost price** (admin only, never sent to customers), stock quantity, images (multiple upload), active/inactive, featured flag.
- **Categories:** add/edit/reorder categories and sub-categories, with an image/icon.
- **Orders:** list with filters by status/date; order detail; update status; add a note; call customer.
- **Feedback:** read customer feedback.
- **Customers:** list, view order history.
- **Banners/Offers:** add/remove home-screen banners.

### 5.3 Phase 2 (later — design for it now, don't build it yet)
- Online payment (Razorpay: UPI, cards, netbanking, wallets) alongside COD.
- Refunds for cancelled prepaid orders.
- Coupons / discount codes.
- ~~Product reviews and ratings.~~ Brought into Phase 1 by the owner on 2026-11-27, along with a shop feedback form.
- Installation service booking and technician assignment.
- Invoices with GST (PDF download).
- Web-based admin panel (if the owner prefers desktop).
- Delivery partner / courier tracking integration.

---

## 6. Order & Payment Rules

### Order status flow
```
PLACED → CONFIRMED → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
   ↘ CANCELLED (by customer before PACKED, or by admin at any point before DELIVERED)
DELIVERED → RETURN_REQUESTED → RETURNED (Phase 2)
```
- Only the server changes order status; validate allowed transitions in one place (`orders/order-status.ts`).
- Every status change is logged in an `OrderStatusHistory` table (who, when, note).
- Every status change creates an in-app notification for the customer. An admin's note is included in it; a customer's own cancel reason is not echoed back.

### Payment design (important)
- Model payment separately from orders: an `Order` has a `Payment` record with `method` (`COD`, `ONLINE`) and `status` (`PENDING`, `PAID`, `FAILED`, `REFUNDED`).
- **COD:** payment status stays `PENDING` until the admin marks the order `DELIVERED`, which sets payment to `PAID`.
- Implement payments behind a `PaymentProvider` interface (`createPayment`, `onDelivered`, `refund`). Phase 1 ships only `CodProvider`. Phase 2 adds `RazorpayProvider` **without changing order logic**.
- Keep a config flag `ENABLED_PAYMENT_METHODS` (e.g. `["COD"]`) so the checkout screen shows only enabled methods. Methods without a provider are ignored.
- Phase 2: verify Razorpay payments **server-side** with signature verification and webhooks. Never mark an order paid based on the app's word alone.

### Pricing & stock
- Store money as **integers in paise** (₹1 = 100 paise). Never use floats for money.
- Display with `formatINR()` → `₹1,499.00` (Indian number grouping, e.g. `₹1,25,000`).
- **Recalculate all prices and totals on the server** when placing an order; ignore totals sent by the app.
- Save a price snapshot (name, price, quantity) in `OrderItem` so later product edits don't change old orders.
- Decrease stock when the order is placed, inside a DB transaction; put stock back on cancellation. Block orders that exceed available stock.
- **Delivery is free for now (owner's choice, 2026-11-27).** The rule lives in one place, `DELIVERY_RULE` in `packages/shared/src/orders.ts` (`flatInPaise`, `freeFromInPaise`); the server and app both read it.
- Optional COD limits (configurable): maximum COD order value, serviceable PIN codes.

---

## 7. Data Model (Prisma — starting point)

Main entities: `User`, `Address`, `Category`, `Product`, `ProductImage`, `ProductSpec`, `CartItem`, `Order`, `OrderItem`, `OrderStatusHistory`, `Payment`, `Banner`, `OtpRequest`, `Notification`, `Feedback`, `ProductReview`.

Key fields:
- `User`: id, name, phone (unique), email?, passwordHash? (admin only), role (`CUSTOMER` | `ADMIN`), isActive, createdAt
- `Product`: id, name, slug, sku (unique), brand, model, categoryId, description, priceInPaise, mrpInPaise, costPriceInPaise, stockQty, isActive, isFeatured, createdAt, updatedAt
- `Order`: id, orderNumber (human-readable, e.g. `SC-20261123-0001`), userId, addressSnapshot (JSON), subtotal, deliveryCharge, total (all paise), status, installationRequested, notes, createdAt
- `Payment`: id, orderId, method, status, amountInPaise, providerRef?, createdAt
- `Notification`: id, userId, title, body, orderId?, readAt?, createdAt
- `Feedback`: id, userId, orderId?, rating (1–5), message, createdAt
- `ProductReview`: id, productId, userId (unique together), rating (1–5), comment, createdAt, updatedAt

Use soft delete (`isActive = false`) for products. Never hard-delete products that appear in orders.
Account deletion is also soft: personal details are removed and `isActive = false`; past orders stay.

---

## 8. API Conventions

- Base path: `/api/v1`. Customer routes: `/products`, `/categories`, `/cart`, `/orders`, `/me`. Admin routes: `/admin/products`, `/admin/orders`, `/admin/categories`, `/admin/dashboard`, `/admin/uploads`, `/admin/feedback`.
- Validate every request body with Zod / class-validator DTOs.
- Response shape: `{ data, meta? }` for success, `{ error: { code, message } }` for errors. Throw with `appError(code, message)` to send a specific error code.
- Paginate lists (`?page=1&limit=20`).
- **Never include `costPriceInPaise` in customer-facing responses** — use separate customer and admin DTOs.
- Image upload (target): the app asks the API for a signed upload URL, uploads directly to storage, then saves the URL on the product.
- Image upload (now, until cloud storage is set up): the admin app posts the photo to `POST /admin/uploads/products` (multipart, field `file`). The API checks the file's bytes (JPG/PNG/WebP only, ≤ 5 MB) and saves it with `LocalImageStorage` to `apps/api/uploads/` (git-ignored), served at `/uploads/...`. Replace `LocalImageStorage` with a cloud version without changing callers.
- Sample product pictures are original SVGs in `apps/api/public/products/`, served at `/static/products/...`. The seed attaches them only to products with no photos.
- Image URLs are stored as `/static/...`, `/uploads/...` or full `https://` links. The app turns relative paths into full URLs with `resolveImageUrl()`.
- Admin product routes: `GET/POST /admin/products`, `GET/PUT /admin/products/:id`, `DELETE /admin/products/:id` (soft delete: hides from customers), `POST /admin/products/:id/restore`.
- Auth routes: `POST /auth/admin/login` (5 tries per minute), `POST /auth/otp/request`, `POST /auth/otp/verify`, `POST /auth/refresh`, `GET /auth/me`. Access tokens last 15 minutes, refresh tokens 7 days.
- Customer sign-in and sign-up share `POST /auth/otp/verify`. A number with no account and no `name` gets error code `ACCOUNT_NOT_FOUND` (the code stays valid, so the app moves to sign-up). One code per number every 30 seconds.
- Customer routes: `GET/PUT/DELETE /me` (DELETE closes the account; refused while an order is open), `GET/POST /me/addresses`, `PUT/DELETE /me/addresses/:id`, `GET /me/notifications`, `GET /me/notifications/unread-count`, `POST /me/notifications/:id/read`, `POST /me/notifications/read-all`.
- Orders: `GET /checkout/config`, `POST /orders`, `GET /orders`, `GET /orders/:id`, `POST /orders/:id/cancel`. Admin: `GET /admin/orders`, `GET /admin/orders/:id`, `POST /admin/orders/:id/status` (`{ status, note? }`; the note is shown to the customer).
- Feedback: `POST /feedback` (optional `orderId`), `GET /admin/feedback`. Reviews: `GET /products/:slug/reviews` (public), `GET/PUT/DELETE /products/:slug/reviews/me`. "Verified buyer" means the reviewer has a delivered order with that product. Reviews show the first name only.

---

## 9. Coding Rules

- TypeScript `strict` mode everywhere; no `any` unless justified in a comment.
- Functional React components with hooks; keep screens thin and move logic into `features/*` hooks.
- All API calls go through `lib/api.ts` (one configured client with auth token refresh).
- Shared types and Zod schemas live in `packages/shared` — don't duplicate them.
- Use clear names; no magic numbers (put them in constants/config).
- Handle loading, empty and error states on every screen.
- Every new feature needs tests for its business logic (pricing, stock, order status, role checks).
- Run `lint`, `typecheck` and `test` before considering a task done.
- Small, focused commits with clear messages (`feat: add product image upload for admin`).

---

## 10. UI / UX Guidelines

- Security-store look (owner's reference design, 2026-11-27): **navy `#0A1F4F`** (headers, headings, text, outline buttons), **blue `#1557E6`** (main action buttons such as Sign in, Checkout, Place order, Save — white text), **orange `#F7A21B`** (highlights: Buy now, the home hero button, badges, unread markers — navy text, never white) on a **light blue-grey background `#F3F6FB`**, with light blue `#E7EEFC` for tints. Green stays for stock, discounts, COD and completed steps. Rounded cards and pill-shaped buttons. Gradients (via `expo-linear-gradient`, defined in `constants/theme.ts` `GRADIENTS`): navy on headers, navy-to-blue on feature cards, `primary` (blue) and `action` (orange) on buttons, soft blue-grey page background. Keep text on the dark end of a gradient. Use the reference only for colours — not its name, logo or product photos.
- `Button` variants (`components/ui/buttons.tsx`): `primary` (blue), `accent` (orange), `outline`, `danger`, `dangerFill`.
- Large tap targets; works well on low-end Android phones and slow networks (cache images, show skeleton loaders).
- Prices always show ₹ with MRP struck through when discounted.
- Show "Cash on Delivery available" clearly on product and checkout screens.
- Support **English first**; keep all strings in a translation file (`i18n`) so Hindi/regional languages can be added later.
- Accessibility: labels on icons, sufficient contrast, respects system font size.

---

## 11. Security & Privacy

- Store tokens in `expo-secure-store`, never in AsyncStorage.
- Hash admin passwords with bcrypt/argon2. Rate-limit login and OTP endpoints.
- OTP: 6 digits, expires in 5 minutes, max 5 attempts. Codes are stored as keyed hashes.
- **OTP test mode (owner's choice, 2026-11-27):** until an SMS provider is connected, every number gets the fixed code `123456` and the app shows it. This only runs when `OTP_PROVIDER_KEY` is empty and `NODE_ENV` is not `production`; in production without SMS, OTP login refuses to work. Connecting SMS means filling in `sendSms()` in `auth/otp-sender.ts`.
- HTTPS only. Secrets in environment variables (`.env`, never committed). Provide `.env.example`.
- Validate and limit image uploads (type: jpg/png/webp, size ≤ 5 MB).
- Follow India's DPDP Act basics: collect only needed customer data, provide account deletion, publish a privacy policy in the app.

---

## 12. Environment & Commands

```bash
# install
npm install

# mobile app
cd apps/mobile
npx expo start            # dev server
npm run lint
npm run typecheck
npm test

# backend
cd apps/api
npx prisma migrate dev    # apply DB migrations
npx prisma db seed        # seed categories, sample products, first admin
npm run start:dev
npm test

# Android installer (EAS Build, run in apps/mobile)
npx eas-cli build --platform android --profile preview      # test APK, home Wi-Fi only
npx eas-cli build --platform android --profile tunnel       # test APK, any network via ngrok
npx eas-cli build --platform android --profile production   # Play Store bundle

# public tunnel to the local API (repo root; needs ngrok + authtoken)
npm run tunnel
```

Builds (`apps/mobile/eas.json`): the `preview` profile makes an installable APK that calls the API on this PC (`http://192.168.1.4:3000`) and sets `ALLOW_HTTP_API=true`, which `app.config.js` uses to allow plain HTTP. The `tunnel` profile calls `https://implode-reload-acuteness.ngrok-free.dev/api/v1`, the owner's free static ngrok domain (chosen 2026-11-27), which forwards to the local API; testing and demos only. The API trusts `X-Forwarded-For` only from loopback (`trust proxy` in `main.ts`), so rate limits see each caller behind the tunnel. All builds other than `preview` stay HTTPS-only. Android package id: `com.simpleconcepts.shop` (permanent once on the Play Store). Bump `android.versionCode` in `app.json` for each Play Store upload. The `eas-build-post-install` script builds `packages/shared` on the build server.

Environment variables (see `.env.example`): `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_NAME`, `ADMIN_PHONE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (first admin, created by the seed; changing them later does not reset an existing admin), `UPLOAD_DIR` (optional, default `uploads`), `OTP_PROVIDER_KEY`, `STORAGE_BUCKET`, `STORAGE_KEY`, `STORAGE_SECRET`, `ENABLED_PAYMENT_METHODS`, `EXPO_PUBLIC_API_BASE_URL` (mobile), `EXPO_PUBLIC_SHOP_PHONE` (mobile, optional: shows a "Call us" button on orders), and later `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.

---

## 13. Seed Data

Seed these categories: **Home Surveillance**, **Building Surveillance**, **Land & Site Surveillance**, **Supporting Devices** (DVR/NVR, Hard Disks, Cables & Connectors, Power Supplies, Mounts), **Smart Home** (Smart Locks, Video Door Phones, Sensors & Alarms, Smart Plugs & Lighting).
Add 2–3 sample products per category and one admin user (credentials from env variables).

---

## 14. Build Order (Phase 1 milestones)

> Order changed by the project owner on 2026-11-23: customer shop screens come first, using seeded sample products, so the app can be previewed early.

1. Project setup: monorepo, Expo app, NestJS API, Prisma schema, CI (lint + typecheck + test). **Done.**
2. Customer shop: home, category list, product detail, search & filters, and cart (on-device), with seeded sample products. **Done.**
3. Auth: admin password login, JWT access/refresh tokens, role guard, first admin seeded, customer sign-up / sign-in by phone + OTP. **Done** (OTP in test mode until SMS is connected).
4. Admin: products add/edit/hide/restore with photo upload. **Done.** Categories management, banners and the dashboard still to do.
5. Checkout with addresses and **COD**, account tab, profile, saved addresses, account deletion. **Done.** Syncing the cart to the server is still to do.
6. Orders: customer order history and tracking timeline, cancel before packing; admin order list and status updates with a note. **Done.** Admin date filter and customers list still to do.
7. Notifications: in-app notifications for every order status, with an unread badge. **Done.** Push notifications (Expo / FCM) and the admin new-order alert still to do.
   - Feedback: shop feedback (optionally per order, read at `/admin/feedback`) and product reviews. **Done** (added by the owner on 2026-11-27).
8. Admin dashboard and low-stock alerts.
9. Testing, performance pass, Play Store release (then App Store).

Current shop notes:
- Seeded brands, models and prices are **placeholders**. Replace them before release.
- Sample products show original sample pictures. The admin can replace them with real photos at `/admin`.
- In the web preview, a login (customer or admin) lasts until the page reloads (browsers have no secure storage). On phones it is kept in `expo-secure-store`. Customers and the admin share one session slot, so logging in as one signs out the other.
- The cart lives in memory (Zustand) and clears when the app reloads.
- Delivery is free for now (see §6 Pricing & stock).
- Order numbers look like `SC-20261127-0001` (Indian date, daily counter).
- The "Call us" button is hidden until `EXPO_PUBLIC_SHOP_PHONE` is set.

---

## 15. Instructions for Claude

- Follow this file's stack, structure and rules. Ask before adding new major dependencies.
- Keep Phase 2 in mind (especially online payment) but **don't build Phase 2 features unless asked**.
- When a requirement is unclear (pricing, delivery charges, return policy, serviceable areas), ask the project owner instead of guessing.
- Update this CLAUDE.md when decisions change (stack, status flow, new modules).
