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

import {
  september2026Config,
  september2026MonthDetail,
} from "~@parole-board/common/fixtures";

import { ExampleAddHearingModal } from "./support/ExampleAddHearingModal";

// The fixture has no Full Board on the 8th, so one is added to show a
// disabled board-session tile beside the disabled facilities.
const fullBoard = september2026MonthDetail.entries.find(
  ({ slotKey }) => slotKey === "FULL_BOARD",
);
const entriesWithFullBoardOn8 = [
  ...september2026MonthDetail.entries,
  ...(fullBoard ? [{ ...fullBoard, date: "2026-09-08" }] : []),
];

export default {};

// Full Board, ACC and Greeley are already on September 8, so their tile and menu items are disabled.
export const Default = () => (
  <ExampleAddHearingModal
    config={september2026Config}
    month={september2026MonthDetail}
    entries={entriesWithFullBoardOn8}
    initialDay="2026-09-08"
    openFacilities
  />
);
