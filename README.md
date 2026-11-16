# Syntax Academy — Learning Management Platform

Syntax Academy is a bilingual (English LTR / Arabic RTL), dual-theme (Light / Dark) online academy and learning management platform backed by **Firebase Authentication**, **Cloud Firestore**, **Firebase Storage**, and a secure **Express** server (`server.ts`).

---

## 1. Architecture Summary

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router + Recharts + jsPDF + QRCode.
- **Backend (`server.ts`)**: Express server with Vite middleware in development, static SPA serving in production, `scrypt` password verification with `crypto.timingSafeEqual`, HMAC-signed HTTP-only admin session cookies (`syntax_admin_session`), sliding-window rate limiting, and comment spam filtering.
- **Database & Storage**: Cloud Firestore (database ID configured in `firebase-applet-config.json`), Firebase Authentication (Email/Password + Google Sign-In), and Firebase Storage for avatar and media uploads.
- **Security**: Production `firestore.rules`, `storage.rules`, Zod input validation, and strict separation between student PII, internal admissions notes, and administrative actions.

---

## 2. Environment Variables

Configure the following environment variables in `.env` (never commit secrets; `.env.example` lists safe templates):

```env
GEMINI_API_KEY="MY_GEMINI_API_KEY"
APP_URL="MY_APP_URL"
ADMIN_INITIAL_PASSWORD="syntaxomar@01012G.com"
SESSION_SECRET="replace-with-random-64-char-hex-secret"
```

- `ADMIN_INITIAL_PASSWORD`: Initial password verified on the server during `/admin/login`. On first boot, the server hashes it with a random salt using `crypto.scryptSync` and stores only the hash in `.admin-credentials.json` (gitignored). You can rotate the password anytime inside **Admin Dashboard -> Settings & Audit Logs**.
- `SESSION_SECRET`: Secret key used to sign HTTP-only admin session cookies.
- `FIREBASE_SERVICE_ACCOUNT_KEY` *(optional)*: JSON string of a Firebase Admin service account if server-side audit logging via `firebase-admin` is desired.

---

## 3. Firebase Setup Instructions

1. **Firebase Project & Config**:
   - The project's Firebase web configuration (`apiKey`, `projectId`, `firestoreDatabaseId`, `storageBucket`, etc.) is stored in `/firebase-applet-config.json`.
2. **Enable Authentication Providers** (Required in Firebase Console):
   - Open **Firebase Console -> Authentication -> Sign-in method**.
   - Enable **Google** sign-in.
   - Enable **Email/Password** sign-in (so students can register, sign in, verify email, and reset passwords).
   - Ensure the app's preview/production hostname is listed under **Authentication -> Settings -> Authorized domains**.
3. **Deploy Firestore & Storage Rules**:
   - `firestore.rules` is deployed to the project's Firestore database (`ai-studio-0a8d6166-e994-4c83-9758-c79ea635f5b1`).
   - Deploy Firebase Storage rules (`storage.rules`) via Firebase CLI:
     ```bash
     firebase deploy --only storage
     ```
4. **Seed Initial Academy Data (First Launch)**:
   - Open `/admin/login` and enter the administrator password.
   - Click **Connect Google Admin** in the top banner and sign in with the authorized Google Admin account (`omaejensi@gmail.com`).
   - Click **Seed Initial Academy Data** on the Admin Overview page to initialize the 4 learning tracks (`Frontend Development`, `Backend Development`, `Full Stack Development`, `Microsoft Office`), 3 instructors (`Omar Ashraf`, `Mohamed Ashraf`, `Malak Wael`), sample courses, lessons, testimonials, and global settings.

---

## 4. Local Development & Production Deployment

### Development
```bash
npm install
npm run dev
```
The server listens on `http://0.0.0.0:3000`.

### Production Build & Start
```bash
npm run lint
npm run build
NODE_ENV=production npm start
```
`"start"` executes `node server.ts` on port `3000`, serving the built `dist/` bundle alongside `/api/*` endpoints.

---

## 5. QA Testing Checklist

### Authentication & Access Control
- [ ] Register a new student account (`/register`) with Full Name, Email, Password, Confirm Password -> verify Firestore `users/{uid}` document is created (`role: "student"`, `status: "active"`).
- [ ] Sign in with Email/Password and Google Sign-In (`/login`).
- [ ] Test Forgot Password (`/forgot-password`) and Confirm Password mismatch validation.
- [ ] Verify unauthenticated requests to `/dashboard/*` redirect to `/login` and `/admin/*` redirect to `/admin/login`.
- [ ] Verify `/api/admin/login` rejects incorrect passwords (`401`) and issues an HTTP-only cookie on valid credentials.
- [ ] Verify password rotation in `/admin/settings` invalidates the old password and accepts the new password.

### Public Website & Enrollment Flow
- [ ] Verify Homepage displays dynamic tracks from Firestore with exact EGP pricing (`3000 -> 2500`, `4500 -> 3500`, `6000 -> 5000`, `1200 -> 900`), instructors, courses, testimonials, and Contact Us form.
- [ ] Switch between English (LTR) and Arabic (RTL) and Light / Dark themes across public, student, and admin views.
- [ ] Open `/tracks/:slug`, submit an application as a logged-in student, and verify duplicate pending applications for the same track are blocked.

### Student & Admin Workflows
- [ ] Admin reviews application (`/admin/applications`), adds an internal hidden note + student message, and marks status `accepted`.
- [ ] Verify student sees acceptance notice in real time (NotificationBell + `/dashboard/applications`) instructing them to contact `01012329975` (`tel:01012329975`) and showing Google Form link if configured on the track.
- [ ] Admin marks application `enrolled` -> verify `enrollments/{uid}_{trackId}` is created and student unlocks full lessons in `/courses/:courseId`, marks lessons complete, and posts comments.
- [ ] Admin issues a certificate (`/admin/certificates`) -> verify unique ID enforcement, student receives notification, English-only Landscape A4 PDF downloads with QR code, and `/verify-certificate/:certificateId` displays real status (`valid` / `revoked`).
- [ ] Admin tracks manual payments (`/admin/payments`), publishes announcements (`/admin/announcements`), moderates comments/testimonials, and reviews audit logs (`/admin/settings`).
