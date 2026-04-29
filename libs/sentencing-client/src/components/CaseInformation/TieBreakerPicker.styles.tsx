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

import { rgba } from "polished";
import styled from "styled-components";

import { palette } from "~design-system";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-self: stretch;
  gap: 0.5rem;
  padding-left: 2.5rem;
  padding-right: 2rem;
`;

export const Title = styled.div`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 1rem;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.01em;
  margin-bottom: -0.25rem;
`;

export const Subtitle = styled.div`
  color: ${palette.slate85};
  font-family: "Public Sans";
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 150%;
`;

export const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.5rem;
`;

export const OptionLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  width: 100%;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  border: 1px solid ${palette.slate20};
  border-radius: 0.5rem;
  cursor: pointer;
  font-family: "Public Sans";
  font-size: 0.875rem;
  color: ${palette.slate85};

  &:has(input:checked) {
    border: 1px solid ${rgba(palette.pine4, 0.4)};
    background: ${rgba(palette.pine4, 0.03)};
  }
`;

export const RadioInput = styled.input`
  appearance: none;
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  border: 1px solid ${palette.slate30};
  border-radius: 50%;
  margin-top: 0.125rem;
  cursor: pointer;

  &:checked {
    border: 1px solid ${palette.pine4};
    background: radial-gradient(circle, ${palette.pine4} 40%, transparent 40%);
  }
`;

export const OptionText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;
