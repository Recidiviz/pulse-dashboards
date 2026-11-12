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

import { ModalForm, semantics } from "~@parole-board/common";
import { animation } from "~design-system";

const { border, space, stroke, text, type } = semantics;

// The design's Add a month dialog is 620px wide, wider than the DS Modal's
// 462px, so four month tiles fit to a row at the design's size, about 130px
// by 57px, and "Already added" fits on one line. The DS Modal's max-width
// still keeps the dialog inside a narrow screen.
const ADD_MONTH_DIALOG_WIDTH = 620;

/**
 * ModalForm at the design's width. The width includes the padding, as the
 * design's does, whether or not the host sets border-box sizing.
 */
export const AddMonthModalForm = styled(ModalForm)`
  && .ReactModal__Content {
    box-sizing: border-box;
    width: ${rem(ADD_MONTH_DIALOG_WIDTH)};
  }
`;

/** The confirmation Modal example's description style. */
export const Subtitle = styled.p`
  ${type.Sans14}
  color: ${text.secondary};
  margin: 0 0 ${rem(space.md)};
`;

// The design's month tile is 57px tall: 12px of padding above and below the
// name's line, the caption's 4px gap and its 13px line. No spacing or tile
// token is this size. The loading skeleton's tiles take it too.
export const MONTH_TILE_HEIGHT = 57;

// Three rows of month tiles and most of a fourth, so a list that scrolls
// shows that it does. The padding keeps a focused tile's outline inside the
// scroll area, which would otherwise clip it.
//
// Every month tile is the same size, whatever its caption: a year or
// "Already added". The staff app loads Bootstrap Reboot, which gives every
// <label> a bottom margin, so the tile's label clears it. These rules stay
// here rather than in CheckboxGrid, so the other tile grids don't change.
export const TilesScroll = styled.div`
  max-height: ${rem(space.xxl * 5)};
  overflow-y: auto;
  padding: ${rem(space.xs)};
  margin: -${rem(space.xs)};

  /* CheckboxGrid's GridLayout, the grid inside its group. */
  [role="group"] > div {
    grid-auto-rows: 1fr;
  }

  .ds-checkbox {
    box-sizing: border-box;
    height: ${rem(MONTH_TILE_HEIGHT)};
  }

  .ds-checkbox__label {
    margin: 0;
  }
`;

/**
 * A full-width disclosure button: the label on the left, "Show" or "Hide"
 * and a caret on the right that turns over while the list is open.
 */
export const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${rem(space.sm)};
  width: 100%;
  margin-top: ${rem(space.lg)};
  padding: 0;
  border: none;
  background: none;
  ${type.Sans12}
  color: ${text.secondary};
  text-transform: uppercase;
  cursor: pointer;

  &:focus-visible {
    outline: ${stroke.focus} solid ${border.focus};
    outline-offset: ${stroke.focusOffset};
  }

  svg {
    transition: transform ${animation.defaultDurationMs}ms;
  }

  &[aria-expanded="true"] svg {
    transform: rotate(180deg);
  }

  @media (prefers-reduced-motion: reduce) {
    svg {
      transition: none;
    }
  }
`;

// Sans12 is medium weight, so the bold words need bold to stand out.
export const ToggleLabel = styled.span`
  b {
    font-weight: 700;
  }
`;

export const ToggleState = styled.span`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: ${rem(space.xs)};
`;

// About eight and a half rows, as the design shows, so the list shows that it
// scrolls.
export const PatternList = styled.ul`
  max-height: ${rem(space.xxl * 6)};
  margin: ${rem(space.sm)} 0 0;
  padding: 0;
  overflow-y: auto;
  border: ${stroke.default} solid ${border.faint};
  list-style: none;

  &:focus-visible {
    outline: ${stroke.focus} solid ${border.focus};
    outline-offset: ${stroke.focusOffset};
  }
`;

export const PatternRow = styled.li`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${rem(space.md)};
  padding: ${rem(space.sm)} ${rem(space.md)};
  border-bottom: ${stroke.default} solid ${border.faint};

  &:last-child {
    border-bottom: none;
  }
`;

export const PatternName = styled.span`
  ${type.Sans14}
  font-weight: 600;
  color: ${text.primary};
`;

export const PatternDays = styled.span`
  ${type.Sans12}
  color: ${text.secondary};
  text-align: right;
`;

export const NoOptionsMessage = styled(Subtitle)`
  margin: ${rem(space.md)} 0 0;
`;

export const NoticeGroup = styled.div`
  & + & {
    margin-top: ${rem(space.sm)};
  }
`;

/** "Notices for October 2026", uppercased as the tile captions are. */
export const NoticeHeading = styled.p`
  ${type.Sans12}
  margin: 0;
  font-weight: 600;
  text-transform: uppercase;
`;

export const NoticeList = styled.ul`
  margin: 0;
  padding-left: ${rem(space.md)};
`;

/** The month tiles' grid, four to a row, while the add options load. */
export const TilesSkeleton = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${rem(space.sm)};
`;

export const PatternsBarSkeleton = styled.div`
  margin-top: ${rem(space.lg)};
`;
