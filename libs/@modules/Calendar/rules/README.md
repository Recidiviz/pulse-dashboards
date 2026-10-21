# Calendar rules

`~@modules/Calendar/rules` turns a calendar's pattern rules, such as "2nd Tuesday" or "every Friday", into real dates. It's the shared date math for the generic Calendar module (Spec D v2), used by the Modules server and the calendar UIs, so it's a `scope:universal` library with no I/O. Nothing in it names a state or a particular calendar; per-calendar behavior comes from `CalendarSettings`.

Dates cross the public API as `"YYYY-MM-DD"` strings (`IsoDate`). Inside, the library uses `Temporal.PlainDate` from `temporal-polyfill`, which has no time zone, so results never depend on the host's time zone. The only functions that read a clock are `todayIn` and `currentYearMonth`, and both take an optional `now`.

## Public API

| Export                                                      | What it does                                                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `parseIsoDate`                                              | Validates a `YYYY-MM-DD` date and returns it.                                                           |
| `weekdayOf`, `daysInMonth`, `isDateInMonth`, `addMonths`    | Plain-date helpers over `IsoDate` and `YearMonth`.                                                      |
| `todayIn`, `currentYearMonth`                               | Today and the current month in a calendar's time zone.                                                  |
| `firstFullWeekStart`                                        | The first day of a month's first full week for a given week start.                                      |
| `resolvePatternRule`                                        | The date a `weekOfMonth` rule makes in a month.                                                         |
| `everyWeekdayDates`, `everyNWeeksDates`                     | The dates an `everyWeekday` or `everyNWeeks` rule makes in a month.                                     |
| `expandPatternRules`                                        | Every date a list of rules makes in a month, sorted, with `inMonth` for dates past month end.           |
| `CalendarRulesError`                                        | Thrown for invalid input, with a `code` such as `INVALID_DATE` or `ANCHOR_WEEKDAY_MISMATCH`.            |
| `WEEKDAYS`, `WEEK_NUMBERINGS`, `HOLIDAY_POLICIES` and types | `PatternRule`, `CalendarSettings`, `WeekSettings`, `YearMonth` and the enums the Prisma schema mirrors. |

## Pattern rules

| Type           | Fields                                          | Makes a date on                                                                  |
| -------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| `weekOfMonth`  | `week` 1 to 4, `weekday`                        | That weekday in week N, counted as the calendar's `weekNumbering` says           |
| `everyWeekday` | `weekday`                                       | Every such weekday in the month                                                  |
| `everyNWeeks`  | `weekday`, `intervalWeeks` 2 to 8, `anchorDate` | Every Nth such weekday from the anchor, running across months in both directions |

`WEEKS_OF_MONTH`, `MIN_INTERVAL_WEEKS` and `MAX_INTERVAL_WEEKS` export these bounds, so validation code reads them instead of restating them.

## Week numbering

`CalendarSettings.weekNumbering` decides what "week N" means:

- **`FIRST_FULL_WEEK`**: week 1 is the first full week inside the month, starting on `weekStartsOn`. October 1, 2026 is a Thursday, so with Sunday weeks week 1 runs Oct 4 to 10 and the 1st Thursday is **Oct 8**, not Oct 1. Days before the first full week get no `weekOfMonth` dates, and a week-4 date can fall in the next month (the 4th Thursday of September 2026 is Oct 1), which `expandPatternRules` reports with `inMonth: false`.
- **`NTH_WEEKDAY_IN_MONTH`**: week N is days 7(N-1)+1 to 7N, as in RRULE's `BYDAY=1TH`, so the 1st Thursday of October 2026 is Oct 1. Dates never leave the month, and `weekStartsOn` is ignored.

With `FIRST_FULL_WEEK`, the week start changes results in some months. With Sunday weeks, the 1st Monday of February 2027 is Feb 8; with Monday weeks it's Feb 1.

## Commands

```bash
nx test @modules/Calendar/rules
nx typecheck @modules/Calendar/rules
nx lint @modules/Calendar/rules --fix
```

The tests don't pin `TZ`, so `TZ=Pacific/Auckland nx test @modules/Calendar/rules --skip-nx-cache` checks that results don't depend on the host time zone.
