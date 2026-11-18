# SANJAY VAISHYA — Full-Stack Development & Project Management Platform

An independent, founder-led full-stack software development team platform and project management workspace led by **Sanjay Vaishya (Founder & Lead Full-Stack Developer)**.

## Architecture Highlights
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Progressive Web App (`vite-plugin-pwa`).
- **Mobile-First App Shell**: Role-aware mobile bottom navigation bar, safe-area padding, bottom sheets, and persistent desktop workspace sidebar.
- **Authentication & Authorization**:
  - Firebase Authentication (`Email/Password` sign-up with immediate automatic sign-in, `Password Reset`). Note: email link verification is not required, so users should register with an accurate email address to receive password recovery links.
  - Firebase Realtime Database (`users/{uid}/profile`, `users/{uid}/role`, `users/{uid}/status`, `users/{uid}/createdAt`).
  - Node.js Express backend (`server.ts`) verifying Firebase ID tokens on every authenticated API & WebSocket upgrade via `firebase-admin`.
  - Authoritative role & active-status resolution on the server; new registrations always receive `role = "client"` and `status = "active"`.
- **Business Persistence & Realtime**: SQLite operational database (`storage/platform.db`), private authenticated file storage (`storage/uploads/`), Razorpay milestone checkout, PDF proposals/invoices, and WebSocket project chat rooms.

---

## Firebase Setup & Founder Admin Role Assignment

1. **Enable Authentication & Realtime Database** in Firebase Console (`sanjay-vaishya-app`):
   - Enable **Email/Password** sign-in under *Authentication -> Sign-in method*.
   - Ensure Realtime Database (`https://sanjay-vaishya-app-default-rtdb.firebaseio.com`) is active.
2. **Deploy Security Rules (`database.rules.json`)**:
   - Publish the repository's `database.rules.json` to Firebase Realtime Database so users can only create their own initial `client` node and cannot escalate their own `role` or `status`.
3. **Assign Founder Admin Role**:
   - Register normally through `/register` with the founder email address.
   - Open **Firebase Console -> Realtime Database -> `users/<your_uid>`** and change:
     - `role`: `"admin"`
     - `status`: `"active"`
   - Refresh the app or sign in again; the Admin Control Center (`/admin`) unlocks automatically.
4. **Optional Server Admin SDK Key**:
   - Set `FIREBASE_SERVICE_ACCOUNT_JSON` (stringified JSON or path) in your production `.env` so the Node.js server can also write RTDB role updates when modifying users from the Admin User Management panel.

---

## Local Development & Production

```bash
npm install
npm run lint
npm run build
npm run dev
```

Environment variables are documented in `.env.example`. Never commit `.env`, service account JSON credentials, or `storage/` database files.
