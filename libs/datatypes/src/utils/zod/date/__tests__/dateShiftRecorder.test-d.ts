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

import { collectShiftedDates } from "../dateShiftRecorder";

test("rejects async functions", () => {
  // the collector is restored as soon as fn returns, so an async function would record
  // only its synchronous portion and silently discard everything after the first await

  // @ts-expect-error - collectShiftedDates requires a synchronous function
  collectShiftedDates(async () => undefined);

  // @ts-expect-error - a function that returns a promise is rejected the same way
  collectShiftedDates(() => Promise.resolve(1));
});
