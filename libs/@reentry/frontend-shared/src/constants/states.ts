// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

// TODO: Consider replacing this static list with a backend endpoint that queries
// BigQuery for available states: `SELECT DISTINCT state_code FROM client_table`
// This would automatically stay in sync as new states are added to the data.

export const ASSESSMENT_LOGIN_STATES = [
  { value: "US_ID", label: "Idaho" },
  { value: "US_UT", label: "Utah" },
] as const;

export type AssessmentLoginStateCode =
  (typeof ASSESSMENT_LOGIN_STATES)[number]["value"];
