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
import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { TRPC_ERROR_CODES_BY_KEY } from "@trpc/server/rpc";

import type { CalendarErrorCode } from "../api/errors";
import type { UsCoParoleBoardCalendarRouter } from "../api/types";

/**
 * The error a failed calendar request gives the client, as the Modules server
 * would send it: `calendarApiError("CONFLICT", "This hearing was just changed
 * by Editor A.")`. Throw it from a fake procedure, or pass it to failedQuery
 * or mutationResult.
 */
export function calendarApiError(
  code: CalendarErrorCode,
  message: string,
): TRPCClientError<UsCoParoleBoardCalendarRouter> {
  return new TRPCClientError<UsCoParoleBoardCalendarRouter>(message, {
    result: {
      error: {
        message,
        code: TRPC_ERROR_CODES_BY_KEY[code],
        data: {
          code,
          httpStatus: getHTTPStatusCodeFromError(new TRPCError({ code })),
        },
      },
    },
  });
}
