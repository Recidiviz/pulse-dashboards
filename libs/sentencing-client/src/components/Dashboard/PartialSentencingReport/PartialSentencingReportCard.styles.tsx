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
export const Container = styled.div`
  display: flex;
  width: 688px;
  padding: 32px 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 25px;
  border-radius: 10px;
  border: 1px solid ${palette.slate10};
  background: ${palette.white};
  box-shadow: 0 0 1px 0 ${palette.slate20} inset;
`;

export const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0px;
  padding-left: 24px;
  padding-right: 24px;
`;
export const Title = styled.div`
  color: ${palette.pine2};
  ${typography.Sans16}
`;
export const Subtitle = styled.div`
  color: ${palette.slate80};
  ${typography.Body14}
`;

export const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  padding-left: 24px;
  padding-right: 24px;
`;
export const OptionTextContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
`;
export const OptionTitle = styled.div`
  color: ${palette.slate80};
  ${typography.Sans14}
`;

export const OptionContainer = styled.label`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px;
  gap: 8px;
  align-self: stretch;
  border: 1px solid ${palette.slate20};
  border-radius: 0.5rem;
  cursor: pointer;
  ${typography.Sans14}
  color: ${palette.slate85};

  &:has(input:checked) {
    border: 1px solid ${palette.pine4};
    background: rgba(43, 105, 105, 0.03);
  }
`;

export const RadioInput = styled.input`
  appearance: none;
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  border: 1px solid ${palette.slate30};
  border-radius: 50%;
  cursor: pointer;

  &:checked {
    border: 1px solid ${palette.pine4};
    background: radial-gradient(circle, ${palette.pine4} 40%, transparent 40%);
  }
`;

export const Button = styled.button`
  padding: 12px 32px;
  ${typography.Sans14}
  cursor: pointer;
  border-radius: 4px;
  border: none;
  background: ${palette.white};
  color: ${palette.slate85};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const SaveButton = styled(Button)`
  border: none;
  background: ${palette.signal.links};
  color: ${palette.white};

  &:hover:not(:disabled) {
    background: ${palette.pine4};
  }
`;

export const ButtonRow = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;
