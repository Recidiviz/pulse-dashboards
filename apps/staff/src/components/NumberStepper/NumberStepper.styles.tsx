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

// 32px matches the design system Button's block-shape `min-height`, which
// backs the adjacent frequency-unit `DropdownToggle`.
export const StepperWrapper = styled.div`
  display: inline-flex;
  align-items: stretch;
  min-height: 32px;
  border: 1px solid ${palette.slate20};
  border-radius: 4px;
  overflow: hidden;
`;

export const NumberField = styled.input`
  width: 2.5rem;
  border: none;
  padding: 4px 0 4px 12px;
  color: ${palette.pine2};
  font-weight: 500;
  font-size: 13px;
`;

export const ArrowStack = styled.div`
  display: flex;
  flex-direction: column;
  border-left: 1px solid ${palette.slate20};
`;

export const ArrowButton = styled.button.attrs({ type: "button" })`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 2px 6px;
  border: none;
  background: ${palette.marble1};
  line-height: 0;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${palette.slate10};
  }

  &:active:not(:disabled) {
    background: ${palette.slate20};
  }

  &:disabled {
    cursor: not-allowed;
    color: ${palette.slate30};
  }

  &:focus-visible {
    outline: 2px solid ${palette.signal.links};
    outline-offset: -2px;
  }
`;
