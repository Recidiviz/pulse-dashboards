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
import { buttonOutline } from "../StyledComponents";

export const ModalRoot = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  border-radius: ${borderRadius[20]};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  width: 100%;
`;

export const ModalHeader = styled.div`
  align-items: flex-start;
  background-color: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  gap: ${spacing[6]};
  isolation: isolate;
  justify-content: flex-end;
  padding: ${spacing[8]} ${spacing[6]};
  position: relative;
  width: 100%;
`;

export const HeaderTextGroup = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${spacing[3]};
  justify-content: center;
  min-width: 0;
  text-align: center;
`;

export const SuccessIcon = styled.div`
  align-items: center;
  color: ${palette.foreground.success};
  display: flex;
  flex: none;
  height: 3rem;
  justify-content: center;
  width: 3rem;

  & > svg {
    height: 100%;
    width: 100%;
  }
`;

export const CloseButton = styled.button`
  ${buttonOutline}
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex: none;
  flex-shrink: 0;
  height: 1rem;
  padding: 0;
  position: absolute;
  right: ${spacing[6]};
  top: ${spacing[5]};
  width: 1rem;
  z-index: 1;

  & > svg {
    height: 100%;
    width: 100%;
  }
`;
