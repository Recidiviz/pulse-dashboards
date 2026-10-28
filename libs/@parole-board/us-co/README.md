# @parole-board/us-co

The US_CO Parole Board calendar admin tool. Import it as `~@parole-board/us-co`.

Its top-level export is `<UsCoParoleCalendarAdmin host={host} />`. The host app mounts it on a route ending in `/*` (`/parole/public-calendar/*` in the staff app), and the routes inside it are relative (`index`, `:yearMonth`), so this library never needs the staff app's paths.

## What goes here

US_CO-specific screens: the admin root and the admin screens (CO-830 and later). The host app's own header carries the navigation, so this library has no nav of its own. Anything another state could use belongs in `~@parole-board/common` instead, including shared UI primitives, which go in `common/src/components/` by wrapping or composing `~design-system` parts. Components fetch data only through the `common` hooks (CO-869).

## The admin root

`UsCoParoleCalendarAdmin` wraps its content in `ParoleBoardHostProvider` and picks a state at render. `AdminRootContent` renders each state from a `mode` prop, without a host, so examples can show each one.

| Mode            | When                                                                      | Shows                                                                               |
| --------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `offline`       | `isOfflineMode()` or `isDemoMode()`                                       | A message that the calendar server doesn't run in offline or demo mode              |
| `notConfigured` | `VITE_MODULE_BACKEND_URL` is empty, or the tenant has no `calendarConfig` | A message that the calendar isn't set up, plus one `console.warn` naming the tenant |
| `live`          | Otherwise                                                                 | The calendar (a placeholder until CO-830)                                           |

The first two states send no request.

## Isolation rules

This library is tagged `parole-board:state`, so it can't import another state's library, and `~@parole-board/common` can't import it. Like `common`, it can't import `apps/staff` or server libraries. The `common` README lists the full rules, the host pattern and how a state adds its own library.

## Tests, lint and examples

```bash
nx test @parole-board/us-co
nx lint @parole-board/us-co --fix
nx typecheck @parole-board/us-co
nx examples @parole-board/us-co [path]
nx build-examples @parole-board/us-co [path]
```

Paths are relative to this folder (`src/AdminRootContent.examples.tsx`). `nx examples` doesn't open a browser; open the URL it prints in the terminal. The examples use the shared config in `common/.examples/`; the `common` README explains it.
