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

import styled, { css } from "styled-components";

import { palette } from "~design-system";

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
`;

export const IconRow = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: flex-start;
`;

export const EditButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${palette.pine3};
  position: absolute;
  right: 1.1875rem;
  top: 0.1875rem;
  outline: none;

  svg {
    width: 0.75rem;
    height: 0.75rem;
    display: block;
  }

  &:hover {
    color: ${palette.pine4};
  }

  &:focus,
  &:active {
    outline: none;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const DeleteIconButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${palette.pine3};
  position: absolute;
  right: 0;
  top: 0;
  outline: none;

  svg {
    width: 1rem;
    height: 1rem;
    display: block;
  }

  &:hover {
    color: ${palette.pine4};
  }

  &:focus,
  &:active {
    outline: none;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const DataRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding-right: 2.5rem; /* Space for edit/delete icons */
`;

const historyTextBase = css`
  font-family: "Public Sans";
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
`;

export const DataSubtitle = styled.div`
  ${historyTextBase}
  color: ${palette.slate70};
  line-height: 120%; /* 16.8px */
  letter-spacing: -0.14px;
`;

export const DataCell = styled.div`
  ${historyTextBase}
  flex: 1;
  line-height: 150%; /* 21px */
  color: ${palette.slate85};
`;

export { UndoButton, UndoToastContent } from "../shared/styles/ToastStyles";
