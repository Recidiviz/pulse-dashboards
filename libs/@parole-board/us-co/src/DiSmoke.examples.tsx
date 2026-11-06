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
// renderer with one of common's data hooks, including a suspended and a
// failed query. Delete it once a screen's examples inject a real data hook.

import { injectable, withDi } from "react-magnetic-di";

import {
  SkeletonGroup,
  SkeletonText,
  SuspenseBoundary,
  useAddMonthOptions,
  useCalendarConfig,
} from "~@parole-board/common";
import {
  calendarApiConfig,
  calendarApiError,
  failedQuery,
  queryResult,
  suspendedQuery,
} from "~@parole-board/common/fixtures";

function DiSmoke() {
  const { data: config } = useCalendarConfig();
  const { data: options } = useAddMonthOptions();
  return (
    <p>
      {config.calendar.name}: Add month offers {options.length} months:{" "}
      {options.map((m) => `${m.year}-${m.month}`).join(", ")}
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

const useConfigDi = injectable(useCalendarConfig, () =>
  queryResult(calendarApiConfig),
);
const useOptionsDi = injectable(useAddMonthOptions, () =>
  queryResult([
    { year: 2026, month: 11 },
    { year: 2026, month: 12 },
  ]),
);
const useOptionsLoadingDi = injectable(useAddMonthOptions, suspendedQuery);
const useOptionsErrorDi = injectable(useAddMonthOptions, () =>
  failedQuery(calendarApiError("INTERNAL_SERVER_ERROR", "Network error")),
);

// Injectables every story here shares. A story spreads them and adds its own;
// for the same hook, the later entry wins.
const defaults = [useConfigDi];

const InjectedDiSmoke = withDi(DiSmokeWithBoundary, [
  ...defaults,
  useOptionsDi,
]);
const LoadingDiSmoke = withDi(DiSmokeWithBoundary, [
  ...defaults,
  useOptionsLoadingDi,
]);
const ErrorDiSmoke = withDi(DiSmokeWithBoundary, [
  ...defaults,
  useOptionsErrorDi,
]);

export default {};

// Each story renders its withDi component rather than exporting it, because
// Storybook reads the forwardRef object withDi returns as a story object and
// calls its inner render function with the wrong arguments.
export const Injected = () => <InjectedDiSmoke />;

export const Loading = () => <LoadingDiSmoke />;

export const LoadError = () => <ErrorDiSmoke />;
