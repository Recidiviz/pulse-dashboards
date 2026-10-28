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

const { border, space, stroke, surface } = semantics;

const DAYS_IN_WEEK = 7;

// How many chip placeholders each day shows, by week then weekday (Sunday
// first), so the skeleton reads as a month with a few sessions a day, as the
// design's draft month does. Weekends stay empty, as they do in the design.
// The skeleton can't know how many entries a day will hold, so it's shorter
// than a loaded month with a crowded day.
const CHIP_PATTERN = [
  [0, 1, 2, 2, 3, 1, 0],
  [0, 2, 2, 2, 2, 1, 0],
  [0, 1, 2, 1, 3, 2, 0],
  [0, 1, 2, 2, 1, 1, 0],
  [0, 2, 1, 2, 2, 1, 0],
  [0, 1, 2, 2, 1, 1, 0],
];

// The list view shows only days with sessions, each heading its chips.
const LIST_DAYS = [
  { id: "day-1", chips: 3 },
  { id: "day-2", chips: 2 },
  { id: "day-3", chips: 3 },
  { id: "day-4", chips: 2 },
];

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

// Cells are 1px taller than the design's minimum, as CalendarGrid's are,
// because each draws its own grid line inside it.
const DayCell = styled.div<{ $weekend: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${rem(CHIP_GAP)};
  min-height: ${rem(DAY_MIN_HEIGHT + space.xxs)};
  box-sizing: border-box;
  padding: ${rem(CELL_PADDING_Y)} ${rem(CELL_PADDING_X)};
  background: ${({ $weekend }) => ($weekend ? surface.muted : surface.bg)};
  box-shadow: ${hairline};
`;

// A chip's box, padding and left rule, holding a bar for its label. The rule
// is border.default rather than a loaded chip's border.action, so a
// placeholder doesn't read as a loaded session.
const ChipShape = styled.div`
  padding: ${rem(CHIP_PADDING_Y)} ${rem(CHIP_PADDING_X)};
  background: ${CHIP_BACKGROUND};
  border-left: ${thickRule} solid ${border.default};
`;

const DayNumber = styled.div`
  margin-bottom: ${rem(NUMBER_GAP - CHIP_GAP)};
`;

const ListDay = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(CHIP_GAP)};
  padding: ${rem(space.sm)} 0 ${rem(space.xs)};
`;

function isWeekend(column: number, firstDay: number) {
  const day = (firstDay + column) % DAYS_IN_WEEK;
  return day === 0 || day === 6;
}

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

/**
 * The month grid's placeholder shape with no loading status of its own, for a
 * page skeleton that already announces one.
 */
export function MonthGridShape({
  firstDay = 0,
  weeks = 5,
}: {
  firstDay?: number;
  weeks?: number;
}) {
  const columns = Array.from({ length: DAYS_IN_WEEK }, (_, i) => i);
  return (
    <Grid>
      {columns.map((column) => (
        <HeaderCell key={column}>
          <SkeletonText width={24} level="Sans12" />
        </HeaderCell>
      ))}
      {Array.from({ length: weeks }, (_, week) =>
        columns.map((column) => {
          const weekend = isWeekend(column, firstDay);
          const pattern = CHIP_PATTERN[week % CHIP_PATTERN.length];
          const weekday = (firstDay + column) % DAYS_IN_WEEK;
          return (
            <DayCell key={`${week}-${column}`} $weekend={weekend}>
              <DayNumber>
                <SkeletonText width={14} level="Sans14" />
              </DayNumber>
              <Chips count={weekend ? 0 : pattern[weekday]} />
            </DayCell>
          );
        }),
      )}
    </Grid>
  );
}

/**
 * The placeholder CalendarGrid's SuspenseBoundary shows while a month loads:
 * the month grid's weekday header and day cells, with day numbers and a few
 * session chips, at the grid's sizes from the Calendar Unit Dashboard design.
 * Pass the same view and firstDay as the CalendarGrid it stands in for; weeks
 * defaults to the five a month most often spans.
 */
export function CalendarGridSkeleton({
  view = "month",
  firstDay = 0,
  weeks = 5,
}: {
  view?: "month" | "list";
  firstDay?: number;
  weeks?: number;
}) {
  if (view === "list") {
    return (
      <SkeletonGroup label="Loading the month">
        {LIST_DAYS.map(({ id, chips }) => (
          <ListDay key={id}>
            <SkeletonText width={120} level="Sans12" />
            <Chips count={chips} />
          </ListDay>
        ))}
      </SkeletonGroup>
    );
  }

  return (
    <SkeletonGroup label="Loading the month">
      <MonthGridShape firstDay={firstDay} weeks={weeks} />
    </SkeletonGroup>
  );
}
