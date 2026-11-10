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

export {
  CloseButton,
  FooterSpacer,
  HeaderTextGroup,
  ModalFooter,
  ModalHeader,
  ModalRoot,
} from "../ConfirmationModal/ConfirmationModal.styles";

export const ModalBody = styled.div`
  background-color: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${spacing[5]};
  padding: ${spacing[3]} ${spacing[6]};
  width: 100%;
`;

export const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const OptionItem = styled.label`
  align-items: center;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  height: 2rem;
  width: 100%;
`;

export const HiddenRadioInput = styled.input`
  height: 0;
  opacity: 0;
  pointer-events: none;
  position: absolute;
  width: 0;
`;

export const RadioCircle = styled.span<{ $checked: boolean }>`
  background: ${({ $checked }) =>
    $checked ? palette.background.brand : palette.background.secondary};
  border: ${({ $checked }) =>
    $checked ? "none" : `0.052rem solid ${palette.border.subtle}`};
  border-radius: 50%;
  flex-shrink: 0;
  height: 1.25rem;
  position: relative;
  width: 1.25rem;

  &::after {
    background: ${palette.background.primary};
    border-radius: 50%;
    content: "";
    display: ${({ $checked }) => ($checked ? "block" : "none")};
    height: 0.4rem;
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 0.4rem;
  }
`;

export const OptionLabel = styled.span`
  color: ${palette.foreground.secondary};
  flex: 1;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25rem;
`;

export const ReasonTextarea = styled.textarea`
  background: ${palette.background.secondary};
  border-radius: ${borderRadius[8]};
  border: 0.0625rem solid ${palette.border.subtle};
  box-sizing: border-box;
  color: ${palette.foreground.primary};
  font-size: 0.875rem;
  line-height: 1.25rem;
  min-height: 5rem;
  outline: none;
  overflow: hidden;
  padding: ${spacing[3]};
  resize: none;
  width: 100%;

  &::placeholder {
    color: ${palette.foreground.secondary};
  }

  &:focus {
    border-color: ${palette.border.brand};
    box-shadow: ${palette.shadow.brand};
  }
`;
