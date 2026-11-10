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

import { palette } from "../../../styles";

export const SearchBarContainer = styled.div`
  position: relative;
  width: 100%;
`;

export const SearchFieldWrapper = styled.div`
  align-items: center;
  align-self: stretch;
  background: ${palette.background.secondary};
  border-radius: 8px;
  border: 1px solid transparent;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex: none;
  gap: 8px;
  height: 32px;
  padding: 0 8px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  width: 100%;

  &:focus-within {
    border-color: ${palette.foreground.brand};
    box-shadow: ${palette.shadow.brand};
  }
`;

export const SearchIcon = styled.span`
  align-items: center;
  color: ${palette.foreground.tertiary};
  display: flex;
  flex-shrink: 0;
  height: 16px;
  justify-content: center;
  width: 16px;

  svg {
    height: 16px;
    width: 16px;
  }
`;

export const SearchInput = styled.input`
  background: transparent;
  border: none;
  color: ${palette.foreground.primary};
  flex: 1;
  font-size: 14px;
  font-weight: 400;
  height: 20px;
  letter-spacing: -0.28px;
  line-height: 20px;
  min-width: 0;
  outline: none;

  &::placeholder {
    color: ${palette.foreground.tertiary};
  }
`;

export const ClearButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  color: ${palette.foreground.tertiary};
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  height: 16px;
  justify-content: center;
  padding: 0;
  width: 16px;

  svg {
    height: 16px;
    width: 16px;
  }

  &:hover {
    color: ${palette.foreground.secondary};
  }
`;
