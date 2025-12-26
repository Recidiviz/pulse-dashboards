// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { typography } from "@recidiviz/design-system";
import styled from "styled-components";

import { palette } from "~design-system";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  align-self: stretch;
`;

export const Label = styled.label`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 1rem;
  font-style: normal;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.01rem;
`;

export const StyledTextArea = styled.textarea<{ height: string }>`
  ${typography.Sans14}
  display: flex;
  height: ${({ height }) => height};
  padding: 1rem;
  align-items: flex-start;
  gap: 0.5rem;
  align-self: stretch;
  border-radius: 0.5rem;
  border: 1px solid rgba(0, 102, 95, 0.4);
  background: rgba(43, 105, 105, 0.03);
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${palette.pine4};
  }

  &::placeholder {
    color: ${palette.slate40};
  }

  &:disabled {
    cursor: not-allowed;
  }
`;
