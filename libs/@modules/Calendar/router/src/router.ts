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

import { auth0Procedure, router } from "~@modules-server/trpc-base";

import { usCoPublicCalendarRouter } from "./us_co/parole_board";

/**
 * The Calendar module's router, which the Modules server mounts as Calendar
 * from the manifest in index.ts. Each state's calendars sit under their own
 * keys, so clients call Colorado's Parole Board calendar at
 * "Calendar.usCo.paroleBoard.<procedure>", and another state or calendar can
 * sit beside it without renaming any client call. This is the one
 * generic file that imports a state's folder: it decides which states'
 * APIs the module serves. stub stays because the Modules server's test checks
 * the mount with it.
 */
export const moduleRouter = router({
  stub: auth0Procedure.query(() => "stubbed"),
  usCo: router({ paroleBoard: usCoPublicCalendarRouter }),
});
