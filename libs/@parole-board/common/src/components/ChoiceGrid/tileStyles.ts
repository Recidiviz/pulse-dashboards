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

import { css } from "styled-components";

import { semantics } from "../../theme";
import type { TileSize } from "./GridLayout";

const { border, radius, stroke, surface, text, tile, type } = semantics;

// TODO(CO-935): Waiting on ~design-system to add a tile look to Checkbox and Radio. Pass it to the DS items and delete these styles once it lands.
/**
 * Draws the ~design-system checkbox or radio items inside a group as the
 * design's bordered tiles, through the class names those items render
 * (ds-checkbox, ds-radio and their __box and __label parts). The native input
 * stays in the DOM and focusable inside the visually hidden box, and the
 * label fills the tile, so a click anywhere on the tile toggles the input.
 *
 * A selected tile gets a 2px blue ring (a compact day tile a solid blue fill
 * instead), and a focused tile an outline in border.focus, since the DS
 * indicator that would show focus is hidden.
 */
export const tileGroupStyles = css<{ $size: TileSize }>`
  /* Doubled to outrank the DS group's own padding and focus shadow; the
     tile draws its own focus ring. */
  && {
    padding: 0;
  }

  &&:has(:focus-visible) {
    box-shadow: none;
  }

  .ds-checkbox,
  .ds-radio {
    position: relative;
    display: flex;
    min-width: 0;
    border: ${stroke.default} solid ${border.default};
    border-radius: ${radius.tile};
    background-color: ${surface.card};
    color: ${text.primary};
    /* The DS item fades a disabled option to half opacity; a disabled tile
       has its own grey look below. */
    opacity: 1;
  }

  .ds-checkbox__box,
  .ds-radio__box {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .ds-checkbox__label,
  .ds-radio__label {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 0;
    padding: ${tile.padding};
    text-align: center;
  }

  .ds-checkbox__label:has(.pb-tile-caption),
  .ds-radio__label:has(.pb-tile-caption) {
    padding: ${tile.paddingDescribed};
  }

  /* A 1px inset shadow on top of the 1px border draws the 2px ring without
     moving the tile's text. */
  .ds-checkbox:has(input:checked),
  .ds-radio:has(input:checked) {
    border-color: ${border.selected};
    box-shadow: inset 0 0 0 ${stroke.default} ${border.selected};
  }

  .ds-checkbox:has(input:focus-visible),
  .ds-radio:has(input:focus-visible) {
    outline: ${stroke.focus} solid ${border.focus};
    outline-offset: ${stroke.focusOffset};
  }

  /* A disabled tile that is also selected keeps its ring, so a disabled
     group still shows its choice. */
  .ds-checkbox:has(input:disabled),
  .ds-radio:has(input:disabled) {
    border-color: ${border.faint};
    background-color: ${surface.page};
    color: ${text.disabledSubtle};
  }

  ${({ $size }) =>
    $size === "compact" &&
    css`
      .ds-checkbox,
      .ds-radio {
        height: ${tile.compactHeight};
        color: ${text.secondary};
      }

      .ds-checkbox__label,
      .ds-radio__label {
        padding: 0;
      }

      /* Outranks the name's own semibold-when-selected rule, since day
         numbers stay regular weight. */
      && .ds-checkbox .pb-tile-name,
      && .ds-radio .pb-tile-name {
        ${type.Sans12}
        font-weight: 400;
      }

      .ds-checkbox:has(input:checked),
      .ds-radio:has(input:checked) {
        border-color: ${surface.selected};
        background-color: ${surface.selected};
        box-shadow: none;
        color: ${text.onColor};
      }
    `}
`;
