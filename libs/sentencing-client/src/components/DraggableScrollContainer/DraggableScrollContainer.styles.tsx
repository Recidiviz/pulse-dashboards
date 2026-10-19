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

import styled from "styled-components";

import { palette } from "~design-system";

export const ScrollControlsContainer = styled.div`
  position: relative;
  width: 100%;
`;

export const ScrollContainer = styled.div<{ isCursorGrab?: boolean }>`
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  cursor: ${({ isCursorGrab }) => (isCursorGrab ? "grab" : "default")};
  display: flex;
  user-select: none;
  padding: 0 22px 0 22px;
  margin-right: 40px;
`;

export const CarouselButton = styled.div`
  display: flex;
  align-items: center;
  // TODO(#8709): Add color to design system or change to design system color
  background-color: rgba(241, 255, 253, 1);
  color: ${palette.text.links};
  border-radius: 3px;
  border: 1px solid ${palette.text.links};
  padding: 7px;
  user-select: none;

  &:hover {
    cursor: pointer;
  }
`;

export const CarouselButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-right: 24px;
  margin-left: 50px;
  position: absolute;
  right: 0;
  top: -36px;
  z-index: 10;

  ${CarouselButton} > svg {
    stroke: ${palette.text.links};
    stroke-width: 0.5px;
  }

  ${CarouselButton}:nth-of-type(2) > svg {
    rotate: 180deg;
  }
`;
