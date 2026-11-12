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

import type { YearMonthOption } from "../api/types";
import {
  type ChipsOn,
  MonthGridShape,
  MonthListShape,
} from "../CalendarGrid/CalendarGridSkeleton";
import { semantics } from "../theme";
import { Skeleton, SkeletonGroup, SkeletonText } from "./Skeleton";

const { border, size, space, stroke, surface } = semantics;

// The DS Button's block-shape minimum height, for the month controls.
const CONTROL_HEIGHT = rem(space.xl);

// Layout sizes, not tokens: the rough widths of the text and buttons each
// block stands in for, in the layout of the Public Calendar screen in the
// Calendar Unit Dashboard design.
const WIDTH = {
  eyebrow: rem(120),
  month: rem(128),
  addMonth: rem(104),
  title: rem(272),
  // Add hearing and Review & Publish as the DS Button draws them.
  secondaryAction: rem(129),
  primaryAction: rem(142),
  stats: rem(224),
};

// The page and its body grow to the host's height, so the grid area runs to
// the bottom.
const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: ${surface.page};
`;

// The same padding as MonthHeader's frame.
const Header = styled.div`
  padding: ${rem(space.lg)} ${rem(space.xl)};
  background: ${surface.bg};
  border-bottom: ${stroke.default} solid ${border.faint};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(space.md)};
`;

// The rule between the eyebrow and the month controls.
const Divider = styled.span`
  width: ${stroke.default};
  height: ${rem(space.md)};
  background: ${border.default};
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${rem(space.sm)};
  margin-top: ${rem(space.sm)};
`;

const Actions = styled(Row)`
  gap: ${rem(space.sm)};
`;

// The grey band below the header that holds the month's counts and grid, as
// in the design.
const Section = styled.div`
  flex: 1;
  padding: ${rem(space.lg)} ${rem(space.lg)} ${rem(space.xl)};
  background: ${surface.muted};
`;

// Grows like Section, so the loading status fills the page below the header.
const SectionGroup = styled(SkeletonGroup)`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

// As tall as the counts row, which keeps a control's height for the action
// bar.
const Stats = styled.div`
  display: flex;
  align-items: center;
  min-height: ${size.control};
  margin-bottom: ${rem(space.md)};
`;

/**
 * Placeholders for the header's page actions, such as Add hearing and Review
 * & Publish, at the DS Button's pill size. The header shows them while the
 * month that decides its actions loads.
 */
export function PageActionsSkeleton() {
  return (
    <Actions>
      <Skeleton width={WIDTH.secondaryAction} height={size.control} pill />
      <Skeleton width={WIDTH.primaryAction} height={size.control} pill />
    </Actions>
  );
}

type MonthShapeProps = {
  /** The month loading, which sets the grid's weeks and days. */
  month?: YearMonthOption;
  /** The entries a state's calendar expects on each day, as chips. */
  chipsOn?: ChipsOn;
  /** "list" on a narrow screen, where the calendar shows its list view. */
  view?: "month" | "list";
};

/** The month section's shape: the counts line and the grid or list. */
function MonthSectionShape({ view = "month", ...shape }: MonthShapeProps) {
  return (
    <Section>
      <Stats>
        <SkeletonText width={WIDTH.stats} level="Sans14" />
      </Stats>
      {view === "list" ? (
        <MonthListShape {...shape} />
      ) : (
        <MonthGridShape {...shape} />
      )}
    </Section>
  );
}

/**
 * The skeleton for the month section below the header while a month that
 * isn't cached loads: the counts line and the grid, with month's weeks and
 * chipsOn's chips on each day. The header stays on screen above it.
 */
export function MonthSectionSkeleton(
  props: MonthShapeProps & { month: YearMonthOption },
) {
  return (
    <SectionGroup label="Loading the month">
      <MonthSectionShape {...props} />
    </SectionGroup>
  );
}

/**
 * The skeleton for an admin page while it loads: the header with the month
 * controls, "+ Add month", the title and the page actions, then the month
 * section's counts and grid. It follows the layout of the Public Calendar
 * screen in the Calendar Unit Dashboard design, below the host app's own
 * header, with ~design-system typography and spacing. A screen shows it on
 * its first load, with the month from the URL so the grid has that month's
 * weeks, and the state's chipsOn so each day is as tall as it will be. A
 * host app shows it while the admin tool's code loads, before any month is
 * known, and the grid then has five weeks, the number a month most often
 * spans.
 */
export function AdminPageSkeleton(props: MonthShapeProps) {
  return (
    <SkeletonGroup label="Loading the calendar">
      <Page>
        <Header>
          <Row>
            <SkeletonText width={WIDTH.eyebrow} level="Sans12" />
            <Divider />
            <Skeleton width={CONTROL_HEIGHT} height={CONTROL_HEIGHT} />
            <Skeleton width={WIDTH.month} height={CONTROL_HEIGHT} />
            <Skeleton width={CONTROL_HEIGHT} height={CONTROL_HEIGHT} />
            <Skeleton width={WIDTH.addMonth} height={CONTROL_HEIGHT} />
          </Row>
          <TitleRow>
            <SkeletonText width={WIDTH.title} level="Serif34" />
            <PageActionsSkeleton />
          </TitleRow>
        </Header>
        <MonthSectionShape {...props} />
      </Page>
    </SkeletonGroup>
  );
}
