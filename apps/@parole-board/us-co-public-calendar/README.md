# Colorado Parole Board public hearing calendar

The public site for Colorado's Parole Board hearing calendar. It shows one published month per address
(`/2026-11`), read anonymously from the Modules server's `Calendar.usCo.paroleBoard.public.months.get`. The
screen itself is `PublicCalendarView` in `~@parole-board/common`; this app adds the routes, the data hook and
page counts.

## Run it

Start the Modules server (`nx dev @modules/server`, port 3022) with published months in its Calendar database,
then:

```bash
VITE_MODULE_BACKEND_URL=http://localhost:3022 nx serve @parole-board/us-co-public-calendar
```

The site opens on http://localhost:3060. Without `VITE_MODULE_BACKEND_URL` every request fails and the page shows
its load error.

| Variable                                       | What it does                                             |
| ---------------------------------------------- | -------------------------------------------------------- |
| `VITE_MODULE_BACKEND_URL`                      | The Modules server's base URL, as in the staff app.      |
| `VITE_US_CO_PUBLIC_CALENDAR_SEGMENT_WRITE_KEY` | Segment's write key. Without it no page counts are sent. |

Hosting and deploy targets come with CO-814.

## How it works

- **Routes.** `/YYYY-MM` shows that month. The bare address asks for the landing month (the current month in
  Denver if it's published, else the nearest later one, else the nearest earlier one), then replaces its history
  entry with that month's address. When that read skipped an unpublished current month, the month page shows the
  read's `notPublishedYet` line ("November 2026 isn't published yet."). A malformed address shows "This month
  isn't available." without a request.
- **Data.** `usePublicMonth` (`src/api/usePublicMonth.ts`) loads a month with Suspense and checks it again every
  minute and on window focus. NOT_FOUND is never retried. On the first load it becomes the unavailable state;
  after a month has loaded it stays an error beside the last data, so the page can tell a month that went back to
  draft.
- **Page counts.** One Segment page event per month shown, carrying only the month. Nothing is stored on the
  device, every event has the same anonymousId and IP `0.0.0.0`, and no other destination gets the events
  (`src/analytics/pageCounts.ts`).

## Checks

```bash
nx test @parole-board/us-co-public-calendar
nx lint @parole-board/us-co-public-calendar --fix
nx typecheck @parole-board/us-co-public-calendar
nx build @parole-board/us-co-public-calendar
```
