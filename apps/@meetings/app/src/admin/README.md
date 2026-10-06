# Admin

Internal tools for Recidiviz staff: Agency Configurations, Flagged meetings and the review workflow. This area is web only, hidden while impersonating, and not part of the user-facing design. Much of it was written with AI assistance and has a lighter review bar than the rest of the app.

## Rules

- Everything for the admin area lives here. Do not add admin-only components to `shared/ui`, `entities`, `features` or `widgets`.
- Admin code may import user-facing code (`shared`, `entities`, `widgets`, ...). User-facing code must not import admin code. ESLint enforces this with two exceptions:
  - `app/navigation` imports the screens from `~@meetings/app/admin`.
  - The header and the navigation drawer import the Admin menu entry's state from `~@meetings/app/admin/navigation`.
- The folders inside mirror the app's layers (`pages`, `widgets`, `features`, `entities`) plus `ui` and `api`. Steiger does not check this folder, so keep that structure by convention.
- Server counterparts: `libs/@meetings/trpc/src/routes/admin`, `libs/@meetings/trpc/src/services/admin` and `libs/@meetings/tasks/src/admin`. The `MeetingReviewOutcome` model lives in the shared Prisma schema because it is stored in each state database.
