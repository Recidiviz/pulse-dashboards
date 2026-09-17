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

import type { TRPCLink } from "@trpc/client";
import type { AnyTRPCClientTypes } from "@trpc/server";
import { observable } from "@trpc/server/observable";

// Prefixes all request paths with the given module name
// Useful for initializing trpc clients scoped to subroutes
export const subrouteScopedLink: (
  subroute: string,
) => TRPCLink<AnyTRPCClientTypes> = (subroute: string) => () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const newOp = { ...op, path: `${subroute}.${op.path}` };

      return next(newOp).subscribe(observer);
    });
  };
};
