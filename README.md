# SANJAY VAISHYA — Full-Stack Development & Project Management Platform

An independent, founder-led full-stack software development team platform and project management workspace led by **Sanjay Vaishya (Founder & Lead Full-Stack Developer)**.

## Architecture Highlights
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Progressive Web App (`vite-plugin-pwa`).
- **Mobile-First App Shell**: Role-aware mobile bottom navigation bar, safe-area padding, bottom sheets, and persistent desktop workspace sidebar.
- **Authentication & Authorization**:
  - Firebase Authentication (`Email/Password` sign-up with immediate automatic sign-in, `Password Reset`).
  - Firebase Realtime Database (`users/{uid}/profile`, `users/{uid}/role`, `users/{uid}/status`, `users/{uid}/createdAt`) as authoritative role/status source synced cleanly to SQLite.
  - Node.js Express backend (`server.ts`) verifying Firebase ID tokens on every authenticated API request and authenticating WebSocket upgrades via signed `HttpOnly` session cookies (`sv_fb_session`).
  - New registrations always receive `role = "client"` and `status = "active"`. Admin role must only be assigned manually via Firebase Console.
- **Business Persistence & Realtime**: SQLite operational database (`storage/platform.db`), magic-byte verified private file uploads (`storage/uploads/`), Razorpay order/signature/webhook verification, PDF proposals/invoices, and WebSocket project chat rooms.

---

## Hostinger Node.js Deployment Settings (CRITICAL — Do Not Deploy as Static Vite Site)

Hostinger must run this app as a **Node.js Web Application**, **not** static-only `public_html` publishing. If deployed statically (`vite build` copied into `public_html`), `server.ts` never starts and `/api/*` requests fail with HTTP 404.

Configure Hostinger hPanel **Node.js Web App** with:

| Setting | Value |
| :--- | :--- |
| **Application Type / Framework** | **Node.js / Express** (NOT Static Vite) |
| **Node.js Version** | **Node.js 22 LTS** (`>=22.0.0`, tested on `22.23.2`; `package.json` pins `firebase@12.12.0` so zero `EBADENGINE` warnings occur) |
| **Install Command** | `npm ci` (or `npm install`) |
| **Build Command** | `npm run build` (runs `vite build` -> outputs SPA into `dist/`) |
| **Start Command** | `npm start` (executes `tsx server.ts`) |
| **Entry File (if prompted)** | `server.ts` (or `server.js`, which boots `tsx` and dynamically imports `server.ts`) |
| **Output Directory** | *Leave blank / do not publish `dist/` statically* — `server.ts` serves `dist/` in production and handles `/api/*` + `/ws` |
| **Host & Port Binding** | Controlled automatically via `process.env.PORT` (default `3000`) on `0.0.0.0` |

### Required & Recommended Production Environment Variables
Configure these in Hostinger Environment Variables (never commit `.env` or keys):

- `NODE_ENV=production`
- `APP_URL=https://app-sanjay.indiacybercafe.com`
- `PORT=3000` (or Hostinger-injected `PORT`)
- `STORAGE_DIR=/home/<user>/persistent-sanjay-storage` *(recommended: mount outside ephemeral release directories so SQLite `platform.db` and `uploads/` survive redeployments)*
- `FIREBASE_PROJECT_ID=sanjay-vaishya-app`
- `FIREBASE_DATABASE_URL=https://sanjay-vaishya-app-default-rtdb.firebaseio.com`
- `FIREBASE_SERVICE_ACCOUNT_JSON=<minified single-line JSON of Firebase service account>` *(required in production for full token revocation checks, custom claims sync, and RTDB lookups)*
- `SESSION_SECRET=<random 64-char hex secret>` *(required for signed `HttpOnly` API/WebSocket cookies)*
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` *(optional; online payments remain disabled until all three are set)*

### Post-Deploy Verification Checks
1. `GET /api/health` returns `200 OK` JSON `{ "status": "ok", "timestamp": "..." }`.
2. `POST /api/auth/session` without Authorization returns `401` JSON (proving Express handles `/api/*` rather than returning HTML 404).
3. Direct browser loads on routes such as `/services`, `/work`, `/login`, and `/dashboard` render cleanly without 404.
4. Unknown routes render the explicit 404 screen rather than silently redirecting to Home, while unknown `/api/*` returns `404` JSON.

---

## Firebase Setup & Founder Admin Role Assignment

1. **Enable Email/Password & Realtime Database** in Firebase Console (`sanjay-vaishya-app`).
2. **Deploy Security Rules (`database.rules.json`)**: Restrict client creation to `role = "client"` and `status = "active"`.
3. **Assign Founder Admin Role**: Register normally at `/register`, then open **Firebase Console -> Realtime Database -> `users/<uid>`** and update `role` to `"admin"`.

---

## Local Development

```bash
npm install
npm run lint
npm run build
npm run dev   # Runs Vite middleware inside Express on http://0.0.0.0:3000
```
