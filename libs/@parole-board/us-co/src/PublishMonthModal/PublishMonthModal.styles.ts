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

const { border, space, stroke, surface, text, type } = semantics;

/** The confirmation Modal example's description style. */
export const Description = styled.p`
  ${type.Sans14}
  color: ${text.secondary};
  margin: 0 0 ${rem(space.md)};
`;

export const CountsTable = styled.table`
  width: 100%;
  margin-top: ${rem(space.lg)};
  border: ${stroke.default} solid ${border.faint};
  border-collapse: collapse;

  tr + tr {
    border-top: ${stroke.default} solid ${border.faint};
  }

  th,
  td {
    ${type.Sans14}
    padding: ${rem(space.sm)} ${rem(space.md)};
  }

  th {
    color: ${text.secondary};
    text-align: left;
  }

  td {
    color: ${text.primary};
    font-weight: 600;
    text-align: right;
  }
`;

export const Section = styled.div`
  margin-top: ${rem(space.md)};
`;

export const WarningList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

/**
 * The shaded panel around the confirm checkbox. The whole panel toggles it,
 * as in the design. The CheckboxGroup inside adds its own 8px padding, so the
 * label sits 16px from the panel's edge.
 */
export const ConfirmPanel = styled.div<{ $disabled: boolean }>`
  ${type.Sans14}
  margin-top: ${rem(space.md)};
  padding: ${rem(space.sm)};
  background: ${surface.muted};
  border: ${stroke.default} solid ${border.default};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
`;
