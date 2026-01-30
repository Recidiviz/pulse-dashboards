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

import { palette } from "~design-system";

export const Checkbox = styled.input.attrs({ type: "checkbox" })<{
  $size: number;
  /** Custom accent color for checked state and hover. Defaults to palette.signal.links */
  $accentColor?: string;
  /** Background color when unchecked. Defaults to transparent */
  $uncheckedBackground?: string;
}>`
  appearance: none;
  width: ${(props) => rem(props.$size)};
  height: ${(props) => rem(props.$size)};
  border: 2px solid ${palette.slate30};
  border-radius: ${rem(4)};
  background-color: ${(props) => props.$uncheckedBackground ?? "transparent"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;

  &:checked {
    border-color: ${(props) => props.$accentColor ?? palette.signal.links};
    background-color: ${(props) => props.$accentColor ?? palette.signal.links};
  }

  &:checked::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    width: ${rem(5)};
    height: ${rem(9)};
    border: solid ${palette.white};
    border-width: 0 2px 2px 0;
    transform: translate(-50%, -60%) rotate(45deg);
  }

  &:hover {
    border-color: ${(props) => props.$accentColor ?? palette.signal.links};
  }

  &:focus-visible {
    outline: 2px solid ${(props) => props.$accentColor ?? palette.signal.links};
    outline-offset: 2px;
  }
`;
