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

import { Button } from "~design-system";

export const FilterSection = styled.div`
  background: ${({ theme }) => theme.modal.backgroundColor};
  border-radius: 8px;
  box-shadow: inset 0 -1px 1px rgba(19, 44, 82, 0.1);
  margin-bottom: 1rem;
`;

export const FilterSectionContent = styled.div`
  padding: 1rem 1.5rem;
`;

export const ResetButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  ${({ theme }) => theme.typography.Sans14}
  font-family: ${({ theme }) => theme.typography.fontFamily};
  color: ${({ theme }) => theme.modal.resetColor};
  padding: 0;

  &:hover {
    text-decoration: underline;
    color: ${({ theme }) => theme.palette.focusColor};
  }
`;

export const ApplyButton = styled(Button)`
  background-color: ${({ theme }) => theme.palette.focusColor};
  border-color: ${({ theme }) => theme.palette.focusColor};

  &:hover {
    text-decoration: underline;
    background-color: ${({ theme }) => theme.palette.focusColor};
    border-color: ${({ theme }) => theme.palette.focusColor};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.focusColor};
    outline-offset: 2px;
  }
`;
