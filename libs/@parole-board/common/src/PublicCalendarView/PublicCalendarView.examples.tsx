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

import { injectable, withDi } from "react-magnetic-di";
import { useLocation } from "react-router-dom";
import styled from "styled-components";

import {
  publicDecember2026,
  publicJanuary2027,
  publicNovember2026,
  publicNovember2026WithCancelledMeeting,
} from "~@parole-board/common/fixtures";

import { useIsPhone } from "./PageFrame";
import { PublicCalendarLoadError } from "./PublicCalendarLoadError";
import { PublicCalendarSkeleton } from "./PublicCalendarSkeleton";
import { PublicCalendarView } from "./PublicCalendarView";
import type { PublicCalendarViewProps } from "./types";

const base: PublicCalendarViewProps = {
  month: publicDecember2026,
  monthHref: (month) => `/${month}`,
  landingHref: "/",
};

// The screen picks its phone layout from the window's width. This keeps the
// phone layout at any window size, so the example reads the same in a wide
// browser as at 375px.
const PhoneView = withDi(PublicCalendarView, [
  injectable(useIsPhone, () => true),
]);

// January 2027 with a hearing kept on Martin Luther King Jr. Day. A hearing
// on a holiday still shows, with the holiday's name below it.
const januaryWithHolidayHearing = {
  ...publicJanuary2027,
  days: publicJanuary2027.days.map((day) =>
    day.date === "2027-01-18"
      ? {
          ...day,
          entries: [{ label: "FCF", kind: "HEARING", cancelled: false }],
        }
      : day,
  ),
};

// The screen is a whole page, so it fills the frame with no padding around it.
export default { parameters: { layout: "fullscreen" } };

const MONTHS = [publicNovember2026, publicDecember2026, publicJanuary2027];

/**
 * Follows the arrows between the three fixture months. The arrows are router
 * links, so a click moves the example's router to "/YYYY-MM" rather than
 * leaving the example, and the month shown follows it.
 */
function Browsable() {
  const { pathname } = useLocation();
  const month =
    MONTHS.find((m) => `/${m.month}` === pathname) ?? publicDecember2026;
  return <PublicCalendarView {...base} month={month} />;
}

export const MiddleMonth = () => <Browsable />;

export const FirstMonth = () => (
  <PublicCalendarView {...base} month={publicNovember2026} />
);

export const LastMonth = () => (
  <PublicCalendarView {...base} month={publicJanuary2027} />
);

export const NotPublishedYet = () => (
  <PublicCalendarView
    {...base}
    month={{
      ...publicDecember2026,
      previous: null,
      notPublishedYet: "November 2026",
    }}
  />
);

export const UnavailableMonth = () => (
  <PublicCalendarView {...base} month={null} status="unavailable" />
);

export const CancelledMeeting = () => (
  <PublicCalendarView
    {...base}
    month={publicNovember2026WithCancelledMeeting}
  />
);

export const WithHolidays = () => (
  <PublicCalendarView {...base} month={januaryWithHolidayHearing} />
);

/**
 * A month that went back to draft after the page loaded it: the last grid
 * stays, greyed, under the banner, until a poll finds it published again.
 */
export const NoLongerLive = () => <PublicCalendarView {...base} noLongerLive />;

export const NoPublishedMonths = () => (
  <PublicCalendarView {...base} month={null} />
);

export const Loading = () => <PublicCalendarSkeleton />;

export const LoadError = () => <PublicCalendarLoadError />;

// A phone's width, so the example scrolls the grid at any window size.
const PhoneFrame = styled.div`
  width: 375px;
`;

/**
 * A 375px phone: the navigation under the title, and the full grid scrolling
 * sideways, opened at December's first day with sessions.
 */
export const Phone = () => (
  <PhoneFrame>
    <PhoneView {...base} />
  </PhoneFrame>
);
