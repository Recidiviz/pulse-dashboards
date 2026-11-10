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

import { TRPCClientError } from "@trpc/client";

import { PROVIDER_RESPONSE_ERROR_MESSAGE as SERVER } from "~@idaho-th/shared";

const DEFAULT_MESSAGE =
  "We couldn't submit your response. Please refresh and try again.";

const NETWORK_MESSAGE =
  "Unable to reach the server. Check your connection and try again.";

const NOT_FOUND_MESSAGE =
  "This application is no longer available to your organization.";

const RESPONSE_LOCKED_MESSAGE =
  "This application can no longer be responded to. Refresh to see its latest status.";

// Keyed by the exact messages thrown by the submitProviderResponse procedure.
const BAD_REQUEST_MESSAGES: Record<string, string> = {
  [SERVER.NOT_SENT_TO_PROVIDERS]:
    "This application hasn't been sent to providers yet.",
  [SERVER.NOT_IN_APPLICATION_STAGE]:
    "This application is no longer accepting responses.",
  [SERVER.RESPONSE_LOCKED]: RESPONSE_LOCKED_MESSAGE,
  [SERVER.ALREADY_RESPONDED]:
    "A response has already been submitted for this application.",
  [SERVER.MESSAGE_REQUIRED]: "Enter a message before submitting.",
  [SERVER.OPEN_INFO_REQUEST_EXISTS]:
    "An information request is already open for this application.",
  [SERVER.CASE_CLOSED]:
    "This application is closed and can no longer be changed.",
  [SERVER.CASE_DRAFT]: "This application hasn't been submitted yet.",
};

export function getSubmitProviderResponseErrorMessage(error: unknown): string {
  if (!(error instanceof TRPCClientError)) return DEFAULT_MESSAGE;

  switch (error.data?.code) {
    case "BAD_REQUEST":
      return BAD_REQUEST_MESSAGES[error.message] ?? DEFAULT_MESSAGE;
    case "NOT_FOUND":
      return NOT_FOUND_MESSAGE;
    case "TOO_MANY_REQUESTS":
      return "Too many attempts. Please wait a moment and try again.";
    case undefined:
      return NETWORK_MESSAGE;
    default:
      return DEFAULT_MESSAGE;
  }
}
