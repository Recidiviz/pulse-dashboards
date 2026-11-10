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

export const CLOSE_APPLICATION_REASONS = [
  {
    value: "client_released" as const,
    label: "Client released to housing provider",
  },
  { value: "application_withdrawn" as const, label: "Application withdrawn" },
  { value: "release_denied" as const, label: "Release denied" },
  { value: "housing_plan_rejected" as const, label: "Housing plan rejected" },
  { value: "other" as const, label: "Other" },
];

export type CloseApplicationReason =
  (typeof CLOSE_APPLICATION_REASONS)[number]["value"];

export const REASON_TO_CLOSED_OUTCOME = {
  client_released: "CLIENT_RELEASED",
  application_withdrawn: "APPLICATION_WITHDRAWN",
  release_denied: "RELEASE_DENIED",
  housing_plan_rejected: "HOUSING_PLAN_REJECTED",
  other: "OTHER",
} as const satisfies Record<CloseApplicationReason, string>;

export type ClosedOutcomeValue =
  (typeof REASON_TO_CLOSED_OUTCOME)[keyof typeof REASON_TO_CLOSED_OUTCOME];
