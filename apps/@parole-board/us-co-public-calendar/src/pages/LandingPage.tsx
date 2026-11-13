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

import { useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  PublicCalendarSkeleton,
  PublicCalendarView,
} from "~@parole-board/common";

import {
  type PublicMonth,
  publicMonthQueryKey,
  type PublicMonthResult,
  usePublicMonth,
} from "../api/usePublicMonth";
import { usePublicCalendarServices } from "../services";
import {
  type LandedState,
  LANDING_HREF,
  monthHref,
  usePageCount,
} from "./routes";

/**
 * Replaces the landing page's history entry with month's address, so Back
 * skips it, and hands the month page this result so nothing loads twice.
 * The month page's query gets the month as its own read would return it,
 * with notPublishedYet null, and the landing read's notPublishedYet goes in
 * the history state instead. It shows the skeleton in case the month page's
 * code is still loading: the replace runs in a transition, which keeps this
 * page on screen until the month page is ready.
 */
function ReplaceWithMonth({ month }: { month: NonNullable<PublicMonth> }) {
  const { trpc } = usePublicCalendarServices();
  const navigate = useNavigate();
  useLayoutEffect(() => {
    const result: PublicMonthResult = {
      status: "ready",
      month: { ...month, notPublishedYet: null },
    };
    trpc.queryClient.setQueryData(publicMonthQueryKey(month.month), result);
    const state: LandedState = { notPublishedYet: month.notPublishedYet };
    navigate(monthHref(month.month), { replace: true, state });
  }, [month, navigate, trpc.queryClient]);
  return <PublicCalendarSkeleton />;
}

function NoMonth({ result }: { result: PublicMonthResult }) {
  usePageCount(null);
  return (
    <PublicCalendarView
      month={null}
      status={result.status}
      monthHref={monthHref}
      landingHref={LANDING_HREF}
    />
  );
}

/**
 * The bare address. The public read without a month picks the landing month,
 * and the page moves to that month's address. With nothing published it
 * stays here and shows the empty state.
 */
export default function LandingPage() {
  const { data } = usePublicMonth();
  return data.month ? (
    <ReplaceWithMonth month={data.month} />
  ) : (
    <NoMonth result={data} />
  );
}
