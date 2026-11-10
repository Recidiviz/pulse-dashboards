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

import { borderRadius, palette, spacing } from "../../../styles";

export const DropdownContainer = styled.div`
  align-items: flex-start;
  align-self: stretch;
  background: ${palette.background.primary};
  border-radius: ${borderRadius[20]};
  box-shadow: 3px 3px 30px 5px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  flex: none;
  isolation: isolate;
  max-height: 320px;
  margin-top: ${spacing[1.5]};
  overflow: hidden;
  padding: ${spacing[2]} 0px;
  position: absolute;
  top: 100%;
  width: 100%;
  z-index: 4;
`;

export const DropdownSlot = styled.div`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding: 0;
  position: relative;
`;

export const EmptyState = styled.div`
  align-items: center;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: ${spacing[2]};
  justify-content: center;
  min-height: 124px;
  text-align: center;
  width: 100%;
`;

export const SkeletonItem = styled.div`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 8px;
  height: 32px;
  justify-content: center;
  padding: 8px 12px;
`;

export const SkeletonBar = styled.div`
  background: ${palette.background.secondary};
  border-radius: ${borderRadius.round};
  flex: none;
  height: 12px;
  width: 220px;
`;

export const SelectItem = styled.button<{ $active?: boolean }>`
  align-items: center;
  align-self: stretch;
  background: ${({ $active }) =>
    $active ? palette.state.hover : "transparent"};
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  flex: none;
  gap: 8px;
  height: 32px;
  border-radius: ${borderRadius[12]};
  padding: 0px ${spacing[3]};

  &:hover {
    background: ${palette.state.hover};
  }
`;

export const SelectItemText = styled.span`
  color: ${palette.foreground.secondary};
  flex: 1;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  height: 20px;
  letter-spacing: -0.28px;
  line-height: 20px;
  text-align: left;
`;

export const ScrollBar = styled.div`
  align-items: center;
  background: ${palette.border.subtle};
  border-radius: 999px;
  display: flex;
  flex-direction: row;
  flex: none;
  gap: 10px;
  height: 100px;
  padding: 0;
  position: absolute;
  right: 4px;
  top: 12px;
  width: 4px;
`;
