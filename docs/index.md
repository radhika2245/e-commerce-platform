# Nebula — E-Commerce Platform

Production-grade Indian e-commerce store built with React + Vite (frontend) and Express (backend). Features 3D visuals, JWT auth, Stripe payments, admin panel, wishlist, and server-synced cart — all backed by JSON file storage.

---

## Tech Stack

| Layer       | Technology                                                           |
|-------------|----------------------------------------------------------------------|
| 3D Graphics | @react-three/fiber, @react-three/drei, Three.js                    |
| Storage     | JSON files (`server/src/data/`)                                     |
| Auth        | JWT (Bearer token in localStorage)         |
| Payments    | Stripe (primary)               |

---

## Getting Started

### Prerequisites
- Node.js >= 18
- npm

### Setup

```bash
# 1. Install all dependencies
npm run install:all

# 2. Configure environment
cp server/.env.example server/.env

# 3. Set client env

# 4. Run both server + client in dev mode
npm run dev
```

Server runs on `http://localhost:5000`, client on `http://localhost:5173` with API proxy.

### Production Build

```bash
npm run build        # builds client
NODE_ENV=production npm start   # starts server serving built client
```

---

## Project Structure

```
caliculater/
├── package.json                  # Root scripts (dev, build, start)
├── client/                       # React frontend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env                      # Client env vars
│   └── src/
│       ├── main.jsx              # Entry point (BrowserRouter)
│       ├── App.jsx               # Routes, providers, layout
│       ├── assets/               # (empty — images are external URLs)
│       ├── components/           # Shared UI components
│       │   ├── Navbar.jsx
│       │   ├── Footer.jsx
│       │   ├── ProductCard.jsx
│       │   ├── ProductSkeleton.jsx
│       │   ├── CartItem.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── PageWrapper.jsx
│       │   ├── PageErrorBoundary.jsx
│       │   └── ThreeDScene.jsx
│       ├── context/              # React context providers
│       │   ├── AuthContext.jsx
│       │   ├── CartContext.jsx
│       │   ├── WishlistContext.jsx
│       │   └── ToastContext.jsx
│       ├── pages/                # Route pages
│       │   ├── Home.jsx
│       │   ├── Products.jsx
│       │   ├── ProductDetail.jsx
│       │   ├── Cart.jsx
│       │   ├── Wishlist.jsx
│       │   ├── Checkout.jsx
│       │   ├── OrderHistory.jsx
│       │   ├── Profile.jsx
│       │   ├── Admin.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   └── NotFound.jsx
│       ├── utils/
│       │   └── formatINR.js      # Indian number formatting
│       └── styles/
│           └── App.css           # All styles (~3500 lines)
└── server/                       # Express backend
    ├── package.json
    ├── .env / .env.example
    └── src/
        ├── index.js              # Server entry, middleware, routes
        ├── config/
        │   └── db.js             # JSON file read/write (atomic writes)
        ├── middleware/
        │   └── auth.js           # JWT token generation & verification
        ├── routes/               # Express routers
        │   ├── auth.js           # POST /register, /login; GET/PUT /profile; PUT /password
        │   ├── products.js       # GET /, /brands, /:id
        │   ├── orders.js         # POST /, GET /, GET /:id
        │   ├── cart.js           # GET /, PUT /
        │   ├── admin.js          # GET /dashboard, /orders; CRUD products
        │   ├── payment.js        # POST /create-payment-intent (Stripe)
        ├── controllers/          # Route handlers
        │   ├── authController.js
        │   ├── productController.js
        │   ├── orderController.js
        │   ├── adminController.js
        │   ├── paymentController.js
        └── data/                 # JSON file storage
            ├── products.json     # 30 products
            ├── users.json        # Registered users
            ├── orders.json       # Order history
            └── carts.json        # Per-user cart items
```

---

## Server Architecture

### Entry Point (`server/src/index.js`)

The server is a standard Express app with layered middleware:

1. **Security layer**: helmet (CSP, HSTS, XSS, frameguard, referrer), hpp (query param pollution prevention), CORS (strict origin + credentials)
2. **Performance**: compression (level 6, threshold 1KB), etag (strong), morgan logging
3. **Input limits**: JSON body 16KB, URL-encoded 8KB
4. **Input sanitization**: Strips `<>` chars; blocks `$where`/prototype pollution
5. **Timeout**: 15s request timeout → 503
6. **Cache control**: API routes get `no-store`; health endpoint gets short public cache
7. **Rate limiting**: 4 tiers — auth (10req/15min), social (20req/hr), sensitive (60req/15min), general (300req/15min)
8. **Routes**: 8 route modules mounted on `/api/*`
9. **Error handling**: 404 catch-all → JSON; global error handler (hides internal details in production)
10. **Graceful shutdown**: SIGTERM/SIGINT handlers, uncaughtException/unhandledRejection logging

### Config (`server/src/config/db.js`)

- `readJSON(file)` — reads from `server/src/data/`, auto-creates empty array if missing or corrupt
- `writeJSON(file, data)` — atomic write via `.tmp` file + `fs.renameSync()`

### Middleware (`server/src/middleware/auth.js`)

| Function         | Purpose                                          |
|------------------|--------------------------------------------------|
| `generateToken`  | Signs JWT with `{id, email, role}`, expires 7d   |
| `verifyToken`    | Checks `Bearer <token>` header, attaches `req.user` |
| `requireAdmin`   | Rejects if `req.user.role !== 'admin'`           |

### Routes & Controllers

#### Auth (`/api/auth`)

| Method | Endpoint    | Auth     | Controller              | Description                    |
|--------|-------------|----------|-------------------------|--------------------------------|
| POST   | /register   | No       | `authController.register` | Creates user, returns JWT      |
| POST   | /login      | No       | `authController.login`    | Email+password auth, returns JWT |
| GET    | /profile    | JWT      | `authController.getProfile` | Returns user profile           |
| PUT    | /profile    | JWT      | `authController.updateProfile` | Updates name               |
| PUT    | /password   | JWT      | `authController.changePassword` | Changes password           |

**Password rules**: min 8 chars, must have uppercase, lowercase, and a number. Validated server-side.


#### Products (`/api/products`)

| Method | Endpoint  | Auth | Controller | Description |
|--------|-----------|------|------------|-------------|
| GET    | /         | No   | `getAll`   | List with filters + sort |
| GET    | /brands   | No   | `getBrands` | Unique brand names |
| GET    | /:id      | No   | `getById`  | Single product |

**Query parameters** for `GET /api/products`:

| Param      | Type   | Example            |
|------------|--------|--------------------|
| category   | string | `electronics`      |
| featured   | string | `true`             |
| search     | string | `headphones`       |
| sort       | string | `price_asc`, `price_desc`, `rating`, `newest`, `name` |
| brand      | string | `Sony` (comma-separated for multiple) |
| minPrice   | number | `5000`             |
| maxPrice   | number | `25000`            |

Production: response has `Cache-Control: public, max-age=30`.

#### Orders (`/api/orders`)

| Method | Endpoint  | Auth | Controller | Description |
|--------|-----------|------|------------|-------------|
| POST   | /         | JWT  | `placeOrder` | Places order, decrements stock |
| GET    | /         | JWT  | `getAll`   | User's orders (admin sees all) |
| GET    | /:id      | JWT  | `getById`  | Single order (own or admin) |

**Place order request body**:
```json
{
  "items": [
    { "id": "p1", "name": "Product", "price": 29999, "quantity": 1, "image": "url" }
  ],
  "customer": { "name": "John", "email": "john@example.com" }
}
```

Server recalculates total from current product prices (trusts server, not client). Validates stock, decrements on placement.

**Order statuses**: `confirmed` → `shipped` → `delivered` | `cancelled`

#### Cart (`/api/cart`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | /        | JWT  | Returns user's cart items array |
| PUT    | /        | JWT  | Replaces entire cart with sanitized items |

Cart items are sanitized (id, name, price, quantity, image, brand, description). Each user has one cart entry in `carts.json`.

#### Admin (`/api/admin`)

All routes require JWT + `role: 'admin'`.

| Method | Endpoint            | Controller              | Description              |
|--------|---------------------|-------------------------|--------------------------|
| GET    | /dashboard          | `adminController.getDashboard` | Stats: products, orders, revenue, out-of-stock |
| GET    | /orders             | `adminController.getOrders`   | All orders, newest first |
| PUT    | /orders/:id/status  | `orderController.updateStatus` | Change order status    |
| POST   | /products           | `productController.create` | Create product (validated) |
| PUT    | /products/:id       | `productController.update` | Update product fields    |
| DELETE | /products/:id       | `productController.remove`  | Delete product           |

#### Payments


| Method | Endpoint     | Auth | Description |
|--------|--------------|------|-------------|
| POST   | /verify      | No   | HMAC-SHA256 signature verification |

**Stripe** (`/api/payment`)

| Method | Endpoint               | Auth | Description |
|--------|------------------------|------|-------------|
| POST   | /create-payment-intent | No   | Creates Stripe PaymentIntent (amount × 100) |

---

## Client Architecture

### Entry Point (`client/src/main.jsx`)

Renders `<App />` inside `<BrowserRouter>` and `<React.StrictMode>`. Imports `App.css`.

### App (`client/src/App.jsx`)

**Provider hierarchy** (outer → inner):

```
HelmetProvider
    → AuthProvider
      → CartProvider
        → WishlistProvider
          → ToastProvider
            → ErrorBoundary (global catch-all)
              → Navbar + Routes + Footer
```

**Route map**:

| Path         | Page           | Protected | Admin Only |
|--------------|----------------|-----------|------------|
| `/`          | Home           | No        | No         |
| `/products`  | Products       | No        | No         |
| `/product/:id` | ProductDetail | No        | No         |
| `/wishlist`  | Wishlist       | No        | No         |
| `/cart`      | Cart           | No        | No         |
| `/checkout`  | Checkout       | Yes       | No         |
| `/orders`    | OrderHistory   | Yes       | No         |
| `/profile`   | Profile        | Yes       | No         |
| `/admin`     | Admin          | Yes       | Yes        |
| `/login`     | Login          | No        | No         |
| `/register`  | Register       | No        | No         |
| `*`          | NotFound       | No        | No         |

Each page is lazy-loaded (dynamic `import()`). Wrapped in `PageWrapper` (which contains `PageErrorBoundary`). Pages use `react-helmet-async` for `<title>` and `<meta>`.

**Global error boundary**: Catches rendering crashes across the entire app. `PageErrorBoundary` wraps individual pages so one crash doesn't take down the whole app.

---

### Context Providers

#### AuthContext (`context/AuthContext.jsx`)

| Value          | Type       | Description                        |
|----------------|------------|------------------------------------|
| `user`         | `object|null` | `{id, name, email, role, avatar}` |
| `loading`      | `boolean`  | True while restoring session       |
| `login()`      | `fn`       | Email/password login               |
| `register()`   | `fn`       | Name/email/password registration   |
| `logout()`     | `fn`       | Clears localStorage, resets state  |

**Session persistence**: Token + user object stored in `localStorage` under `nebula_token` / `nebula_user`. Restored on mount. Axios `Authorization` header set globally.

#### CartContext (`context/CartContext.jsx`)

| Value              | Description                                      |
|--------------------|--------------------------------------------------|
| `cart`             | Array of `{id, name, price, quantity, image, brand, description}` |
| `addItem(product, qty?)` | Adds or increments quantity (batch-safe)   |
| `removeItem(id)`   | Removes item                                    |
| `updateQuantity(id, qty)` | Sets quantity (min 1)                   |
| `clearCart()`      | Empties cart                                    |
| `totalItems`       | Sum of all quantities                           |
| `totalPrice`       | Sum of price × quantity                         |
| `syncCartOnLogin()`| Merges localStorage cart → server cart          |
| `validateCart()`   | Removes items whose product no longer exists     |

**Storage**: `localStorage` key `nebula_cart`. Auto-syncs to server via `PUT /api/cart` when JWT present.

**Merge strategy on login**: Server cart takes priority, then local items not on server are appended. Duplicate product IDs keep the higher quantity.

#### WishlistContext (`context/WishlistContext.jsx`)

| Value                 | Description                        |
|-----------------------|------------------------------------|
| `wishlist`            | Array of product objects           |
| `toggleWishlist(product)` | Add/remove toggle              |
| `isWishlisted(id)`    | Boolean check                      |
| `removeFromWishlist(id)` | Remove by id                    |

Storage: `localStorage` key `nebula_wishlist`. No server sync.

#### ToastContext (`context/ToastContext.jsx`)

`useToast()` returns a function `(message, type, duration?)` where type is `'success' | 'error' | 'info'`. Renders floating toast notifications at bottom with auto-dismiss and exit animation.

---

### Components

#### Navbar (`components/Navbar.jsx`)

- Brand link: `✦ Nebula` → `/`
- Links: Home, Products, Wishlist (with badge), Cart (with badge)
- If authenticated: Orders, Admin (if admin role), Profile (avatar + name), Logout button
- If guest: Sign In link
- Badges show item counts for cart and wishlist
- Mobile-responsive hamburger menu with `menuToggle` state

#### Footer (`components/Footer.jsx`)

Brand, tagline, links to Products/Cart/Admin, copyright year.

#### ProductCard (`components/ProductCard.jsx`)

Used in Home (featured), Products (listing), ProductDetail (related).

- Image with fallback SVG on error
- Discount badge (%), Featured badge, low-stock warning
- Wishlist heart toggle button
- Brand + category label
- Rating stars (full/half/empty) + review count
- Discounted pricing display
- Add to Cart button (400ms cooldown to prevent double-add)

#### ProductSkeleton (`components/ProductSkeleton.jsx`)

Loading placeholder with `count` prop (default 6). Renders shimmer cards with image + text lines.

#### CartItem (`components/CartItem.jsx`)

- Image with fallback on error
- Brand, name, description (2-line clamp)
- Quantity ± controls (min 1)
- Per-item total
- Remove (trash) button
- Graceful null/undefined fallbacks for all fields

#### ProtectedRoute (`components/ProtectedRoute.jsx`)

- If loading: shows loading indicator
- If not authenticated: redirects to `/login`
- If `adminOnly` and user is not admin: redirects to `/`
- Otherwise: renders children

#### PageWrapper (`components/PageWrapper.jsx`)

Wraps each page in `PageErrorBoundary` for isolated error handling.

#### PageErrorBoundary (`components/PageErrorBoundary.jsx`)

Class-based React error boundary. Shows error message + "Reload Page" (full reload) + "Go Back" (history.back) buttons.

#### ThreeDScene (`components/ThreeDScene.jsx`)

Interactive 3D scene using Three.js (lazy-loaded only on Home page).

- `CoreShape`: Icosahedron with emissive distort material, floating animation
- `OrbitingRing`: Three transparent torus rings at different radii/speeds/colors
- `OrbitingSphere`: Small spheres orbiting at ring radii
- `TorusKnotShape`: Knot with metal finish
- `Particles`: 500-point particle system on sphere distribution with additive blending
- `LightBeams`: Crossed plane geometry beams
- `OrbitControls`: Auto-rotate with limited polar angle
- Multiple colored lights (ambient, directional, point)

---

### Pages

#### Home (`pages/Home.jsx`)

- `<Helmet>` title + meta description
- Hero section: badge "New Collection 2026", headline, CTA button, stats (10K+ customers, 500+ products, 4.8★)
- `ThreeDScene` as hero background
- Features section: Free Shipping, 2-Year Warranty, Easy Returns, 24/7 Support
- Featured Products grid (fetched from `GET /api/products?featured=true`)
- Loading skeleton + retry on error

#### Products (`pages/Products.jsx`)

- Header with product count
- Toolbar: search bar (debounced 300ms), filter toggle button (mobile), sort select
- Active filter tags with "Clear All" button
- Sidebar filters (sticky on desktop, drawer on mobile with backdrop overlay):
  - **Category**: all, electronics, clothing, accessories, sports, home
  - **Price Range**: presets (Under ₹5K, ₹5-10K, ₹10-25K, Above ₹25K)
  - **Brand**: loaded dynamically from `/api/products/brands`
- Product grid with skeleton loading
- Empty state when no products match

#### ProductDetail (`pages/ProductDetail.jsx`)

- Back link to products
- Full-size image (with fallback) + discount badge
- Brand, category, name, rating stars + review count
- Pricing: discounted + original + "Save ₹X"
- Description
- Meta: availability (stock count), brand, category
- Quantity selector (±, max: stock limit)
- Add to Cart + Wishlist buttons
- Feature badges: Free Shipping, 2-Year Warranty, Easy Returns
- Related products (same category, up to 4)

#### Cart (`pages/Cart.jsx`)

- Empty state with link to Products
- Free shipping progress bar (₹4,999 threshold, ₹499 otherwise)
- Cart items list (via `CartItem` component)
- Order summary sidebar: subtotal, shipping, total
- "Proceed to Checkout" button

#### Wishlist (`pages/Wishlist.jsx`)

- Header with item count + "Move All to Cart" button
- Grid of wishlist items: image (linked to detail), brand, name, price
- Per-item: "Add to Cart" + "Remove" buttons
- Empty state

#### Checkout (`pages/Checkout.jsx`)

- **Stripe**: Fetches client secret via `/api/payment/create-payment-intent`, renders `PaymentElement`, handles confirm
- Order summary sidebar
- On success: places order via `POST /api/orders`, clears cart, redirects to products

#### OrderHistory (`pages/OrderHistory.jsx`)

- Protected — shows authenticated user's orders
- Order cards: ID, status badge (colored), item previews (up to 3 with "X more"), total, date
- Loading skeletons, empty state

#### Profile (`pages/Profile.jsx`)

- **Account Details**: edit name (persisted via `PUT /api/auth/profile`), email (read-only)
- **Change Password**: current + new password via `PUT /api/auth/password`
- **Recent Orders**: last 5 orders, link to full order history

#### Admin (`pages/Admin.jsx`)

- Tabbed interface: Dashboard / Products / Orders
- **Dashboard**: 4 stat cards (total products, orders, revenue, out-of-stock)
- **Products**: Add/edit form (name, price, category select, stock, image URL, description) + sortable table with Edit/Delete actions; create via `POST /api/admin/products`, update via `PUT`, delete via `DELETE`
- **Orders**: Table of all orders, status dropdown (confirmed/shipped/delivered) to update

#### Login (`pages/Login.jsx`)

- Email + password form with show/hide password toggle
- Auth divider "or continue with"
- SSL badge
- Footer link to Register

#### Register (`pages/Register.jsx`)

- Name, email, password fields with show/hide toggle
- Real-time password requirements checklist:
  - At least 8 characters
  - Uppercase letter
  - Lowercase letter
  - A number
- SSL badge
- Footer link to Login

#### NotFound (`pages/NotFound.jsx`)

- 404 display with "Back to Home" button

---

### Utils

#### formatINR (`utils/formatINR.js`)

Formats numbers in Indian numbering system (lakh/crore style):
- `29999` → `29,999`
- `1234567` → `12,34,567`
- Uses 2-digit grouping after the first 3 digits

Also defined inline in `Admin.jsx` and `Checkout.jsx` for self-contained formatting (duplicated).

---

## Data Models (JSON Schemas)

### Product (`products.json`)

```json
{
  "id": "p1",
  "name": "Quantum Wireless Headphones",
  "description": "Premium noise-cancelling headphones...",
  "price": 29999,
  "category": "electronics",
  "image": "https://images.unsplash.com/...",
  "rating": 4.8,
  "stock": 25,
  "featured": true,
  "brand": "SoundMax",
  "reviewsCount": 1243,
  "discount": 20
}
```

Fields: `id` (string), `name`, `description`, `price` (integer INR), `category` (electronics|clothing|accessories|sports|home), `image`, `rating` (0-5), `stock`, `featured` (boolean), `brand`, `reviewsCount`, `discount` (0-100 percent).

30 products total across 5 categories, 12 brands, discounts 5%-30%.

### User (`users.json`)

```json
{
  "id": "uuid",
  "name": "John",
  "email": "john@example.com",
  "password": "$2b$12$...",
  "role": "customer",
  "avatar": "https://...",
  "createdAt": "2026-05-22T14:21:34.515Z"
}
```


### Order (`orders.json`)

```json
{
  "id": "uuid",
  "items": [
    { "id": "p1", "name": "Product", "price": 29999, "quantity": 1, "image": "url" }
  ],
  "customer": { "name": "John", "email": "john@example.com" },
  "total": 29999,
  "status": "confirmed",
  "userId": "user-uuid",
  "createdAt": "2026-05-22T15:30:00.000Z"
}
```

### Cart (`carts.json`)

```json
{
  "userId": "user-uuid",
  "items": [
    { "id": "p1", "name": "Product", "price": 29999, "quantity": 2, "image": "url", "brand": "Brand", "description": "Desc" }
  ],
  "createdAt": "2026-05-22T15:10:09.617Z",
  "updatedAt": "2026-05-22T15:10:09.617Z"
}
```

One document per user, items are sanitized on PUT.

---

## Environment Variables

### Server (`server/.env`)

| Variable            | Required | Description                            |
|---------------------|----------|----------------------------------------|
| `PORT`              | No       | Server port (default: 5000)            |
| `NODE_ENV`          | No       | `development` or `production`          |
| `JWT_SECRET`        | **Yes**  | Strong random string for token signing |
| `STRIPE_SECRET_KEY` | No       | Stripe secret key (for Stripe payments) |
| `CLIENT_URL`        | No       | Frontend URL for CORS (default: `http://localhost:5173`) |

### Client (`client/.env`)

| Variable                      | Description                         |
|-------------------------------|-------------------------------------|
| `VITE_API_URL`                | API base URL (default: `http://localhost:5000`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key              |

---

## Security

| Measure                    | Implementation                                                      |
|----------------------------|---------------------------------------------------------------------|
| Password hashing           | bcrypt, 12 rounds                                                   |
| JWT tokens                 | 7-day expiry, stored in localStorage (not cookies — no CSRF needed) |
| Rate limiting              | 4 tiers (auth: 10/15min, social: 20/hr, sensitive: 60/15min, general: 300/15min) |
| HTTP security headers      | helmet (CSP disabled, HSTS 1yr, XSS, frameguard, referrer policy)   |
| Input sanitization         | Strips `<>` from user strings, blocks `$where`/prototype pollution  |
| Request size limits        | JSON: 16KB, URL-encoded: 8KB                                        |
| Parameter pollution        | hpp middleware                                                      |
| CORS                       | Strict origin + credentials, 24hr preflight cache                   |
| Timeout                    | 15s request timeout → 503                                           |
| Error handling             | No stack traces in production responses                             |
| Atomic file writes         | `.tmp` file + `rename` to prevent data corruption                   |
| Process hardening          | Graceful shutdown, uncaughtException/unhandledRejection handlers    |

---

## Features Checklist

- [x] Product listing with advanced filtering (category, price, brand, search, sort)
- [x] Product detail page with qty selector, wishlist, related products
- [x] Shopping cart with localStorage + server sync
- [x] Wishlist (localStorage only)
- [x] User registration + login (email/password)
- [x] Profile management (edit name, change password)
- [x] Order placement + order history
- [x] Admin dashboard (stats, CRUD products, order management)
- [x] Stripe payments (Credit/Debit Card)
- [x] Dark theme with glassmorphic UI
- [x] 3D animated hero scene (Three.js)
- [x] Mobile-responsive with hamburger menu
- [x] Indian pricing (INR) throughout
- [x] Per-page error boundaries
- [x] Production build optimization (code splitting, terser)

---

## Deployment Notes

### Setting up admin access

1. Register a user through the UI (or API)
2. Open `server/src/data/users.json`
3. Change the user's `role` from `"customer"` to `"admin"`
4. Restart the server — the user can now access `/admin`

### Payment keys

- Stripe is the fallback
- Both require real API keys in production
- Keys are placeholders in `.env` by default

### Pick up here / Next steps

1. Add pagination to product list and admin orders
2. Replace JSON file storage with SQLite/MongoDB (concurrent write safety)
3. Product image upload (not external URL)
4. Email confirmation on order placement
5. Order confirmation page (not redirect to `/products`)
