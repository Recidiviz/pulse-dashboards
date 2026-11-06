# Calendar/router

The Calendar module's tRPC router, mounted on the Modules server under `Calendar` (Spec D v2). It reads and writes the `Calendar*` tables through a client from `getPrismaClient(stateCode)` in `~@modules/Calendar/prisma`, which connects to the state's own Calendar database (`CALENDAR__US_CO` for Colorado). Its generic code names no state: a state's calendar is rows in those tables, and the state's settings, entry types and API are its own code in a `us_<state>` folder, here and in `~@modules/Calendar/rules`, which the generic code never imports. `src/router.ts` is the module's router: each state's calendars sit under their own keys, so clients call Colorado's Parole Board calendar at `Calendar.usCo.paroleBoard.<procedure>`, beside the skeleton's `stub` query, and another state or calendar can sit beside it without renaming any client call.

## Code

| File                     | What it holds                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/db/dates.ts`        | `toDbDate` and `fromDbDate` convert between `"YYYY-MM-DD"` and the UTC-midnight `Date` Prisma uses for `@db.Date` columns. Use only these, so dates never shift with the host time zone.                                                                                                                                                                                      |
| `src/db/calendar.ts`     | `findCalendarByCode` loads a calendar by `code` with its kinds and resource types in `sortOrder`, and throws `CalendarNotFoundError` when there's none.                                                                                                                                                                                                                       |
| `src/procedures.ts`      | `calendarAuthedProcedure`, plus `createCalendarEditorProcedure` and `createCalendarPublicProcedure`, which build the procedures for one `FixedCalendar`: a state, its calendar row's code and its rules.                                                                                                                                                                      |
| `src/errors.ts`          | `handlePrismaError` turns Prisma's missing-row errors (P2025, P2003) into NOT_FOUND.                                                                                                                                                                                                                                                                                          |
| `src/types.ts`           | The procedures' output types. They're generic; Colorado's `types.ts` narrows the kind to its own entry types.                                                                                                                                                                                                                                                                 |
| `src/calendar.errors.ts` | `notImplemented` for procedures still to come, and `formatMonthLabel` for error messages.                                                                                                                                                                                                                                                                                     |
| `src/us_co/parole_board` | Colorado's API: `usCoPublicCalendarEditorProcedure` and `usCoPublicCalendarAnonymousProcedure` are the builders applied to US_CO's `PAROLE_BOARD_PUBLIC` calendar and Colorado's rules, `schema.ts` holds the zod inputs, `types.ts` holds the output types, and `router.ts` the `usCoPublicCalendarRouter`: `admin.*` for editors and the one anonymous `public.months.get`. |

The generic code never imports a `us_co` folder; this library's `eslint.config.mjs` enforces it.

## Procedures

A state's API is fixed to one calendar, so no request names a state or a calendar code. The calendar's settings and entry types come from its state's code; the builders open the fixed state's Calendar database, load the row by its code and give each kind row its entry type's behaviour. Each state has its own database, so the row has no state column; the editor procedure checks the caller's state against the fixed calendar's before any query. That check is what keeps a Recidiviz user, who passes `calendarAuthedProcedure` with any state's header, off another state's calendar and database.

| Procedure                       | Who passes                                                                                                                                    | ctx it adds                                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `calendarAuthedProcedure`       | A signed-in user whose token is for the `StateCode` header's state, or any Recidiviz user, for any state.                                     | `stateCode`, `user` (`email` lowercased, `isRecidivizUser`, `routes`)                                                                        |
| `createCalendarEditorProcedure` | An authed user acting in the calendar's own state with the `editorRoute` from its settings, or an authed Recidiviz user acting in that state. | `prisma` for the state's database, and `calendar`: the row's id, code and name, its state, its `rules`, and its `kinds` with their behaviour |
| `createCalendarPublicProcedure` | Anyone, for queries. It reads no token and no header, and mutations fail with METHOD_NOT_SUPPORTED.                                           | `prisma`, `calendar` as above; no user                                                                                                       |

Errors, with "CO" a `us_co` token and "route" the routes claim's Admin Panel key `parole_publicCalendar`:

| Caller                        | StateCode header | authed       | editor       | public |
| ----------------------------- | ---------------- | ------------ | ------------ | ------ |
| No token                      | US_CO or missing | UNAUTHORIZED | UNAUTHORIZED | OK     |
| CO, with the route            | missing or us_co | BAD_REQUEST  | BAD_REQUEST  | OK     |
| CO, with the route            | US_CO            | OK           | OK           | OK     |
| CO, with the route            | US_ID            | FORBIDDEN    | FORBIDDEN    | OK     |
| CO, no route or route false   | US_CO            | OK           | FORBIDDEN    | OK     |
| A `us_id` token               | US_CO            | FORBIDDEN    | FORBIDDEN    | OK     |
| Recidiviz                     | US_CO            | OK           | OK           | OK     |
| Recidiviz                     | US_ID            | OK           | FORBIDDEN    | OK     |
| Token without the email claim | US_CO            | UNAUTHORIZED | UNAUTHORIZED | OK     |

A fixed calendar with no row (the seed hasn't run) and a kind row with no entry type in the rules both get INTERNAL_SERVER_ERROR from both builders, since they are setup problems the caller can't fix.

To add a procedure, build it on the state's editor or public procedure, scope every query to `ctx.calendar.id`, and add it to the state's router. Test it over HTTP with `initFastifyAndSetUser` from `__tests__/setup`, passing the router to mount; Colorado's tests use `initUsCoClient` from `__tests__/us_co/parole_board/setup`.

## The schema

The models are in `libs/@modules/Calendar/prisma/prisma/models/calendar.prisma`, and the `*_calendar_models` migration in that library creates them; its README has the data model diagram. The migration also adds CHECK constraints for rules Prisma can't express, such as `HH:mm` times and "a slotKey has a colon exactly when the entry has a resource". Rules that depend on a kind's flags, such as "a hearing needs a resource", are checked in `~@modules/Calendar/rules` on every write instead. Foreign keys on `(calendarId, id)` stop a row from pointing at another calendar's type, kind, resource or month, because seed SQL inserts rows directly and skips those checks; each entry stores its month's `calendarId` for that reason.

## Tests

```bash
nx test @modules/Calendar/router      # unit tests, no database
nx test-db @modules/Calendar/router   # database tests in __tests__/db/
```

`test-db` runs against the Calendar test database. Start it with `nx local-dbs @modules/Calendar/prisma` and apply the migrations from `libs/@modules/Calendar/prisma`:

```bash
CALENDAR__US_CO_DATABASE_URL=postgresql://postgres:postgres@localhost:6563/module-Calendar-test yarn prisma migrate deploy --schema libs/@modules/Calendar/prisma/prisma
```

`CALENDAR_TEST_DATABASE_URL` overrides that address. The tests set `CALENDAR__US_CO_DATABASE_URL` from it and ignore the shell's value, so a shell with the dev env loaded can't point them at the dev database. Every database test empties the `Calendar*` tables first with `resetCalendarTables`, which refuses to run outside Vitest or on a database whose name doesn't end in `-test`, and touches no other table. The procedure tests also insert the calendars in `__tests__/setup/fixtures.ts` and serve them on port 3005 (`PORT` overrides it). Their data is synthetic (`__tests__/setup/calendarConfig.ts`), never a state's configuration.
