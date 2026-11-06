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
| `describePatternRules`                                      | Display text such as "1st and 2nd Monday" or "Every 3 weeks on Friday from Sep 4, 2026".                |
| `patternRulesSchema`, `parsePatternRules`                   | Check a pattern's stored or submitted rules: 1 to 28 valid rules with no repeats.                       |
| `CalendarRulesError`                                        | Thrown for invalid input, with a `code` such as `INVALID_DATE` or `INVALID_RULE`.                       |
| `WEEKDAYS`, `WEEK_NUMBERINGS`, `HOLIDAY_POLICIES` and types | `PatternRule`, `CalendarSettings`, `WeekSettings`, `YearMonth` and the enums the Prisma schema mirrors. |

## Pattern rules

| Type           | Fields                                          | Makes a date on                                                                  |
| -------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| `weekOfMonth`  | `week` 1 to 4, `weekday`                        | That weekday in week N, counted as the calendar's `weekNumbering` says           |
| `everyWeekday` | `weekday`                                       | Every such weekday in the month                                                  |
| `everyNWeeks`  | `weekday`, `intervalWeeks` 2 to 8, `anchorDate` | Every Nth such weekday from the anchor, running across months in both directions |

`WEEKS_OF_MONTH`, `MIN_INTERVAL_WEEKS` and `MAX_INTERVAL_WEEKS` export these bounds, so validation code reads them instead of restating them.

`patternRuleSchema` in `src/rules.ts`, which is internal, is the one definition of a valid rule. Every function that takes rules checks them with it, and so does `patternRulesSchema`. A rule it rejects, such as one with a key its type doesn't have or an `everyNWeeks` anchor on another weekday, throws `INVALID_RULE` with a message naming the field, e.g. `anchorDate: 2026-09-03 is a THURSDAY, not a FRIDAY`.

## Week numbering

`CalendarSettings.weekNumbering` decides what "week N" means:

- **`FIRST_FULL_WEEK`**: week 1 is the first full week inside the month, starting on `weekStartsOn`. October 1, 2026 is a Thursday, so with Sunday weeks week 1 runs Oct 4 to 10 and the 1st Thursday is **Oct 8**, not Oct 1. Days before the first full week get no `weekOfMonth` dates, and a week-4 date can fall in the next month (the 4th Thursday of September 2026 is Oct 1), which `expandPatternRules` reports with `inMonth: false`.
- **`NTH_WEEKDAY_IN_MONTH`**: week N is days 7(N-1)+1 to 7N, as in RRULE's `BYDAY=1TH`, so the 1st Thursday of October 2026 is Oct 1. Dates never leave the month, and `weekStartsOn` is ignored.

With `FIRST_FULL_WEEK`, the week start changes results in some months. With Sunday weeks, the 1st Monday of February 2027 is Feb 8; with Monday weeks it's Feb 1.

## Holidays

`getHolidays` and `staticHolidaySource` are public. The default source, `getDefaultHolidaySource(holidayRegion)`, is server-only: import it from `~@modules/Calendar/rules/holidays/defaultHolidaySource`, never from `index.ts`. It computes a calendar's public weekday holidays with [date-holidays](https://github.com/commenthol/date-holidays), pinned to an exact version, for any region the package knows, such as `US-CO`. The package bundles data for every country, so it must stay out of client bundles. A test pins the `US-CO` result to Colorado DHR's published list in `dhrHolidays.ts` (RFC B).

Holiday data from [date-holidays](https://github.com/commenthol/date-holidays) by commenthol and contributors, drawn largely from Wikipedia articles, which its `LICENSE` file lists. The package's `LICENSE` puts the data under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/); its `package.json` declares CC-BY-3.0. The library code is ISC.

## Commands

```bash
nx test @modules/Calendar/rules
nx typecheck @modules/Calendar/rules
nx lint @modules/Calendar/rules --fix
```

The tests don't pin `TZ`, so `TZ=Pacific/Auckland nx test @modules/Calendar/rules --skip-nx-cache` checks that results don't depend on the host time zone.

## A state's code

A calendar's settings (timezone, week start, week numbering, holiday region and policy, editor route, allowed weekdays) and its entry types' behaviour are its state's code, not database columns. The calendar's code passes the generic engine a `CalendarRules` object holding both, so the engine never looks a calendar up by name. Each state's code lives in a `us_<state>/<calendar>` folder inside this library, imported as `~@modules/Calendar/rules/us_co/parole_board`:

| Export                                                      | What it is                                                                                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `US_CO_PAROLE_BOARD`                                        | The Calendar row Colorado's API is fixed to: `US_CO`, `PAROLE_BOARD_PUBLIC`.                                                                      |
| `US_CO_PAROLE_BOARD_SETTINGS`, `US_CO_PAROLE_BOARD_RULES`   | Its settings (America/Denver, Monday weeks, NTH_WEEKDAY_IN_MONTH, US-CO with WARN, `publicCalendar` route, Monday to Friday only) plus its rules. |
| `US_CO_PAROLE_BOARD_ENTRY_TYPES`, `UsCoParoleBoardKindCode` | HEARING, FULL_BOARD and BUSINESS_MEETING with their behaviour; a Business Meeting can be cancelled but never deleted.                             |
| `adjustUsCoParoleBoardDraft`                                | Colorado's changes to a generated draft: the 3rd Thursday is a Full Board day unless a Monday holiday moves hearings onto it.                     |
| `US_CO_REFERENCE_DATA`                                      | The calendar's initial rows as a typed test fixture: identity, resource types, kind rows, the 37 hearing locations and their patterns.            |

The seed SQL in `libs/@modules/Calendar/prisma/prisma/seeds` owns the database's rows, so `US_CO_REFERENCE_DATA` may drift from them. The Calendar router's database tests (`__tests__/db/us_co/parole_board/usCoSeed.test.ts`, run with `nx test-db @modules/Calendar/router`) apply every Calendar migration and then every seed file, twice, to a fresh database on the Calendar test Postgres, and check that the seeded rows parse with `parseCalendarConfig` and fit Colorado's entry types; they never compare the database with the fixture. Lint stops code outside a `us_co` folder from importing one, so the generic code never depends on a state.
