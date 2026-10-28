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

import { semantics } from "../theme";
import { Skeleton, SkeletonGroup, SkeletonText } from "./Skeleton";

const { border, space, stroke, surface } = semantics;

// The DS Button's block-shape minimum height, for the month controls.
const CONTROL_HEIGHT = rem(space.xl);
// The DS Button's default pill-shape minimum height, for the page actions.
const ACTION_HEIGHT = rem(40);

// Layout sizes, not tokens: the rough widths of the text and buttons each
// block stands in for, in the layout of the Public Calendar screen in the
// Calendar Unit Dashboard design.
const WIDTH = {
  eyebrow: rem(120),
  month: rem(128),
  status: rem(96),
  title: rem(272),
  secondaryAction: rem(120),
  primaryAction: rem(144),
  stats: rem(224),
};
// The grid area holds a five-week grid's height until the grid's own
// skeleton fills it (CO-829).
const PANEL_MIN_HEIGHT = rem(912);

const LOADING_LABEL = "Loading the calendar";

// The page and its body grow to the host's height, so the grid area runs to
// the bottom.
const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: ${surface.page};
`;

const Header = styled.div`
  padding: ${rem(space.lg)} ${rem(space.xl)} ${rem(space.md)};
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

const Body = styled.div`
  flex: 1;
  padding: ${rem(space.lg)};
`;

const Stats = styled.div`
  display: flex;
  margin-bottom: ${rem(space.md)};
`;

// The grid area. CalendarGridSkeleton fills it once the grid lands in this
// library (CO-829); until then it holds the grid's size.
const Panel = styled.div`
  min-height: ${PANEL_MIN_HEIGHT};
  background: ${surface.card};
  border: ${stroke.default} solid ${border.faint};
`;

/**
 * The skeleton for an admin page while it loads: the header with the month
 * controls, title and actions, then the month stats and the grid area. It
 * follows the layout of the Public Calendar screen in the Calendar Unit
 * Dashboard design, below the host app's own header, with ~design-system
 * typography and spacing. A host app shows it while the admin tool's code
 * loads, and a screen shows it while its month loads.
 */
export function AdminPageSkeleton() {
  return (
    <SkeletonGroup label={LOADING_LABEL}>
      <Page>
        <Header>
          <Row>
            <SkeletonText width={WIDTH.eyebrow} level="Sans12" />
            <Divider />
            <Skeleton width={CONTROL_HEIGHT} height={CONTROL_HEIGHT} />
            <Skeleton width={WIDTH.month} height={CONTROL_HEIGHT} />
            <Skeleton width={CONTROL_HEIGHT} height={CONTROL_HEIGHT} />
            <Skeleton width={WIDTH.status} height={rem(space.lg)} />
          </Row>
          <TitleRow>
            <SkeletonText width={WIDTH.title} level="Serif34" />
            <Actions>
              <Skeleton
                width={WIDTH.secondaryAction}
                height={ACTION_HEIGHT}
                pill
              />
              <Skeleton
                width={WIDTH.primaryAction}
                height={ACTION_HEIGHT}
                pill
              />
            </Actions>
          </TitleRow>
        </Header>
        <Body>
          <Stats>
            <SkeletonText width={WIDTH.stats} level="Sans14" />
          </Stats>
          <Panel />
        </Body>
      </Page>
    </SkeletonGroup>
  );
}
