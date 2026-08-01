---
name: Auth System
description: Login, session management, and per-user page permissions
---

**How it works:**
- Login via `POST /api/auth/login` → verifies username + base64 password hash → returns user JSON
- Session stored in `localStorage` under key `clinic_auth_user`
- `AuthContext` (src/context/auth.tsx) provides `user`, `login`, `logout`, `hasAccess(page)`
- `administrator` and `manager` roles always get full access regardless of permissions field
- Other roles (employee/viewer) are restricted to pages listed in their `permissions` JSON array

**Why:** No session infrastructure needed; localStorage is sufficient for a clinic intranet app.

**Permissions storage:** `users.permissions` is a nullable text column containing a JSON array of page keys (e.g. `["dashboard","invoices"]`). `null` means full access.

**Default admin:** username `admin`, password `admin123`, role `administrator` (created programmatically). There is also an existing user "Mohammed Assubaihi" with unknown password.

**How to apply:** When adding a new protected page, add its key to `NAV_ITEMS` in sidebar.tsx and add a `ProtectedRoute` in App.tsx. The `hasAccess` check uses the page key.
