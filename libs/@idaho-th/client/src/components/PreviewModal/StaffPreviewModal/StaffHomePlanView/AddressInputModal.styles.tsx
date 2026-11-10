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

import {
  BodyS1,
  borderRadius,
  interBase,
  palette,
  spacing,
} from "../../../../styles";
import { buttonOutline } from "../../../common/StyledComponents";

export const ModalRoot = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  border-radius: ${borderRadius[20]};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-height: 38.75rem;
  max-width: 32.5rem;
  min-height: 7.5rem;
  width: 32.5rem;
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
  background: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex: none;
  flex-direction: column;
  gap: ${spacing[4]};
  padding: ${spacing[3]} ${spacing[6]};
  width: 100%;
`;

// Shared text-box metrics so the ghost mirror lines up exactly with the
// textarea's real text.
const textBoxMetrics = `
  box-sizing: border-box;
  ${interBase}
  font-size: 14px;
  font-weight: 400;
  height: 100%;
  letter-spacing: -0.28px;
  line-height: 20px;
  padding: ${spacing[3]};
  width: 100%;
`;

interface AddressFieldState {
  $hasValue: boolean;
  $hasError: boolean;
}

const borderColor = ({ $hasValue, $hasError }: AddressFieldState) => {
  if ($hasError) return palette.border.attention;
  return $hasValue ? palette.border.brand : palette.border.subtle;
};

const boxShadow = ({ $hasValue, $hasError }: AddressFieldState) =>
  $hasValue && !$hasError ? palette.shadow.brand : "none";

export const AddressFieldWrapper = styled.div<AddressFieldState>`
  background: ${palette.background.secondary};
  border-radius: ${borderRadius[8]};
  border: 1px solid ${borderColor};
  box-shadow: ${boxShadow};
  box-sizing: border-box;
  height: 5rem;
  min-height: 5rem;
  overflow: hidden;
  position: relative;
  width: 100%;

  &:focus-within {
    border-color: ${({ $hasError }) =>
      $hasError ? palette.border.attention : palette.border.brand};
    box-shadow: ${({ $hasError }) =>
      $hasError ? "none" : palette.shadow.brand};
  }
`;

// Sits on top of the textarea, transparent to clicks, rendering the typed text
// invisibly (to push the ghost to the caret) plus the greyed-out completion.
export const GhostMirror = styled.div`
  ${textBoxMetrics}
  color: transparent;
  inset: 0;
  overflow: hidden;
  overflow-wrap: break-word;
  pointer-events: none;
  position: absolute;
  white-space: pre-wrap;
  z-index: 1;
`;

export const GhostSuffix = styled.span`
  color: ${palette.foreground.secondary};
`;

export const AddressTextarea = styled.textarea<{ $hasValue: boolean }>`
  ${textBoxMetrics}
  background: transparent;
  border: none;
  color: ${({ $hasValue }) =>
    $hasValue ? palette.foreground.primary : palette.foreground.secondary};
  display: block;
  outline: none;
  position: relative;
  resize: none;
  scrollbar-width: thin;
  z-index: 0;

  &::placeholder {
    color: ${palette.foreground.secondary};
  }
`;

export const AddressField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[2]};
  width: 100%;
`;

export const AddressErrorText = styled(BodyS1)`
  color: ${palette.foreground.attention};
  width: 100%;
`;

export const AddressOptionRow = styled.div`
  align-items: center;
  display: flex;
  flex: none;
  flex-direction: row;
  gap: ${spacing[2]};
  min-height: 1.25rem;
  width: 100%;
`;

export const AddressOptionText = styled(BodyS1)`
  color: ${palette.foreground.primary};
  flex: 1;
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
