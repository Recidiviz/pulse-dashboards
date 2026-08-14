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

/**
 * The state codes allowed to appear in @meetings — not a guarantee that a
 * state is fully onboarded. A state must be added here before it can appear
 * anywhere in the UI. To fully onboard, follow directions in the README.
 */
export const MEETINGS_STATE_CODES: readonly string[] = [
  "US_AZ",
  "US_CO",
  "US_DEMO",
  "US_ID",
  "US_ME",
  "US_NC",
  "US_ND",
  "US_NE",
  "US_TN",
];
