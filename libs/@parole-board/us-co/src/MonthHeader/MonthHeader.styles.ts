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
import { baseButtonStyles, secondaryButtonStyles } from "~design-system";

const { border, radius, space, stroke, surface, text, type } = semantics;

export const Frame = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${rem(space.lg)};
  padding: ${rem(space.lg)} ${rem(space.xl)};
  background: ${surface.bg};
  border-bottom: ${stroke.default} solid ${border.faint};
`;

export const Main = styled.div`
  flex: 1;
  min-width: 0;
`;

export const TopRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${rem(space.md)};
  margin-bottom: ${rem(space.sm)};
`;

export const Eyebrow = styled.span`
  ${type.Sans12}
  color: ${text.secondary};
  text-transform: uppercase;
`;

// The rule between the eyebrow and the month controls.
export const Divider = styled.span`
  width: ${stroke.default};
  height: ${rem(space.md)};
  background: ${border.default};
`;

// The arrows and the picker, spaced as the rest of the top row.
export const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: ${rem(space.md)};
`;

// TODO(CO-935): Waiting on ~design-system to give Button a link form that takes an href. Replace MonthLinkShape with it once it lands.
// The DS borderless Button in its block shape, as an anchor. The DS doesn't
// export the borderless or block styles, so they're rebuilt here from the
// secondary styles it does export: a transparent border that stays
// transparent when pressed, no fill on hover or focus, and the block shape's
// size, padding and radius.
export const MonthLinkShape = styled.a`
  ${baseButtonStyles}
  ${secondaryButtonStyles}

  box-sizing: border-box;
  min-width: ${rem(space.xl)};
  min-height: ${rem(space.xl)};
  padding: ${rem(space.xs)} ${rem(space.sm)};
  border-radius: ${radius.control};
  text-decoration: none;

  &&,
  &&:active {
    border-color: transparent;
  }

  &:hover,
  &:focus {
    background-color: transparent;
  }
`;

// The DS Arrow icon points right; the previous-month arrow mirrors it, as
// the staff DatePickerHeader does.
export const Mirrored = styled.span`
  display: flex;
  transform: scaleX(-1);
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${rem(space.md)};
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(space.sm)};
`;

// A layout size, not a token: wide enough for the longest label,
// "September 2026 · past", without the control resizing between months.
const PICKER_MIN_WIDTH = rem(200);

/** react-select's classNamePrefix, which MonthPickerFrame styles. */
export const MONTH_PICKER_CLASS = "MonthPicker";

// Each rule sits under the frame, so it outranks react-select's own
// single-class styles. The control matches the DS Button's block shape:
// its height and radius.
export const MonthPickerFrame = styled.div`
  ${type.Sans14}
  min-width: ${PICKER_MIN_WIDTH};
  color: ${text.primary};

  .${MONTH_PICKER_CLASS}__control {
    min-height: ${rem(space.xl)};
    border: ${stroke.default} solid ${border.default};
    border-radius: ${radius.control};
    background: ${surface.bg};
    box-shadow: none;
  }

  .${MONTH_PICKER_CLASS}__control--is-focused {
    border-color: ${border.focus};
    outline: ${stroke.focus} solid ${border.focus};
    outline-offset: ${stroke.focusOffset};
  }

  .${MONTH_PICKER_CLASS}__single-value,
    .${MONTH_PICKER_CLASS}__input-container {
    color: ${text.primary};
  }

  .${MONTH_PICKER_CLASS}__indicator {
    padding: ${rem(space.xs)};
    color: ${text.secondary};
  }

  .${MONTH_PICKER_CLASS}__indicator-separator {
    display: none;
  }

  .${MONTH_PICKER_CLASS}__menu {
    border-radius: ${radius.control};
  }

  .${MONTH_PICKER_CLASS}__option {
    color: ${text.primary};
  }

  .${MONTH_PICKER_CLASS}__option--is-focused {
    background: ${surface.hover};
  }

  .${MONTH_PICKER_CLASS}__option--is-selected {
    background: ${surface.selected};
    color: ${text.onColor};
  }

  .${MONTH_PICKER_CLASS}__menu-notice {
    color: ${text.secondary};
  }
`;
