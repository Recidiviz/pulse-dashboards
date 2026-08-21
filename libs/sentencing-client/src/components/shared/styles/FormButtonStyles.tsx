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

import { palette, typography } from "~design-system";

// Shared button styles for modals and confirmations
export const Button = styled.button<{ padding?: string }>`
  padding: 0.75rem 2rem;
  border-radius: 0.25rem;
  font-family: "Public Sans";
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  line-height: 1.5;
  letter-spacing: -0.00875rem;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${({ padding }) => padding && `padding: ${padding};`}
`;

export const CancelButton = styled(Button)`
  ${typography.Sans14}
  font-weight: 600;
  padding: 10px 16px;
  border-radius: 4px;
  border: 1px solid ${palette.slate30};
  background: ${palette.white};
  color: ${palette.slate85};

  &:hover:not(:disabled) {
    background: ${palette.marble4};
  }
`;

export const SaveButton = styled(Button)`
  padding: 10px 16px;
  background: ${palette.signal.links};
  color: white;

  &:hover:not(:disabled) {
    background: ${palette.pine4};
  }

  ${({ padding }) => padding && `padding: ${padding};`}
`;

export const ButtonRow = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;
