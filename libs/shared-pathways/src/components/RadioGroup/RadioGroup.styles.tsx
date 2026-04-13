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

/**
 * Themed wrapper around the design-system RadioGroup that preserves the
 * Pathways grid layout and applies the consumer's `theme.checkbox.*` styles
 * to the design-system Radio internals via stable class names.
 */
export const PathwaysRadioGroup = styled(DSRadioGroup)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: 0.25rem 1rem;

  /* Override the design-system default focus ring with the themed focus color. */
  &:has(:focus-visible) {
    box-shadow:
      -1px 1px 1px 1px
        ${({ theme }) => theme.palette?.focusColor ?? palette.signal.links},
      1px -1px 1px 1px ${({ theme }) => theme.palette?.focusColor ?? palette.signal.links};
  }

  input[data-rg-item="true"]:focus-visible + .ds-radio__indicator {
    outline-color: ${({ theme }) =>
      theme.palette?.focusColor ?? palette.signal.links};
  }

  .ds-radio {
    color: ${({ theme }) => theme.checkbox?.labelColor ?? palette.pine1};
    margin-bottom: 0.25rem;
  }

  .ds-radio__label {
    ${({ theme }) => theme.checkbox?.labelTypography}
  }

  .ds-radio__indicator {
    border-color: ${({ theme }) =>
      theme.checkbox?.borderColor ?? palette.slate30};

    &::after {
      background: ${({ theme }) =>
        theme.checkbox?.checkedColor ?? palette.pine3};
    }
  }

  .ds-radio:has(input:checked) .ds-radio__indicator,
  .ds-radio:hover .ds-radio__indicator,
  .ds-radio:focus-within .ds-radio__indicator {
    border-color: ${({ theme }) =>
      theme.checkbox?.checkedColor ?? palette.pine3};
  }
`;
