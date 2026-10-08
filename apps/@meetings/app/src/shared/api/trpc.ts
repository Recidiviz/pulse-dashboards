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

import { createTRPCReact } from "@trpc/react-query";
import { createContext } from "react";

import type { JiiMeetingsAppRouter } from "~@jii/trpc-types";
import type { AppRouter } from "~@meetings/trpc-types";

// Authenticated tRPC client - requires user to be logged in
export const trpc = createTRPCReact<AppRouter>();

// Public tRPC client - for unauthenticated endpoints (e.g., version check)
export const publicTrpc = createTRPCReact<AppRouter>();

/**
 *  TRPC client for the JII backend (NE 120-Day Check-In integration).
 */
export const jiiTrpc = createTRPCReact<JiiMeetingsAppRouter>({
  context: createContext(null),
});
