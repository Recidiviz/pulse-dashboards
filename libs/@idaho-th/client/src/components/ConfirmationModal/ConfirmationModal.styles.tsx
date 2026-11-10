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

import { borderRadius, palette, spacing } from "../../styles";
import { buttonOutline } from "../common/StyledComponents";

const MODAL_MAX_HEIGHT = "38.75rem";
const MODAL_MIN_HEIGHT = "7.5rem";

export const ModalRoot = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  border-radius: ${borderRadius[20]};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-height: ${MODAL_MAX_HEIGHT};
  max-width: 100%;
  min-height: ${MODAL_MIN_HEIGHT};
  width: 100%;
`;

export const ModalHeader = styled.div`
  align-items: flex-start;
  background-color: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex: none;
  flex-direction: row;
  gap: ${spacing[6]};
  isolation: isolate;
  justify-content: flex-end;
  padding: ${spacing[5]} ${spacing[6]} ${spacing[3]};
  position: relative;
  width: 100%;
`;

export const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: ${spacing[3]};
  min-width: 0;
  z-index: 0;
`;

export const IconSlot = styled.div`
  align-items: center;
  display: flex;
  flex: none;
  height: 2rem;
  justify-content: center;
  width: 2rem;

  & > svg {
    height: 100%;
    width: 100%;
  }
`;

export const HeaderTextGroup = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${spacing[1]};
  justify-content: center;
  min-width: 0;
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

export const ModalFooter = styled.div`
  align-items: center;
  background-color: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex: none;
  flex-direction: row;
  gap: ${spacing[2]};
  justify-content: flex-end;
  padding: ${spacing[3]} ${spacing[6]} ${spacing[4]};
  width: 100%;
`;

export const FooterSpacer = styled.div`
  flex: 1;
  min-width: 0;
`;
