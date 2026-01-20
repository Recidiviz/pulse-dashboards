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

import styled from "styled-components";

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

  svg {
    width: 0.5rem;
    height: 0.5rem;
    display: block;
  }

  &:hover {
    color: ${palette.pine4};
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

  svg {
    width: 0.75rem;
    height: 0.75rem;
    display: block;
  }

  &:hover {
    color: ${palette.pine4};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const InfoRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const InfoItem = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const InfoLabel = styled.span`
  font-family: "Public Sans";
  font-size: 0.875rem;
  color: ${palette.slate70};
  line-height: 1.5;
`;

export const InfoValue = styled.span`
  font-family: "Public Sans";
  font-size: 0.875rem;
  color: ${palette.slate70};
  line-height: 1.5;
`;

export const DeleteConfirmation = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const DeleteText = styled.p`
  font-family: "Public Sans";
  font-size: 0.875rem;
  color: ${palette.pine1};
  margin: 0;
  line-height: 1.5;
`;
