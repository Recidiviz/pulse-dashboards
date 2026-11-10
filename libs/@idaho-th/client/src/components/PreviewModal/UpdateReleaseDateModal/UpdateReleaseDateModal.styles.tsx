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

import { BodyS1, borderRadius, palette, spacing } from "../../../styles";
import { buttonOutline } from "../../common/StyledComponents";

export const ModalRoot = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  border-radius: ${borderRadius[20]};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-width: 32.5rem;
  width: 32.5rem;
`;

export const ModalHeader = styled.div`
  align-items: flex-start;
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

export const HeaderTextGroup = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${spacing[1]};
  justify-content: center;
  min-width: 0;
  z-index: 0;
`;

export const CloseButton = styled.button`
  ${buttonOutline}
  align-items: center;
  background: none;
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

export const ModalBody = styled.div`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  flex: none;
  flex-direction: column;
  gap: ${spacing[5]};
  padding: ${spacing[3]} ${spacing[6]};
  width: 100%;
`;

export const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[1]};
  width: 100%;
`;

export const LabelRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
`;

export const IconBox = styled.div`
  display: flex;
  margin-bottom: 1.5px;
`;

export const Label = styled(BodyS1)`
  color: ${palette.foreground.primary};
  font-weight: 600;
`;

/**
 * Deliberately muted rather than alarming: the date picker's error border
 * already carries the signal, and correcting a release date is routine.
 */
export const PastDateHint = styled(BodyS1)`
  font-weight: 400;
  color: ${palette.foreground.attention};
`;

export const ModalFooter = styled.div`
  align-items: center;
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
