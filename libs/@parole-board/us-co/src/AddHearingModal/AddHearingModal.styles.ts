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

import { hideVisually, rem } from "polished";
import styled from "styled-components";

import { semantics } from "~@parole-board/common";
import {
  Dropdown,
  DropdownMenu,
  DropdownToggle,
  ModalHeading,
} from "~design-system";

const { space, text, type } = semantics;

export const VisuallyHidden = styled.span`
  ${hideVisually()}
`;

/**
 * The eyebrow over the title and the "DAY" label share one small uppercase
 * style.
 */
export const Eyebrow = styled.div`
  ${type.Sans12}
  margin: 0;
  color: ${text.secondary};
  text-transform: uppercase;
`;

export const Title = styled(ModalHeading)`
  margin: ${rem(space.sm)} 0 ${rem(space.md)};
`;

// The design's board-session tile: 36px tall, with its name centred.
const BOARD_SESSION_TILE_HEIGHT = rem(space.xl + space.xs);

/**
 * Holds the board-session tiles at the design's height with their names
 * centred. The staff app loads Bootstrap Reboot, which gives every <label> a
 * bottom margin, and that margin pushed the names off-centre, so the tile's
 * label clears it and the tile sets its height instead of padding. These
 * rules stay here rather than in RadioGrid, so the other tile grids don't
 * change.
 */
export const BoardSessionTiles = styled.div`
  && .ds-radio {
    box-sizing: border-box;
    height: ${BOARD_SESSION_TILE_HEIGHT};
  }

  && .ds-radio__label {
    margin: 0;
    padding: 0;
  }
`;

export const FacilitiesDropdown = styled(Dropdown)`
  display: block;
  width: 100%;
  margin-top: ${rem(space.sm)};
`;

export const FacilitiesToggle = styled(DropdownToggle)`
  width: 100%;
`;

// Seven 32px items plus the menu's top and bottom margins, so a long list
// scrolls inside the menu instead of stretching the dialog.
export const FacilitiesMenu = styled(DropdownMenu)`
  width: 100%;
  max-height: ${rem(space.xxl * 5)};
  overflow-y: auto;
  transform: translateY(0);
`;

// TODO(CO-935): Waiting on ~design-system to export a semibold (600) weight token. Use it for the facility's abbreviation once it lands.
const LABEL_WEIGHT = 600;

export const FacilityLabel = styled.span`
  font-weight: ${LABEL_WEIGHT};
`;

export const FacilityFullName = styled.span`
  margin-left: ${rem(space.sm)};
`;

export const DayLabel = styled(Eyebrow)`
  margin: ${rem(space.lg)} 0 ${rem(space.sm)};
`;
