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

import { markAsServerFault } from "~observability";

/**
 * A TRPCError that keeps its sub-500 client-facing code but is logged as an
 * error and reported to Sentry.
 */
export function serverFaultTrpcError(
  options: ConstructorParameters<typeof TRPCError>[0],
): TRPCError {
  return markAsServerFault(new TRPCError(options));
}
