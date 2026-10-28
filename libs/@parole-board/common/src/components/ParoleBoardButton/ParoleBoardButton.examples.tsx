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

import { semantics } from "../../theme";
import { ParoleBoardButton } from "./ParoleBoardButton";

const noop = () => {
  // intentionally empty for the static example
};

const Row = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: ${rem(semantics.space.sm)};
  align-items: center;
  padding: ${rem(semantics.space.md)};
  background: ${semantics.surface.bg};
`;

export default {};

// The design-system kinds render exactly as the design-system Button stories.
export const DesignSystemKinds = () => (
  <Row>
    <ParoleBoardButton onClick={noop}>Add to Calendar</ParoleBoardButton>
    <ParoleBoardButton kind="secondary" onClick={noop}>
      See Details
    </ParoleBoardButton>
    <ParoleBoardButton kind="link" onClick={noop}>
      See Details
    </ParoleBoardButton>
    <ParoleBoardButton kind="borderless" shape="block" onClick={noop}>
      See Details
    </ParoleBoardButton>
    <ParoleBoardButton kind="secondary" shape="block" onClick={noop}>
      Suggested action
    </ParoleBoardButton>
    <ParoleBoardButton
      kind="secondary"
      shape="block"
      icon="ItemDelete"
      aria-label="Delete hearing"
      onClick={noop}
    />
  </Row>
);

// The "Remove published month" confirmation's footer.
export const Destructive = () => (
  <Row>
    <ParoleBoardButton kind="secondary" onClick={noop}>
      Cancel
    </ParoleBoardButton>
    <ParoleBoardButton kind="destructive" onClick={noop}>
      Remove published month
    </ParoleBoardButton>
  </Row>
);

// The inline "Delete hearing?" confirmation, in the block shape.
export const DestructiveBlock = () => (
  <Row>
    <ParoleBoardButton kind="secondary" shape="block" onClick={noop}>
      Cancel
    </ParoleBoardButton>
    <ParoleBoardButton kind="destructive" shape="block" onClick={noop}>
      Delete
    </ParoleBoardButton>
  </Row>
);

export const Disabled = () => (
  <Row>
    <ParoleBoardButton onClick={noop} disabled>
      Publish calendar
    </ParoleBoardButton>
    <ParoleBoardButton kind="secondary" onClick={noop} disabled>
      Cancel
    </ParoleBoardButton>
    <ParoleBoardButton kind="destructive" onClick={noop} disabled>
      Delete
    </ParoleBoardButton>
  </Row>
);

export const Waiting = () => (
  <Row>
    <ParoleBoardButton onClick={noop} waiting>
      Publish calendar
    </ParoleBoardButton>
    <ParoleBoardButton kind="secondary" onClick={noop} waiting>
      Publish
    </ParoleBoardButton>
    <ParoleBoardButton kind="destructive" onClick={noop} waiting>
      Remove published month
    </ParoleBoardButton>
    <ParoleBoardButton kind="link" onClick={noop} waiting>
      Undo
    </ParoleBoardButton>
    <ParoleBoardButton
      kind="secondary"
      shape="block"
      icon="ItemDelete"
      aria-label="Delete hearing"
      onClick={noop}
      waiting
    />
  </Row>
);
