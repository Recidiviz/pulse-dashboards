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

import { ActionBar } from "./ActionBar";

export default {};

// Nothing selected in a month editors may change: the design's hint.
export const NothingSelected = () => (
  <ActionBar selected={[]} hint="Drag a session to move it" />
);

// Reads "FCF · September 14".
export const OneSelected = () => (
  <ActionBar selected={[{ label: "FCF", date: "2026-09-14" }]} />
);

// The fixture's longest facility label: "ISP Grfld/Mesa · September 24".
export const LongLabel = () => (
  <ActionBar selected={[{ label: "ISP Grfld/Mesa", date: "2026-09-24" }]} />
);

// Three hearings on two days. The bar has no label or day with several
// selected, and renders nothing until CO-835 adds "Move to…" to its slot.
export const SeveralSelected = () => (
  <ActionBar
    selected={[
      { label: "FCF", date: "2026-09-14" },
      { label: "CCF", date: "2026-09-15" },
      { label: "SCF", date: "2026-09-15" },
    ]}
  />
);
