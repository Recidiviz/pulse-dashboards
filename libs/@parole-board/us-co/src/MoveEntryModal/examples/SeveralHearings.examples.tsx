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

import { ExampleMoveEntryModal } from "./support/ExampleMoveEntryModal";

export default {};

// Three hearings on different days: no day starts chosen, and the 16th,
// which already has CCF, is disabled.
export const Default = () => (
  <ExampleMoveEntryModal
    entries={september2026MonthDetail.entries}
    allowedWeekdays={september2026Config.calendar.allowedWeekdays}
    movingIds={[
      "2026-09-14:HEARING:FCF",
      "2026-09-15:HEARING:CCF",
      "2026-09-17:HEARING:AVCF",
    ]}
  />
);
