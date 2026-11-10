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

import type { inferRouterInputs } from "@trpc/server";

import {
  LAST_UPDATED_FILTER_LABEL_TO_VALUE,
  LAST_UPDATED_FILTER_OPTIONS,
  type LastUpdatedFilterDisplayLabel,
  RELEASE_DATE_FILTER_OPTIONS,
  type ReleaseDateFilterOption,
  USER_ROLE,
  type UserRole,
} from "~@idaho-th/shared";
import type { AppRouter } from "~@idaho-th/trpc-types";

export { LAST_UPDATED_FILTER_OPTIONS, RELEASE_DATE_FILTER_OPTIONS };
export type {
  LastUpdatedFilterDisplayLabel as LastUpdatedFilterOption,
  ReleaseDateFilterOption,
};

export const STAGE_FILTER_OPTIONS = [
  "Draft",
  "Application",
  "Approvals",
  "Release",
  "Closed",
] as const;

export const STATUS_FILTER_OPTIONS = [
  "Waiting On",
  "Waiting on Parole Board",
  "Waiting on P&P",
  "Awaiting Release",
  "Action Needed",
  "Ready",
] as const;

export const STAFF_STATUS_FILTER_OPTIONS: readonly StatusFilterOption[] = [
  "Waiting On",
  "Waiting on Parole Board",
  "Waiting on P&P",
  "Awaiting Release",
  "Action Needed",
  "Ready",
];

export const PROVIDER_STATUS_FILTER_OPTIONS: readonly StatusFilterOption[] = [
  "Waiting On",
  "Action Needed",
  "Ready",
  "Awaiting Release",
];

export type StageFilterOption = (typeof STAGE_FILTER_OPTIONS)[number];
export type StatusFilterOption = (typeof STATUS_FILTER_OPTIONS)[number];

export const STAGE_FILTER_TO_VALUE: Record<StageFilterOption, string> = {
  Draft: "DRAFT",
  Application: "APPLICATION",
  Approvals: "APPROVALS",
  Release: "RELEASE",
  Closed: "CLOSED",
};

type StatusFilterValueMap = Partial<Record<StatusFilterOption, string[]>>;

const STAFF_STATUS_FILTER_TO_VALUES: StatusFilterValueMap = {
  "Waiting On": ["WAITING"],
  "Waiting on Parole Board": ["WAITING_ON_PAROLE_BOARD"],
  "Waiting on P&P": ["WAITING_ON_PP"],
  "Awaiting Release": ["AWAITING_RELEASE"],
  "Action Needed": ["ACTION_NEEDED"],
  Ready: ["DONE"],
};

const PROVIDER_STATUS_FILTER_TO_VALUES: StatusFilterValueMap = {
  "Waiting On": ["WAITING"],
  "Action Needed": ["ACTION_NEEDED"],
  Ready: ["DONE"],
  "Awaiting Release": ["AWAITING_RELEASE"],
};

export const LAST_UPDATED_FILTER_TO_VALUE = LAST_UPDATED_FILTER_LABEL_TO_VALUE;

export type ApplicationsTableFilters = {
  releaseDate: ReleaseDateFilterOption[];
  stage: StageFilterOption[];
  status: StatusFilterOption[];
  lastUpdated: LastUpdatedFilterDisplayLabel[];
  homePlan: boolean;
};

export const EMPTY_APPLICATIONS_TABLE_FILTERS: ApplicationsTableFilters = {
  releaseDate: [],
  stage: [],
  status: [],
  lastUpdated: [],
  homePlan: false,
};

export function hasActiveFilters(filters: ApplicationsTableFilters): boolean {
  return Object.values(filters).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value),
  );
}

export type ApplicationFilters = NonNullable<
  inferRouterInputs<AppRouter>["housingApplication"]["getByStaff"]["filters"]
>;

export function buildApplicationFilters(
  filters: ApplicationsTableFilters,
  role: UserRole,
): ApplicationFilters {
  const result: ApplicationFilters = {};

  if (filters.stage.length > 0) {
    result.stage = filters.stage.map((s) => STAGE_FILTER_TO_VALUE[s]);
  }

  if (filters.status.length > 0) {
    const statusToValues =
      role === USER_ROLE.STAFF
        ? STAFF_STATUS_FILTER_TO_VALUES
        : PROVIDER_STATUS_FILTER_TO_VALUES;
    result.status = filters.status.flatMap((s) => statusToValues[s] ?? []);
  }

  if (filters.releaseDate.length > 0) {
    result.releaseDate = [...filters.releaseDate];
  }

  if (filters.lastUpdated.length > 0) {
    result.lastUpdated = filters.lastUpdated.map(
      (option) => LAST_UPDATED_FILTER_TO_VALUE[option],
    );
  }

  if (role === USER_ROLE.PROVIDER && filters.homePlan) {
    result.homePlan = true;
  }

  return result;
}
