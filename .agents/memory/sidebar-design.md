---
name: Sidebar Design
description: Sidebar visual design with per-item brand colors and user info
---

**Background:** Dark gradient `linear-gradient(180deg, #0d2137, #0a3330, #0d2137)` — navy-to-teal matching clinic logo colors.

**Per-item colors (page key → tailwind color):**
- dashboard → teal-300
- training-certificates → blue-300
- medical-reports → emerald-300
- invoices → amber-300
- products → violet-300
- doctors → cyan-300
- users → indigo-300
- audit-logs → slate-300
- settings → rose-300

**Active state:** Colored background (`bg-{color}/25`) + colored text + colored dot on right edge.

**User info at bottom:** Shows initials avatar (teal gradient), full name, role label in Arabic, and logout button.

**Permissions filtering:** `NAV_ITEMS.filter(item => hasAccess(item.page))` — items the user has no access to are hidden from the sidebar entirely.

**How to apply:** When adding a new page, add an entry to `NAV_ITEMS` array in sidebar.tsx with `href`, `label`, `icon`, `page`, `color`, `activeBg`, `hoverBg`, `dot`.
