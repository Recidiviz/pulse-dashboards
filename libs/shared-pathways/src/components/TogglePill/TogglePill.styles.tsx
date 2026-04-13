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

import { palette, RadioGroup as DSRadioGroup } from "~design-system";

const PILL_WIDTH = "80px";
const PILL_HEIGHT = "2.33rem";

/**
 * Themed wrapper around the design-system RadioGroup that styles the inner
 * radios as a two-button pill toggle. Hides the radio indicator entirely and
 * promotes each `.ds-radio` label element to a pill button.
 *
 * The design-system RadioGroup handles all keyboard navigation and ARIA:
 * - Arrow keys move focus + select (per APG radio pattern)
 * - Single tab stop on the checked radio
 * - Native input semantics for screen readers
 */
export const TogglePillRadioGroup = styled(DSRadioGroup)`
  padding: 0;
  gap: 0;

  &:has(:focus-visible) {
    box-shadow:
      -1px 1px 1px 1px
        ${({ theme }) => theme.palette?.focusColor ?? palette.signal.links},
      1px -1px 1px 1px ${({ theme }) => theme.palette?.focusColor ?? palette.signal.links};
  }

  /* The radio circle isn't shown — the entire pill *is* the affordance. */
  .ds-radio__indicator {
    display: none;
  }

  .ds-radio {
    display: flex;
    align-items: center;
    justify-content: center;
    width: ${PILL_WIDTH};
    height: ${PILL_HEIGHT};
    margin: 0;
    padding: 0 1rem;
    cursor: pointer;
    color: ${({ theme }) => theme.togglePill?.textColor ?? palette.pine3};
    background: transparent;
    border: 1px solid
      ${({ theme }) => theme.togglePill?.borderColor ?? "#d2d8d8"};
    ${({ theme }) => theme.togglePill?.labelTypography}
  }

  .ds-radio:first-child {
    border-right: none;
    border-radius: 200px 0 0 200px;
  }

  .ds-radio:last-child {
    border-left: none;
    border-radius: 0 200px 200px 0;
  }

  .ds-radio:has(input:checked) {
    background: ${({ theme }) =>
      theme.togglePill?.selectedBackgroundColor ?? "#006c67"};
    color: ${({ theme }) => theme.togglePill?.selectedTextColor ?? "white"};
  }

  .ds-radio:hover,
  .ds-radio:focus-within {
    border: 1px solid
      ${({ theme }) => theme.togglePill?.focusBorderColor ?? "#006c67"};
  }
`;
