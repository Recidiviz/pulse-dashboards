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

export const APPLICATION_FILTER_RELEASE_DATE = {
  ALL_TIME: "All time",
  NEXT_7_DAYS: "Next 7 days",
  NEXT_30_DAYS: "Next 30 days",
  NEXT_90_DAYS: "Next 90 days",
} as const;

export type ReleaseDateFilterOption =
  (typeof APPLICATION_FILTER_RELEASE_DATE)[keyof typeof APPLICATION_FILTER_RELEASE_DATE];

export const RELEASE_DATE_FILTER_OPTIONS = Object.values(
  APPLICATION_FILTER_RELEASE_DATE,
) as ReleaseDateFilterOption[];

export const APPLICATION_FILTER_LAST_UPDATED = {
  ALL: "ALL",
  NO_UPDATES_30D: "NO_UPDATES_30D",
  UPDATED_IN_PAST_7D: "UPDATED_IN_PAST_7D",
} as const;

export type ApplicationFilterLastUpdated =
  (typeof APPLICATION_FILTER_LAST_UPDATED)[keyof typeof APPLICATION_FILTER_LAST_UPDATED];

export const LAST_UPDATED_FILTER_VALUES = Object.values(
  APPLICATION_FILTER_LAST_UPDATED,
) as [ApplicationFilterLastUpdated, ...ApplicationFilterLastUpdated[]];

export const LAST_UPDATED_FILTER_LABELS: Record<
  ApplicationFilterLastUpdated,
  string
> = {
  [APPLICATION_FILTER_LAST_UPDATED.ALL]: "All",
  [APPLICATION_FILTER_LAST_UPDATED.UPDATED_IN_PAST_7D]: "In the past 7 days",
  [APPLICATION_FILTER_LAST_UPDATED.NO_UPDATES_30D]: "No Updates (30d)",
};

export type LastUpdatedFilterDisplayLabel =
  (typeof LAST_UPDATED_FILTER_LABELS)[ApplicationFilterLastUpdated];

export const LAST_UPDATED_FILTER_OPTIONS = Object.values(
  LAST_UPDATED_FILTER_LABELS,
) as LastUpdatedFilterDisplayLabel[];

export const LAST_UPDATED_FILTER_LABEL_TO_VALUE = Object.fromEntries(
  Object.entries(LAST_UPDATED_FILTER_LABELS).map(([apiValue, label]) => [
    label,
    apiValue,
  ]),
) as Record<LastUpdatedFilterDisplayLabel, ApplicationFilterLastUpdated>;

export const APPLICATION_RECENT_ACTIVITY_DAYS = 7;
export const APPLICATION_STALE_ACTIVITY_DAYS = 30;

export const RELEASE_DATE_DAY_LIMITS: Record<string, number> = {
  [APPLICATION_FILTER_RELEASE_DATE.NEXT_7_DAYS]:
    APPLICATION_RECENT_ACTIVITY_DAYS,
  [APPLICATION_FILTER_RELEASE_DATE.NEXT_30_DAYS]: 30,
  [APPLICATION_FILTER_RELEASE_DATE.NEXT_90_DAYS]: 90,
};
