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

import { initTRPC } from "@trpc/server";
import superjson from "superjson";

import { procedurePlugin } from "~server-setup-plugin";

import { createContext } from "../context";

const t = initTRPC
  .context<typeof createContext>()
  // Required to get Date objects to serialize correctly.
  .create({ transformer: superjson });

export const router = t.router;

const plugin = procedurePlugin();

/**
 * tRPC procedure that verifies the caller has valid user credentials and is authorized
 * to communicate with this API. Extend this to add further permissions checks as necessary.
 */
export const baseProcedure = t.procedure.concat(plugin);
