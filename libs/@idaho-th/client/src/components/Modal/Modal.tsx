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

import { Modal as ModalBase } from "@recidiviz/design-system";
import styled from "styled-components";

import { palette } from "../../styles";

const StyledModal = styled(ModalBase)<{
  $width?: string;
  $height?: string;
  $maxWidth?: string;
  $padding?: string;
}>`
  .ReactModal__Overlay {
    background-color: ${palette.scrim.default};
  }

  .ReactModal__Content {
    border: none;
    border-radius: 1.25rem;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    height: ${({ $height }) => $height ?? "auto"};
    margin: auto;
    max-width: ${({ $maxWidth }) => $maxWidth ?? "unset"};
    outline: none;
    overflow: hidden;
    padding: ${({ $padding }) => $padding ?? "0"};
    width: ${({ $width }) => $width ?? "auto"};
  }
`;

export const Modal: React.FC<{
  children: React.ReactNode;
  isOpen: boolean;
  hideModal: () => void;
  width?: string;
  height?: string;
  maxWidth?: string;
  padding?: string;
}> = ({ children, isOpen, hideModal, width, height, maxWidth, padding }) => {
  return (
    <StyledModal
      isOpen={isOpen}
      onRequestClose={hideModal}
      appElement={document.getElementById("root") ?? document.body}
      $width={width}
      $height={height}
      $maxWidth={maxWidth}
      $padding={padding}
    >
      {children}
    </StyledModal>
  );
};
