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

import { TRPCError } from "@trpc/server";
// date-fns directly, not ~utils: the ~utils barrel loads its download helpers,
// whose jsonexport directory import Node rejects when the server starts.
import { format } from "date-fns";

/**
 * Formats a month for error messages, such as "October 2026". It builds the
 * Date from local parts, so the server's time zone can't shift the month.
 */
export function formatMonthLabel(year: number, month: number): string {
  return format(new Date(year, month - 1, 1), "MMMM yyyy");
}

/**
 * Throws NOT_IMPLEMENTED (HTTP 501) for a procedure whose handler hasn't been
 * written yet. path is the procedure's full path, such as
 * "Calendar.usCo.paroleBoard.admin.months.get".
 */
export function notImplemented(path: string): never {
  throw new TRPCError({
    code: "NOT_IMPLEMENTED",
    message: `${path} isn't implemented yet`,
  });
}
