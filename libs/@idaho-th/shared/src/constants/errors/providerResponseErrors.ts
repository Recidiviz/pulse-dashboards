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

import { HOUSING_APPLICATION_ERRORS as APPLICATION } from "./housingApplicationErrors";

/**
 * Messages the server throws for a provider response. Shared so the client can
 * match on them without a server reword silently breaking the mapping.
 *
 * The entries that are really about the application rather than the response
 * are re-exported from `HOUSING_APPLICATION_ERROR_MESSAGE`, so staff routes and
 * provider routes cannot drift apart.
 */
export const PROVIDER_RESPONSE_ERROR_MESSAGE = {
  NOT_FOUND: APPLICATION.NOT_FOUND_FOR_PROVIDER,
  NOT_SENT_TO_PROVIDERS: APPLICATION.NOT_SENT_TO_PROVIDERS,
  NOT_IN_APPLICATION_STAGE: "Application is not in the application stage",
  RESPONSE_LOCKED: "Application response can no longer be changed",
  ALREADY_RESPONDED: "Application has already been responded to",
  MESSAGE_REQUIRED: "A message is required for this response",
  OPEN_INFO_REQUEST_EXISTS: APPLICATION.OPEN_INFO_REQUEST_EXISTS,
  CASE_CLOSED: APPLICATION.CASE_CLOSED,
  CASE_DRAFT: APPLICATION.CASE_DRAFT,
} as const;
