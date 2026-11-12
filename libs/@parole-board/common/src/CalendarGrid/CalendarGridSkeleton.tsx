// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { rem } from "polished";
import styled from "styled-components";
import { Temporal } from "temporal-polyfill";

import { SkeletonGroup, SkeletonText } from "../loading/Skeleton";
import { semantics } from "../theme";
import {
  CELL_PADDING_X,
  CELL_PADDING_Y,
  CHIP_BACKGROUND,
  CHIP_GAP,
  CHIP_PADDING_X,
  CHIP_PADDING_Y,
  DAY_MIN_HEIGHT,
  HEADER_PADDING_Y,
  NUMBER_GAP,
  thickRule,
} from "./CalendarGrid.styles";
import type { CalendarMonthRef } from "./types";

const { border, space, stroke, surface } = semantics;

const DAYS_IN_WEEK = 7;

// The weeks a month most often spans, for a grid drawn before its month is
// known.
const DEFAULT_WEEKS = 5;

/**
 * How many entries the skeleton draws on a day, given its "YYYY-MM-DD" date.
 * A state's calendar passes its expected sessions per day, so the skeleton
 * is as tall as the month it stands in for.
 */
export type ChipsOn = (isoDate: string) => number;

// With no chipsOn, a few chips a day by week then weekday (Sunday first), so
// the skeleton still reads as a month of sessions. Weekends stay empty, as
// they do in the design.
const CHIP_PATTERN = [
  [0, 1, 2, 2, 3, 1, 0],
  [0, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 1, 3, 2, 0],
  [0, 1, 2, 2, 1, 1, 0],
  [0, 2, 1, 2, 2, 1, 0],
  [0, 1, 2, 2, 1, 1, 0],
];

// With no month or no chipsOn, the list view shows four days.
const LIST_DAYS = [3, 2, 3, 2];

/** One cell of the skeleton's grid. */
type SkeletonDay = {
  key: string;
  /** Sunday is 0. */
  weekday: number;
  /** False for a day before or after the month, which the grid leaves blank. */
  inMonth: boolean;
  chips: number;
};

/**
 * How many week rows the grid needs for month when its weeks start on
 * firstDay (Sunday is 0): the blank days before the 1st plus the month's
 * days, in whole weeks. CalendarGrid draws no rows past the month's last
 * week.
 */
export function weeksInMonth(
  { year, month }: CalendarMonthRef,
  firstDay = 0,
): number {
  const first = Temporal.PlainDate.from({ year, month, day: 1 });
  return Math.ceil(
    (leadingDays(first, firstDay) + first.daysInMonth) / DAYS_IN_WEEK,
  );
}

// Temporal numbers days 1 (Monday) to 7 (Sunday); the grid counts Sunday as 0.
const sundayFirst = (date: Temporal.PlainDate) => date.dayOfWeek % DAYS_IN_WEEK;

function leadingDays(first: Temporal.PlainDate, firstDay: number) {
  return (sundayFirst(first) - firstDay + DAYS_IN_WEEK) % DAYS_IN_WEEK;
}

const isWeekend = (weekday: number) => weekday === 0 || weekday === 6;

function chipsFor(
  date: Temporal.PlainDate | undefined,
  week: number,
  weekday: number,
  chipsOn: ChipsOn | undefined,
) {
  if (date && chipsOn) return chipsOn(date.toString());
  if (isWeekend(weekday)) return 0;
  return CHIP_PATTERN[week % CHIP_PATTERN.length][weekday];
}

/** The skeleton's cells, week by week. */
function skeletonWeeks(
  month: CalendarMonthRef | undefined,
  firstDay: number,
  chipsOn: ChipsOn | undefined,
): SkeletonDay[][] {
  const first = month
    ? Temporal.PlainDate.from({ ...month, day: 1 })
    : undefined;
  const weeks = month ? weeksInMonth(month, firstDay) : DEFAULT_WEEKS;
  const gridStart = first?.subtract({ days: leadingDays(first, firstDay) });

  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: DAYS_IN_WEEK }, (_, column) => {
      const weekday = (firstDay + column) % DAYS_IN_WEEK;
      const date = gridStart?.add({ days: week * DAYS_IN_WEEK + column });
      const inMonth = !date || date.month === month?.month;
      const chips = inMonth ? chipsFor(date, week, weekday, chipsOn) : 0;
      return { key: `${week}-${column}`, weekday, inMonth, chips };
    }),
  );
}

const hairline = `inset -${stroke.default} -${stroke.default} 0 ${border.default}`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(${DAYS_IN_WEEK}, minmax(0, 1fr));
  border-top: ${stroke.default} solid ${border.default};
  border-left: ${stroke.default} solid ${border.default};
`;

const HeaderCell = styled.div`
  padding: ${rem(HEADER_PADDING_Y)} ${rem(CELL_PADDING_X)};
  background: ${surface.bg};
  box-shadow: ${hairline};
`;

// The same box as CalendarGrid's day: 1px taller than the design's minimum,
// because each cell draws its own grid line inside it, and padded as the
// grid pads its top and bottom parts, so a day with the same chips is as
// tall as the loaded day.
const DayCell = styled.div<{ $muted: boolean }>`
  min-height: ${rem(DAY_MIN_HEIGHT + space.xxs)};
  box-sizing: border-box;
  padding: ${rem(CELL_PADDING_Y)} ${rem(CELL_PADDING_X)}
    ${rem(CELL_PADDING_Y + space.xxs)};
  background: ${({ $muted }) => ($muted ? surface.muted : surface.bg)};
  box-shadow: ${hairline};
`;

const DayNumber = styled.div`
  margin-bottom: ${rem(NUMBER_GAP)};
`;

// A chip's box, padding, left rule and the gap below it, holding a bar for
// its label. The rule is border.default rather than a loaded chip's
// border.action, so a placeholder doesn't read as a loaded session.
const ChipShape = styled.div`
  margin-bottom: ${rem(CHIP_GAP)};
  padding: ${rem(CHIP_PADDING_Y)} ${rem(CHIP_PADDING_X)};
  background: ${CHIP_BACKGROUND};
  border-left: ${thickRule} solid ${border.default};
`;

// The list view's day heading, padded as CalendarGrid's list day header,
// with its date and weekday lines.
const ListDayHeading = styled.div`
  padding: ${rem(space.sm)} 0 ${rem(space.xs)};
`;

function Chips({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => `chip-${i}`).map((id) => (
        <ChipShape key={id}>
          <SkeletonText width="60%" level="Sans12" />
        </ChipShape>
      ))}
    </>
  );
}

type ShapeProps = {
  /** The month the skeleton stands in for, which sets its weeks and days. */
  month?: CalendarMonthRef;
  /** Entries per day; without it, a few chips a weekday. */
  chipsOn?: ChipsOn;
  /** The grid's first weekday, Sunday as 0, as CalendarGrid takes it. */
  firstDay?: number;
};

/**
 * The month grid's placeholder shape with no loading status of its own, for a
 * page skeleton that already announces one. With a month it has that
 * month's weeks, blank days outside the month, and chipsOn's chips on each
 * day; without one, five weeks.
 */
export function MonthGridShape({ month, chipsOn, firstDay = 0 }: ShapeProps) {
  const weeks = skeletonWeeks(month, firstDay, chipsOn);
  return (
    <Grid>
      {weeks[0].map(({ key }) => (
        <HeaderCell key={key}>
          <SkeletonText width={24} level="Sans12" />
        </HeaderCell>
      ))}
      {weeks.flat().map(({ key, weekday, inMonth, chips }) => (
        <DayCell key={key} $muted={!inMonth || isWeekend(weekday)}>
          {inMonth && (
            <>
              <DayNumber>
                <SkeletonText width={14} level="Sans14" />
              </DayNumber>
              <Chips count={chips} />
            </>
          )}
        </DayCell>
      ))}
    </Grid>
  );
}

/**
 * The list view's placeholder shape, as CalendarGrid draws it on a narrow
 * screen: each day with sessions under its heading. With a month and
 * chipsOn, the days are the month's days with chips; otherwise four days.
 */
export function MonthListShape({ month, chipsOn }: ShapeProps) {
  const days =
    month && chipsOn
      ? skeletonWeeks(month, 0, chipsOn)
          .flat()
          .filter(({ chips }) => chips > 0)
      : LIST_DAYS.map((chips, i) => ({ key: `day-${i}`, chips }));
  return (
    <>
      {days.map(({ key, chips }) => (
        <div key={key}>
          <ListDayHeading>
            <SkeletonText width={120} level="Sans12" />
            <SkeletonText width={72} level="Sans12" />
          </ListDayHeading>
          <Chips count={chips} />
        </div>
      ))}
    </>
  );
}

/**
 * The placeholder CalendarGrid's SuspenseBoundary shows while a month loads:
 * the month grid's weekday header and day cells, with day numbers and
 * session chips, at the grid's sizes from the Calendar Unit Dashboard design,
 * or the list view's days. Pass the same view, month and firstDay as the
 * CalendarGrid it stands in for, and chipsOn for the sessions a day usually
 * holds.
 */
export function CalendarGridSkeleton({
  view = "month",
  ...shape
}: ShapeProps & { view?: "month" | "list" }) {
  return (
    <SkeletonGroup label="Loading the month">
      {view === "list" ? (
        <MonthListShape {...shape} />
      ) : (
        <MonthGridShape {...shape} />
      )}
    </SkeletonGroup>
  );
}
