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

import { useLocation, useParams } from "react-router-dom";

import { PublicCalendarView } from "~@parole-board/common";

import { isMonthParam } from "../api/months";
import { usePublicMonth } from "../api/usePublicMonth";
import {
  landedNotPublishedYet,
  LANDING_HREF,
  monthHref,
  usePageCount,
} from "./routes";

function Unavailable() {
  usePageCount(null);
  return (
    <PublicCalendarView
      month={null}
      status="unavailable"
      monthHref={monthHref}
      landingHref={LANDING_HREF}
    />
  );
}

function PublishedMonth({ month }: { month: string }) {
  const { data, noLongerLive } = usePublicMonth(month);
  // The landed state stays on this history entry, so coming Back to it from
  // another month shows the line again, as part of the same landing visit.
  const notPublishedYet = landedNotPublishedYet(useLocation().state);
  usePageCount(month);
  return (
    <PublicCalendarView
      month={data.month && { ...data.month, notPublishedYet }}
      status={data.status}
      noLongerLive={noLongerLive}
      monthHref={monthHref}
      landingHref={LANDING_HREF}
    />
  );
}

/**
 * A month's address, such as /2026-11. A malformed month shows the
 * unavailable state without asking the server. The "isn't published yet"
 * line shows only when the landing read that moved to this month set it.
 * Moving to another month re-renders the same view rather than remounting
 * it, so the month title changes in place and its live region announces it.
 */
export default function MonthPage() {
  const { month = "" } = useParams();
  return isMonthParam(month) ? (
    <PublishedMonth month={month} />
  ) : (
    <Unavailable />
  );
}

/** Any deeper address, such as /2026/11. */
export function NotFoundPage() {
  return <Unavailable />;
}
