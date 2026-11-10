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

import styled, { keyframes } from "styled-components";

import {
  BodyS1,
  BodyS2,
  borderRadius,
  palette,
  spacing,
} from "../../../../styles";

const slideUpFadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const ModalRoot = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const ModalHeader = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: row;
  gap: ${spacing[6]};
  justify-content: flex-end;
  padding: ${spacing[5]} ${spacing[6]} ${spacing[3]};
  position: relative;
`;

export const HeaderTextGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[2]};
  align-items: flex-start;
  flex: 1;
`;

export const ModalTitle = styled.h2`
  color: ${palette.foreground.primary};
  font-family: "Inter";
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.36px;
  line-height: 26px;
  margin: 0;
  padding: 0;
`;

export const ModalSubtitle = styled(BodyS1)`
  animation: ${slideUpFadeIn} 0.3s ease-in-out;
  color: ${palette.foreground.secondary};
  margin: 0;
  padding: 0;
`;

export const CloseButton = styled.button`
  align-items: center;
  appearance: none;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex: none;
  height: 16px;
  justify-content: center;
  padding: 0;
  width: 16px;
  position: absolute;
  right: ${spacing[6]};
  top: ${spacing[5]};

  svg {
    height: 100%;
    width: 100%;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:not(:disabled):hover {
    opacity: 0.8;
  }
`;

export const ModalBody = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: ${spacing[5]};
  padding: ${spacing[3]} ${spacing[6]};
`;

export const BodySlot = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: ${spacing[4]};
  width: 100%;
`;

export const ProviderContainer = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: ${spacing[1]};
  width: 100%;
`;

export const ProviderLabel = styled(BodyS2)`
  font-weight: 500;
  color: ${palette.foreground.primary};
`;

export const MessageRow = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  width: 100%;
`;

export const VerticalDivider = styled.div`
  align-self: stretch;
  background: ${palette.misc.subtleAlpha};
  flex: none;
  width: 1px;
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
  border: 2px solid ${palette.misc.subtleAlpha};
  border-radius: ${borderRadius[8]};
  box-sizing: border-box;
  color: ${palette.foreground.primary};
  display: flex;
  font-family: "Inter";
  font-size: 14px;
  font-weight: 400;
  height: 80px;
  letter-spacing: -0.28px;
  line-height: 20px;
  outline: none;
  padding: ${spacing[3]};
  resize: none;
  width: 100%;

  &::placeholder {
    color: ${palette.foreground.secondary};
  }

  &:focus {
    border-color: ${palette.background.brand};
    box-shadow: ${palette.shadow.brand};
  }

  &:disabled {
    background: ${palette.background.primary};
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const ModalFooter = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  justify-content: flex-end;
  padding: ${spacing[3]} ${spacing[6]} ${spacing[4]};
`;

export const StyledActionButton = styled.div`
  button:disabled {
    background: ${palette.background.disabled} !important;
    color: ${palette.foreground.onDisabled} !important;
    opacity: 1 !important;
  }
`;
