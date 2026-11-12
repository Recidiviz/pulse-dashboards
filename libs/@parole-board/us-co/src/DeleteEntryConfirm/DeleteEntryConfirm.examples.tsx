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

import { rem } from "polished";
import styled from "styled-components";

import { semantics } from "~@parole-board/common";
import { september2026 } from "~@parole-board/common/fixtures";

import { DeleteEntryConfirm } from "./DeleteEntryConfirm";

const fcf = september2026.entries.find(
  (entry) => entry.id === "2026-09-14:HEARING:FCF",
);
if (!fcf) throw new Error("No FCF hearing on September 14 in the fixture");
const { label, date } = fcf;

// The action bar right-aligns its actions.
const Bar = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: ${rem(semantics.space.md)};
  background: ${semantics.surface.bg};
`;

const noop = () => {
  // intentionally empty for the static example
};

export default {};

export const Open = () => (
  <Bar>
    <DeleteEntryConfirm
      label={label}
      date={date}
      deleting={false}
      onConfirm={noop}
      onCancel={noop}
    />
  </Bar>
);

// Both buttons are disabled until the request finishes.
export const Deleting = () => (
  <Bar>
    <DeleteEntryConfirm
      label={label}
      date={date}
      deleting
      onConfirm={noop}
      onCancel={noop}
    />
  </Bar>
);

export const GenericError = () => (
  <Bar>
    <DeleteEntryConfirm
      label={label}
      date={date}
      deleting={false}
      error="We couldn't delete this. Try again or contact Recidiviz support."
      onConfirm={noop}
      onCancel={noop}
    />
  </Bar>
);
