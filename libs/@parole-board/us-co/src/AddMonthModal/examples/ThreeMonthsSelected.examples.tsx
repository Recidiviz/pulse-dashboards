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

import { addMonthChoices } from "~@parole-board/common/fixtures";

import { ExampleAddMonthModal } from "./support/ExampleAddMonthModal";

export default {};

// The design's "Three months selected" state: the button reads "Generate 3
// months". Months are selected by clicking, so this renders the form from
// the fixture.
export const Default = () => (
  <ExampleAddMonthModal
    choices={addMonthChoices}
    initialSelected={["2026-11", "2026-12", "2027-01"]}
  />
);
