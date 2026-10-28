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

// Checks that the react-magnetic-di Babel plugin and withDi work in this
// renderer, including a suspended and a failed query. Delete it once a
// screen's examples inject a real data hook.

import { useSuspenseQuery } from "@tanstack/react-query";
import { injectable, withDi } from "react-magnetic-di";

import {
  SkeletonGroup,
  SkeletonText,
  SuspenseBoundary,
  useCalendarCode,
} from "~@parole-board/common";
import {
  failedQuery,
  queryResult,
  suspendedQuery,
} from "~@parole-board/common/fixtures";

// common has no data hooks until CO-869, so the smoke component calls
// useSuspenseQuery itself and the examples inject it. The Babel plugin only
// wraps imported values, so a hook declared in this file couldn't be injected.
function DiSmoke() {
  const calendarCode = useCalendarCode();
  const { data } = useSuspenseQuery<string[]>({
    queryKey: ["di-smoke"],
    queryFn: () => {
      throw new Error("useSuspenseQuery was not injected");
    },
  });
  return (
    <p>
      {calendarCode} has {data.length} months: {data.join(", ")}
    </p>
  );
}

function DiSmokeWithBoundary() {
  return (
    <SuspenseBoundary
      fallback={
        <SkeletonGroup label="Loading months">
          <SkeletonText width="50%" level="Sans16" />
        </SkeletonGroup>
      }
    >
      <DiSmoke />
    </SuspenseBoundary>
  );
}

const useCalendarCodeDi = injectable(useCalendarCode, () => "INJECTED_CODE");
const useQueryDi = injectable(useSuspenseQuery, () =>
  queryResult(["2026-09", "2026-10"]),
);
const useQueryLoadingDi = injectable(useSuspenseQuery, suspendedQuery);
const useQueryErrorDi = injectable(useSuspenseQuery, () =>
  failedQuery(new Error("Network error")),
);

// Injectables every story here shares. A story spreads them and adds its own;
// for the same hook, the later entry wins.
const defaults = [useCalendarCodeDi];

const InjectedDiSmoke = withDi(DiSmokeWithBoundary, [...defaults, useQueryDi]);
const LoadingDiSmoke = withDi(DiSmokeWithBoundary, [
  ...defaults,
  useQueryLoadingDi,
]);
const ErrorDiSmoke = withDi(DiSmokeWithBoundary, [
  ...defaults,
  useQueryErrorDi,
]);

export default {};

// Each story renders its withDi component rather than exporting it, because
// Storybook reads the forwardRef object withDi returns as a story object and
// calls its inner render function with the wrong arguments.
export const Injected = () => <InjectedDiSmoke />;

export const Loading = () => <LoadingDiSmoke />;

export const LoadError = () => <ErrorDiSmoke />;
