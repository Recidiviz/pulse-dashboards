# Admin routes

Internal tRPC procedures for Recidiviz staff, all on adminProcedure (rejected while impersonating). Much of this was written with AI assistance. Only other admin code may import from here; the one exception is router.ts, which registers the admin routers. Lint enforces this. The app counterpart is apps/@meetings/app/src/admin.
