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

import { BodyS1, Heading5, palette, spacing } from "../../../../../styles";

export const ModalRoot = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  border-radius: 1.25rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-width: 32.5rem;
  width: 32.5rem;
`;

export const ModalHeader = styled.div`
  align-items: flex-start;
  background-color: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  isolation: isolate;
  justify-content: flex-end;
  padding: ${spacing[5]} ${spacing[6]} ${spacing[3]} ${spacing[6]};
  position: relative;
  width: 100%;
`;

export const HeaderTextGroup = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.25rem;
  justify-content: center;
  min-width: 0;
  z-index: 0;
`;

export const ModalTitle = styled(Heading5)`
  color: ${palette.foreground.primary};
`;

export const CloseButton = styled.button`
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
  right: 1.5rem;
  top: 1.25rem;
  width: 1rem;
  z-index: 1;

  & > svg {
    height: 100%;
    width: 100%;

    path {
      fill: ${palette.foreground.tertiary};
    }
  }
`;

export const ModalBody = styled.div`
  align-items: center;
  background: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: ${spacing[5]};
  padding: ${spacing[3]} ${spacing[6]} ${spacing[3]} ${spacing[6]};
  width: 100%;
`;

export const BodySlot = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: ${spacing[4]};
  width: 100%;
`;

export const BadgesRow = styled.div`
  align-content: flex-start;
  align-items: center;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${spacing[2]};
  width: 100%;
`;

export const Badge = styled.div`
  align-items: center;
  background: ${palette.background.attentionLight};
  border-radius: 0.5rem;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  justify-content: center;
  padding: 0 ${spacing[2]};
`;

export const BadgeText = styled(BodyS1)`
  color: ${palette.foreground.attention};
`;

export const InputGroup = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: ${spacing[1]};
  width: 100%;
`;

export const TextArea = styled.textarea`
  background: ${palette.background.secondary};
  border: 1px solid ${palette.border.subtle};
  border-radius: 0.5rem;
  box-sizing: border-box;
  color: ${palette.foreground.secondary};
  font-size: 0.875rem;
  font-weight: 400;
  height: 6.25rem;
  letter-spacing: -0.0175rem;
  line-height: 1.25rem;
  outline: none;
  padding: ${spacing[3]};
  resize: none;
  width: 100%;

  &::placeholder {
    color: ${palette.foreground.secondary};
  }

  &:focus {
    border-color: ${palette.border.brand};
  }
`;

export const ModalFooter = styled.div`
  align-items: center;
  background-color: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  justify-content: flex-end;
  padding: ${spacing[3]} ${spacing[6]} ${spacing[4]} ${spacing[6]};
  width: 100%;
`;

export const FooterSpacer = styled.div`
  flex: 1;
  min-width: 0;
`;
