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

import { RadioGroup as DSRadioGroup } from "~design-system";

import { publicPathwaysPalette } from "../../styles/publicPathwaysPalette";
import { publicPathwaysTypography } from "../../styles/publicPathwaysTypography";

const TRACK_COLOR = "rgba(0, 0, 0, 0.05)";
const SEGMENT_SHADOW = "0 1px 4px rgba(20, 30, 50, 0.15)";

/**
 * Themed wrapper around the design-system RadioGroup that styles the inner
 * radios as a segmented control: a sunken track holding one raised segment for
 * the selected event type.
 *
 * The design-system RadioGroup handles all keyboard navigation and ARIA:
 * - Arrow keys move focus + select (per APG radio pattern)
 * - Single tab stop on the checked radio
 * - Native input semantics for screen readers
 *
 * The radio indicator is hidden and each `.ds-radio` label is promoted to a
 * segment, the same technique TogglePill uses.
 */
export const EventTypeRadioGroup = styled(DSRadioGroup)`
  display: inline-flex;
  align-self: flex-start;
  gap: 0;
  padding: ${rem(4)};
  border-radius: ${rem(10)};
  background: ${TRACK_COLOR};

  /*
   * DSRadioGroup's own :has(:focus-visible) rule draws a diagonal box-shadow
   * in the design-system's default link blue. Redefining the same property
   * here, rather than adding an outline, replaces it outright instead of
   * layering a second ring on top — the same technique TogglePill uses.
   */
  &:has(:focus-visible) {
    box-shadow:
      -1px 1px 1px 1px ${publicPathwaysPalette.focusColor},
      1px -1px 1px 1px ${publicPathwaysPalette.focusColor};
  }

  .ds-radio {
    ${publicPathwaysTypography.Sans14}
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: ${rem(34)};
    margin: 0;
    padding: 0 ${rem(22)};
    border: none;
    border-radius: ${rem(8)};
    background: transparent;
    color: ${publicPathwaysPalette.slate70};
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    transition:
      background-color 0.15s,
      color 0.15s;
  }

  /* Stretch the indicator wrapper so the input covers the whole segment. */
  .ds-radio__box {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  /* Hide the input visually but keep it focusable and clickable. */
  .ds-radio__indicator {
    width: 100%;
    height: 100%;
    margin: 0;
    border: none;
    border-radius: inherit;
    background: transparent;
    opacity: 0;
    cursor: inherit;
    outline: none;
  }

  /* Hide the radio dot — a segmented control shows no circle indicator. */
  .ds-radio__box > span[aria-hidden="true"] {
    display: none;
  }

  .ds-radio__label {
    position: relative;
    margin: 0;
    line-height: 1;
    pointer-events: none;
  }

  .ds-radio:has(input:checked) {
    background: ${publicPathwaysPalette.white};
    color: ${publicPathwaysPalette.pine1};
    box-shadow: ${SEGMENT_SHADOW};
  }
`;
