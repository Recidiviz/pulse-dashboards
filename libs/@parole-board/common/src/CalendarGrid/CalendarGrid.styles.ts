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
import type { CSSProperties } from "react";
import styled from "styled-components";

import { semantics } from "../theme";

const { border, space, stroke, surface, status, text, type } = semantics;

// The design's minimum day height. Rows grow past it with their entries, so
// it's a layout value rather than a spacing step.
export const DAY_MIN_HEIGHT = 118;

export const CELL_PADDING_Y = space.sm;
export const CELL_PADDING_X = space.sm;
export const HEADER_PADDING_Y = space.sm;
export const NUMBER_GAP = space.sm;
export const CHIP_GAP = space.xs;
export const CHIP_PADDING_Y = space.xs;
export const CHIP_PADDING_X = space.sm;

/**
 * A chip's background. The badge surface is a translucent tint, so a chip
 * shows on white and muted days alike.
 */
export const CHIP_BACKGROUND = surface.badge;

/** The left rule of a chip and of the skeleton's chip placeholder. */
export const thickRule = rem(space.xxs * 2);

/**
 * The values CalendarGrid.module.css reads, as custom properties set on
 * CalendarGrid's root, so its colours and sizes come from the semantic layer
 * rather than copies in CSS.
 */
export const CALENDAR_VARS = {
  "--pb-cal-line": border.default,
  "--pb-cal-bg": surface.bg,
  "--pb-cal-bg-muted": surface.muted,
  "--pb-cal-drop-target": border.action,
  "--pb-cal-hairline": stroke.default,
  // Grid lines on the right and bottom of each cell (see the module).
  "--pb-cal-grid-lines": `inset -${stroke.default} -${stroke.default} 0 ${border.default}`,
  "--pb-cal-day-min-height": rem(DAY_MIN_HEIGHT + space.xxs),
  "--pb-cal-cell-padding-y": rem(CELL_PADDING_Y),
  "--pb-cal-cell-padding-x": rem(CELL_PADDING_X),
  "--pb-cal-header-padding-y": rem(HEADER_PADDING_Y),
  "--pb-cal-day-padding-bottom": rem(CELL_PADDING_Y + space.xxs),
  "--pb-cal-drop-outline-offset": `-${rem(space.xs)}`,
  "--pb-cal-chip-gap": rem(CHIP_GAP),
  "--pb-cal-faded-opacity": "0.4",
  "--pb-cal-list-day-header-padding": `${rem(space.sm)} 0 ${rem(space.xs)}`,
} as CSSProperties;

// Header text is a block so its line height, not the cell's, sets the
// header's height.

/**
 * A weekday header's text, and the list view's date and weekday above each
 * day's entries.
 */
export const HeaderText = styled.span`
  ${type.Sans12}
  display: block;
  color: ${text.secondary};
  text-transform: uppercase;
`;

export const DayNumberText = styled.span<{ $weekend: boolean }>`
  ${type.Sans14}
  color: ${({ $weekend }) => ($weekend ? text.secondary : text.primary)};
`;

export const HolidayLabel = styled.div`
  ${type.Sans12}
  color: ${text.secondary};
  overflow-wrap: anywhere;
  white-space: normal;
`;

export const DayTop = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: ${rem(NUMBER_GAP)};
`;

/**
 * The chip's hover title and, when selectable, its toggle button. A selected
 * chip has a 2px border.action outline, drawn 1px inside the chip's edge.
 * Keyboard focus is a border.focus ring outside the chip, as on every
 * ~design-system control, so it reads apart from the selection.
 */
export const ChipTarget = styled.div`
  &[aria-pressed="true"] {
    outline: ${thickRule} solid ${border.action};
    outline-offset: -${stroke.default};
  }

  /* A ring outside the chip, so a selected chip keeps its outline while
     focused. */
  &:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 ${thickRule} ${surface.bg},
      0 0 0 ${rem(space.xs)} ${border.focus};
  }

  &[aria-pressed="true"]:focus-visible {
    outline: ${thickRule} solid ${border.action};
  }
`;

export const Chip = styled.div<{ $cancelled: boolean }>`
  ${type.Sans12}
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${rem(space.xxs)};
  width: 100%;
  box-sizing: border-box;
  padding: ${rem(CHIP_PADDING_Y)} ${rem(CHIP_PADDING_X)};
  border-left: ${thickRule} solid
    ${({ $cancelled }) => ($cancelled ? status.error : border.action)};
  background: ${({ $cancelled }) =>
    $cancelled ? surface.error : CHIP_BACKGROUND};
  color: ${({ $cancelled }) => ($cancelled ? status.error : text.primary)};
  white-space: normal;
  /* Labels wrap only at spaces. A word longer than the chip is clipped at
     its edge instead of spilling into the next day. */
  overflow: hidden;
`;

export const VisuallyHidden = styled.span`
  ${hideVisually()}
`;
