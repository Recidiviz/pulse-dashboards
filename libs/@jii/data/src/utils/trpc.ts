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

import { captureException } from "@sentry/react";
import { isTRPCClientError } from "@trpc/client";

import { JiiResidentAppRouter } from "~@jii/trpc-types";

/**
 * Error logging utility with special handling for tRPC mutation errors.
 * (Some mutation failures are routine and expected and may be logged differently
 * e.g. rejected writes by staff or Recidiviz users in prod.)
 */
export function handleMutationError(e: unknown) {
  if (isTRPCClientError<JiiResidentAppRouter>(e)) {
    // This code is assumed to mean the request was denied for a known reason,
    // therefore is not a bug and doesn't need to go to Sentry
    if (e.data?.code === "FORBIDDEN") {
      console.error(e);
      return;
    }
  }

  captureException(e);
}
