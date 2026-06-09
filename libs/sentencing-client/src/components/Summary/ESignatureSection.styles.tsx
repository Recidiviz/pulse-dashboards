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

import { customPalette } from "../styles/palette";

export const FormsRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 24px;
  width: 100%;
`;

export const SignatureFormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const FieldLabel = styled.label<{ $active?: boolean }>`
  color: ${({ $active }) => ($active ? palette.pine1 : palette.slate60)};
  font-family: "Public Sans";
  font-size: 15px;
  font-weight: 500;
  line-height: 150%;
`;

export const SignatureInput = styled.input`
  padding: 8px;
  border: 1px solid ${customPalette.green.light4};
  border-radius: 8px;
  background: ${customPalette.green.light1};
  color: ${palette.pine3};
  font-family: "Public Sans";
  font-size: 13px;
  font-weight: 500;
  width: 100%;

  &::placeholder {
    color: ${palette.slate40};
  }

  &:focus {
    outline: none;
    border-color: ${palette.pine4};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:read-only {
    cursor: default;
    opacity: 0.6;
  }
`;

export const SignButton = styled.button`
  display: flex;
  height: 34px;
  padding: 4px 14px;
  justify-content: center;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  border-radius: 4px;
  background: ${palette.pine4};
  color: ${palette.white};
  border: none;
  cursor: pointer;
  font-family: "Public Sans";
  font-size: 0.8125rem;
  font-weight: 600;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const EditButton = styled(SignButton)`
  background: transparent;
  color: ${palette.pine4};
  border: 1px solid ${palette.pine4};
`;

export const HelperText = styled.p`
  color: ${palette.slate60};
  font-family: "Public Sans";
  font-size: 12px;
  font-weight: 400;
  line-height: 150%;
  margin: 0;
`;

export const SignedDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const SignedName = styled.div`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 14px;
  font-weight: 500;
  line-height: 150%;
`;

export const SignedMeta = styled.div`
  color: ${palette.slate85};
  font-family: "Public Sans";
  font-size: 13px;
  font-weight: 400;
  line-height: 150%;
`;
