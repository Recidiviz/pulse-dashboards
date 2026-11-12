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

import { lazy } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";

import type { YearMonthOption } from "~@parole-board/common";
import { StatusMessage } from "~@parole-board/common";
import {
  AdminPageSkeleton,
  SuspenseBoundary,
} from "~@parole-board/common/loading";

import { MONTH_LOAD_ERROR_TITLE, renderCalendarError } from "./loadErrors";
import { parseYearMonthParam, toYearMonthParam } from "./model/month";
import { useCurrentYearMonth } from "./model/useCurrentYearMonth";
import { useMonthSkeleton } from "./model/useMonthSkeleton";

const ParoleCalendarAdminView = lazy(() =>
  import("./ParoleCalendarAdminView").then((module) => ({
    default: module.ParoleCalendarAdminView,
  })),
);

/**
 * One month's screen. The page skeleton shows only on the first load, while
 * the view's code, the calendar config and the month list load; changing
 * month after that keeps the header on screen, and only the month's own
 * section shows a skeleton, and only when that month isn't cached.
 */
export function MonthPage({ viewed }: { viewed: YearMonthOption }) {
  const skeleton = useMonthSkeleton(viewed);
  return (
    <SuspenseBoundary
      fallback={<AdminPageSkeleton {...skeleton} />}
      errorTitle={MONTH_LOAD_ERROR_TITLE}
      renderError={renderCalendarError}
      resetKeys={[toYearMonthParam(viewed)]}
    >
      <ParoleCalendarAdminView viewed={viewed} />
    </SuspenseBoundary>
  );
}

// Both redirects keep the query string, so the host's links can carry the
// tenant (the staff app's ?tenantId=) to the month they land on.
function RedirectToCurrentMonth() {
  const current = useCurrentYearMonth();
  const location = useLocation();
  return (
    <Navigate
      replace
      to={{ pathname: toYearMonthParam(current), search: location.search }}
    />
  );
}

function MonthRoute() {
  const { yearMonth } = useParams();
  const location = useLocation();
  const viewed = parseYearMonthParam(yearMonth);
  if (!viewed) {
    return (
      <Navigate replace to={{ pathname: "..", search: location.search }} />
    );
  }
  return <MonthPage viewed={viewed} />;
}

/**
 * The admin tool's routes, relative to wherever the host mounts it (the
 * staff app uses /parole/public-calendar/*): the index redirects to the
 * current month in the calendar's timezone, "2026-10" shows that month, and
 * a malformed month redirects to the index.
 */
export function AdminRoutes() {
  return (
    <Routes>
      <Route
        index
        element={
          <SuspenseBoundary
            fallback={<AdminPageSkeleton />}
            renderError={renderCalendarError}
          >
            <RedirectToCurrentMonth />
          </SuspenseBoundary>
        }
      />
      <Route path=":yearMonth" element={<MonthRoute />} />
      <Route
        path="*"
        element={<StatusMessage title="This page doesn't exist." />}
      />
    </Routes>
  );
}
