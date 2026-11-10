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
 * Messages the server throws about a housing application itself, regardless of
 * who is acting on it. Staff routes and provider routes both throw these, so
 * they live here rather than in either side's namespace — rewording one must
 * be a deliberate change to a shared string, not a side effect of editing
 * provider-response copy.
 *
 * Shared with the client so it can match on them without a server reword
 * silently breaking the mapping.
 */
export const HOUSING_APPLICATION_ERRORS = {
  NOT_FOUND_FOR_PROVIDER: "Application not found for this provider",
  NOT_SENT_TO_PROVIDERS: "Application has not been sent to providers",
  OPEN_INFO_REQUEST_EXISTS:
    "An open information request already exists for this application",
  CASE_CLOSED: "This application is closed and cannot be modified",
  CASE_DRAFT:
    "This application is still a draft and cannot be modified until submitted",
} as const;
