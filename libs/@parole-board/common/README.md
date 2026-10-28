# @parole-board/common

Parole Board calendar code shared by every state: the `ParoleBoardHost` type and its provider, shared UI primitives, and test helpers. `CalendarGrid` (CO-829), the React Query client and data hooks (CO-869) and `PublicCalendarView` (CO-789) land here too.

Import it as `~@parole-board/common`. Test helpers live behind their own alias, `~@parole-board/common/testing`, so they never ship in the main barrel.

## What goes here

- **`src/host/`**: `ParoleBoardHost`, `ParoleBoardHostProvider`, `useParoleBoardHost()` and `useCalendarCode()`.
- **`src/components/`**: shared UI primitives. Build each one by wrapping or composing `~design-system` parts (or `@recidiviz/design-system`, only for exports `~design-system` lacks). Never edit `libs/design-system` or `apps/staff` to get one. When a screen needs a staff component, such as `StatusMessage`, copy it here and note the copy in the PR.
- **`src/theme/`**: `semantics`, the colours, type, spacing and radius every Parole Board component uses. The names follow the Figma System v2 groups (text, icon, surface, border, action, status, radius) and every value aliases a `~design-system` token. Components read only `semantics`, never `palette` or a hex or rgb literal; a missing value becomes one new alias there, mapped to the nearest design-system token. Stand-ins for exports the design system lacks carry a `TODO(CO-935)`.
- **`src/CalendarGrid/`**: `CalendarGrid`, the month grid built on FullCalendar, with its types and date helpers (`toIsoDate`, `isInMonth`, `monthStartIso`, `weekStartsOnToFirstDay`).
- **`src/loading/`**: `SuspenseBoundary`, the skeleton primitives (`Skeleton`, `SkeletonText`, `SkeletonGroup`) and `AdminPageSkeleton`. The host app imports it as `~@parole-board/common/loading`, so its lazy page's fallback doesn't pull in the rest of the library.
- **`src/testing/`**: `createFakeHost()` and `renderWithHost()`.
- **`src/fixtures/`**: all synthetic fixture data (such as `september2026`), plus `queryResult()`, `suspendedQuery()`, `failedQuery()` and `mutationResult()`, which stand in for React Query hooks. Import them as `~@parole-board/common/fixtures`, from tests and example files only.
- **`.examples/`**: the examples config every Parole Board library shares (below).

Components fetch data only through the hooks in this library (CO-869), never with their own clients.

## Loading and errors

Components read server data with React Query's Suspense hooks (`useSuspenseQuery` through the tRPC options proxy), so a component renders only once its data is there and never branches on `isPending`. Mutations keep their own pending state, such as the waiting button, and don't suspend.

Wrap each part of a screen that loads in a `SuspenseBoundary`, with a skeleton shaped like that part as its `fallback`:

```tsx
<SuspenseBoundary fallback={<AdminPageSkeleton />} resetKeys={[month]}>
  <MonthView month={month} />
</SuspenseBoundary>
```

It shows the skeleton while its children suspend and an error with "Try again" if they throw. Retrying resets the failed queries, so they refetch. Build skeletons from `Skeleton`, `SkeletonText` and `SkeletonGroup`, in the loaded screen's layout and sizes; they stop pulsing when the user prefers reduced motion. Each component that suspends has a `Loading` example (inject `suspendedQuery`) and tests for its skeleton and error.

## Isolation rules

The calendar UI lives in these libraries rather than in the staff app, so it can be tested on its own and reused by each state (D26). `eslint.config.mjs` enforces the boundaries through `@nx/enforce-module-boundaries`:

| Tag                                            | Rule                                             |
| ---------------------------------------------- | ------------------------------------------------ |
| `parole-board:common` (this library)           | Never depends on a `parole-board:state` library  |
| `parole-board:state` (`us-co`, later `us-xx`)  | Never depends on another state's library         |
| `domain:calendar` (`libs/@modules/Calendar/*`) | Never depends on a `domain:parole-board` library |

Both libraries are also tagged `scope:client`, so they can't import server libraries, and Nx rejects any library import of an app, so neither can import `apps/staff`. They may import `~@modules/Calendar/rules`, router types from `~@modules-server/trpc-types` (with `import type`), `~design-system`, `@recidiviz/design-system`, `~utils`, `~trpc-client-utils` and `~client-env-utils`.

The libraries carry no `type:*` tag, because a `type:feature` library can't import `~trpc-client-utils` or `~@modules-server/trpc-types`, which have none.

## The host

`ParoleBoardHost` is the set of services the calendar needs from the app hosting it. It is structural, so the host app builds one without these libraries importing it. In the staff app, `createParoleBoardHost` in `apps/staff/src/core/PageParole/UsCo/` maps `RootStore` onto it. `currentTenantId` is a getter, so the host follows the tenant the user switches to:

```tsx
const host: ParoleBoardHost = {
  get currentTenantId() {
    return rootStore.currentTenantId;
  },
  userStore: rootStore.userStore,
  tenantStore: rootStore.tenantStore,
  // createParoleBoardAnalytics lives in the same staff folder.
  analyticsStore: createParoleBoardAnalytics(rootStore.analyticsStore),
  reportError: (error) => captureException(error),
};

<UsCoParoleCalendarAdmin host={host} />;
```

`useCalendarCode()` reads `tenantStore.currentTenantConfig.calendarConfig.calendarCode` and throws when the tenant has none, so no component names a calendar code itself. CO-869 adds `calendarTrpc` to the host and the `createCalendarTrpc` step the host app runs to build it. `ParoleBoardAnalytics` declares one method per admin calendar event; the staff adapter `createParoleBoardAnalytics` sends each to `AnalyticsStore.track` under its `frontend.pb_public_calendar_*` name. Event metadata holds months, counts, kind codes and public location codes only, never emails, ids or free text, because it goes to Segment.

## Tests, lint and examples

```bash
nx test @parole-board/common
nx lint @parole-board/common --fix
nx typecheck @parole-board/common
```

Render components in tests with `renderWithHost(ui, { host, route })`. To check an analytics call, build a host with `createFakeHost()` and spy on its methods with `vi.spyOn`.

## Examples

Every Parole Board library renders its `*.examples.tsx` files with its own targets, sharing the config in `.examples/` (D29):

```bash
nx examples @parole-board/common [path]        # paths are relative to the library, default src
nx build-examples @parole-board/common [path]  # static build in examples-static/
```

Both targets run Storybook from the library's folder with `--config-dir ../common/.examples`, and `examples` adds `--no-open`, so it doesn't open a browser on every run; open the URL it prints in the terminal. Copy both targets as they are. `main.ts` scans whichever library it runs from, so a library adds the two targets and no config. Story ids are the library's folder name plus the file's path: `us-co/src/AdminRootContent.examples.tsx` → `OfflineOrDemo` is `us-co-src-adminrootcontent--offline-or-demo`. The ui-examples skill has the URL recipe and server discovery.

`preview.ts` wraps each story in a `MemoryRouter` (at `parameters.route` when set), a new `QueryClient` with retries off and a `ParoleBoardHostProvider` with `createFakeHost()`, and loads the `~design-system` global styles and the staff fonts, with nothing from `apps/staff`.

A container that calls a data hook swaps it for fixture data with `react-magnetic-di`. Wrap the component with `withDi` and render the result from the story; files that share injectables keep them in an array and spread it:

```tsx
const defaults = [useConfigDi];
const DraftView = withDi(ParoleCalendarAdminView, [...defaults, useMonthDi]);
const LoadingView = withDi(ParoleCalendarAdminView, [
  ...defaults,
  useMonthSuspendedDi,
]);

export default {};
export const Draft = () => <DraftView />;
export const Loading = () => <LoadingView />;
```

For the same hook, the later entry wins, so a story can override a shared default by listing its own after the spread. Render the `withDi` component inside an arrow function rather than exporting it directly, because Storybook reads the forwardRef object `withDi` returns as a story object and fails to render it. Its Babel plugin runs only in this examples build, never in the library builds, Vitest or the staff build, and lint rejects importing `react-magnetic-di` outside example files and `~@parole-board/common/fixtures` outside tests and example files. The plugin only wraps imported values, so inject the hook a component imports. `us-co/src/DiSmoke.examples.tsx` is the minimal working case.

## How a state adds a Parole Board library

1. Create `libs/@parole-board/us-xx` with the tags `scope:client`, `domain:parole-board` and `parole-board:state`, and add its `~@parole-board/us-xx` alias to `tsconfig.base.json`.
2. Export `<UsXxParoleCalendarAdmin host />`, built on this library's hooks, `CalendarGrid` and test helpers. Put anything another state could use in this library instead.
3. Add the state's `calendarConfig` and route permission (Spec D, "How a state adds a calendar").
4. Mount it from the staff app the way US_CO does: a view in `apps/staff/src/core/PageParole/Us<Xx>/`, registered in `PUBLIC_CALENDAR_COMPONENTS_BY_TENANT`.
5. Copy the `examples` and `build-examples` targets from `us-co/project.json`. They point at this library's shared `.examples/` config and pass `--no-open`, so nothing else is needed.
