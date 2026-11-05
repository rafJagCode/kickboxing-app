# APP_SPEC.md — Kickboxing Pass & Attendance Manager

> **Notice for AI Coding Assistants:** This document is the single source of truth for the project. Always adhere to the architecture, data models, business logic, and UX constraints defined below.

---

## 1. Project Overview & Operational Context

### 1.1 Purpose

This application is a private, single-user administrative dashboard built exclusively for a **kickboxing coach**. Members/trainees do **not** have accounts, profiles, or login credentials. The entire UI is built to replace paper notebooks and messy spreadsheets.

### 1.2 Real-World Operational Realities

- **Schedule Cadence:** Group sessions occur primarily on **Saturdays**. Each training group/type has its own independent schedule.
- **Payment Flow:** Members pay via bank wire transfer. The coach has no direct banking API access; members send payment receipts as PDFs or image screenshots. The coach manually verifies the transaction's **booking date** (`bookingDate`), uploads the proof to the member's profile, and creates/renews their pass.
- **Pass Structure:** A pass has a default duration of **minimum 1 month** AND a quota of **4 entries** (1 class per Saturday).
- **Automatic Pass Extension:** If a Saturday session is cancelled by the coach (hall closed, illness, holidays), members must **not** lose their prepaid entries. The pass expiration date must dynamically adapt to calendar changes, pushing the end date forward until the member has had the opportunity to attend all purchased sessions.
- **Gym Floor UX (Mobile-First):** During training sessions, speed is critical. The coach needs to open the app on a smartphone, search a member by typing 2–3 letters, tap an open check-in circle (`[ ○ ]` -> `[ X ]`), and register attendance with an automatic timestamp in under 3 seconds.

---

## 2. Technical Stack & Deployment

- **Framework:** Next.js (latest App Router), React, TypeScript.
- **Styling & UI:** Tailwind CSS, shadcn/ui, Lucide Icons.
- **Database:** Supabase (PostgreSQL).
- **File Storage:** Supabase Storage (Bucket for PDF and image receipts).
- **Hosting:** Vercel (Serverless runtime; no local filesystem persistence).
- **Authentication:** Simple, single-password gateway:
  - Password stored in environment variable `APP_PASSWORD`.
  - Successful authentication sets a secure, encrypted, `httpOnly` cookie valid for 60 days.
  - Next.js Middleware guards all protected routes; unauthorized requests redirect to `/login`.

---

## 3. Database Schema & Entities

### 3.1 `Member`

Represents an individual kickboxer.

- `id` (`uuid`, Primary Key, default: `gen_random_uuid()`)
- `first_name` (`text`, NOT NULL)
- `last_name` (`text`, NOT NULL)
- `created_at` (`timestamptz`, default: `now()`)

### 3.2 `TrainingType`

Represents distinct training groups (e.g., "Kids 4-6 yo", "Teens & Adults").

- `id` (`uuid`, Primary Key, default: `gen_random_uuid()`)
- `name` (`text`, NOT NULL, e.g., "Kickboxing Kids 4-6 yo")
- `created_at` (`timestamptz`, default: `now()`)

### 3.3 `CalendarSession`

Represents a scheduled Saturday training session for a specific group.

- `id` (`uuid`, Primary Key, default: `gen_random_uuid()`)
- `training_type_id` (`uuid`, Foreign Key -> `TrainingType.id`, ON DELETE CASCADE)
- `date` (`date`, NOT NULL) — Date of the Saturday session.
- `status` (`enum`, default: `'PLANNED'`)
  - `'PLANNED'` (Yellow) — Default for all upcoming Saturdays.
  - `'COMPLETED'` (Green) — Training took place and was conducted by the coach.
  - `'CANCELLED'` (Red) — Training did not take place.

### 3.4 `PaymentProof`

Represents uploaded bank transfer confirmation receipts.

- `id` (`uuid`, Primary Key, default: `gen_random_uuid()`)
- `member_id` (`uuid`, Foreign Key -> `Member.id`, ON DELETE CASCADE)
- `file_url` (`text`, NOT NULL) — Public or signed URL in Supabase Storage.
- `file_type` (`text`, NOT NULL) — `'pdf'` or `'image'`.
- `booking_date` (`date`, NOT NULL) — Manually entered transaction date from the receipt.
- `created_at` (`timestamptz`, default: `now()`)
- **Sorting Rule:** Always display ordered by `booking_date DESC` (newest payments on top).

### 3.5 `Pass`

Represents a membership pass issued to a member.

- `id` (`uuid`, Primary Key, default: `gen_random_uuid()`)
- `member_id` (`uuid`, Foreign Key -> `Member.id`, ON DELETE CASCADE)
- `training_type_id` (`uuid`, Foreign Key -> `TrainingType.id`, ON DELETE RESTRICT)
- `start_date` (`date`, NOT NULL, default: `CURRENT_DATE`)
- `total_entries` (`int`, NOT NULL, default: 4)
- `is_active` (`boolean`, NOT NULL, default: true)
- `created_at` (`timestamptz`, default: `now()`)
- **Constraint:** A member should have only **one** active pass at any given time.

### 3.6 `Attendance`

Records an individual attendance entry against a pass.

- `id` (`uuid`, Primary Key, default: `gen_random_uuid()`)
- `pass_id` (`uuid`, Foreign Key -> `Pass.id`, ON DELETE CASCADE)
- `attended_at` (`timestamptz`, default: `now()`)

---

## 4. Core Business Logic & Algorithms

### 4.1 Dynamic Pass Expiration Engine

Pass end dates are **not** statically stored; they are calculated dynamically based on calendar state:

1. **Base Window:** Starts at `Pass.start_date` and spans at least 1 calendar month.
2. **Quota Guarantee:** The pass must cover at least `Pass.total_entries` non-cancelled training opportunities for that `Pass.training_type_id`.
3. **Cancellation Adjustment:**
   - The algorithm scans `CalendarSession` records for the pass's `training_type_id` starting from `start_date`.
   - Any session marked `'CANCELLED'` (Red) is discarded from the valid count.
   - The effective expiration date shifts forward to the date of the N-th available session (`'PLANNED'` or `'COMPLETED'`), or 1 month from `start_date`, whichever is later.
   - As long as a coach marks a session as `'CANCELLED'`, passes automatically remain valid further into the future.

### 4.2 Attendance Marking UX (Gym-Floor Flow)

- **Check-in Screen:** Fast instant-search input by member first/last name.
- **Visual Card:** Displays member name, associated training group, dynamically calculated expiration date, and visual circle indicators representing entries:
  - Example for a 4-entry pass with 2 attended: `[ X ] [ X ] [ ○ ] [ ○ ]`
- **Interaction:** Tapping the first empty circle `[ ○ ]` triggers a server action that inserts an `Attendance` row with the current timestamp and toggles the UI state to `[ X ]`.
- **Single Check-In Rule:** If a member attends two sessions on the same day, it still consumes only 1 entry from their pass.

### 4.3 Payment Verification & Pass Issuance

1. Open member profile.
2. View chronological list of payment receipts sorted by `booking_date DESC`.
3. Click receipt thumbnail for instant modal preview (in-app PDF viewer or full-size image modal).
4. If payment is verified, click "Issue New Pass" (pre-fills: today's date, 4 entries, group selector).

### 4.4 Coach Monthly Reporting

- Month & Year filter dropdowns.
- Aggregates all `CalendarSession` records with status `'COMPLETED'` (Green).
- Breakdown by `TrainingType` (e.g., "Kids: 4 sessions", "Teens: 3 sessions").
- Total aggregate metric: Total hours/sessions conducted by the coach that month.

---

## 5. Security & Access Control

- **Target Audience:** Single user (Coach).
- **Strategy:** Master password defined in `.env` as `APP_PASSWORD`.
- **Session Management:** Encrypted token stored in an `httpOnly`, `SameSite=Lax`, `Secure` cookie.
- **Next.js Middleware:** Intercepts every route except `/login`, `/api/auth`, and static assets (`/_next`, `/favicon.ico`). Redirects unauthenticated visitors to `/login`.

---

## 6. Project Directory Conventions (Next.js App Router)

```text
├── app/
│   ├── (auth)/
│   │   └── login/             # Password entry page
│   ├── (dashboard)/
│   │   ├── layout.tsx         # Coach navigation bar & mobile drawer
│   │   ├── page.tsx           # Home / Fast Attendance Check-in
│   │   ├── members/           # Members CRUD & Profile (receipts & passes)
│   │   ├── calendar/          # Saturday Calendar management per group
│   │   └── reports/           # Monthly coach session metrics
│   ├── api/                   # Route handlers (auth, file uploads)
│   └── globals.css
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   ├── attendance/            # Circle check-in components
│   ├── calendar/              # Yellow/Green/Red toggle grid
│   ├── payments/              # Upload dialog & PDF/image preview modal
│   └── shared/                # Navbar, search input, modals
├── lib/
│   ├── supabase/              # Supabase browser & server clients
│   ├── dynamic-pass.ts        # Pass validity calculation engine
│   └── auth.ts                # Cookie encryption & validation helpers
├── types/
│   └── index.ts               # Database & domain TypeScript definitions
├── middleware.ts              # Route protection middleware
└── APP_SPEC.md                # This specification file
```

## 7. Guidelines for AI Assistants

1. Incremental Development: Implement features phase-by-phase. Do not scaffold unrequested features.
2. Strict Typing: All database models and API interactions must have explicit TypeScript types.
3. Server Actions vs Client Components: Use Server Components for initial data fetching and Server Actions for mutations (createMember, markAttendance, updateSessionStatus, uploadProof).
4. Mobile Responsiveness: Touch targets must be at least 44x44px. The check-in view must not require horizontal scrolling on screens as narrow as 360px.
