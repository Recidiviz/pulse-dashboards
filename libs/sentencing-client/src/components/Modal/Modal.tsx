// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { Button, Modal as ModalBase, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import { palette } from "~design-system";

export const MAX_MODAL_HEIGHT = "90vh";
export const MODAL_PADDING = 40;

const StyledModal = styled(ModalBase)`
  .ReactModal__Content {
    max-height: ${MAX_MODAL_HEIGHT};
    width: ${rem(626)};
    padding: ${rem(MODAL_PADDING)};
  }
`;

const CloseButton = styled(Button).attrs({
  icon: "Close",
  iconSize: 16,
  kind: "borderless",
  shape: "block",
})`
  position: absolute;
  right: ${rem(spacing.lg)};
  top: ${rem(spacing.lg)};
  svg {
    fill: ${palette.slate60};
  }
`;

export const Modal: React.FC<{
  children: React.ReactNode;
  isOpen: boolean;
  hideModal: () => void;
}> = ({ children, isOpen, hideModal }) => {
  return (
    <StyledModal isOpen={isOpen} onRequestClose={hideModal}>
      <CloseButton onClick={hideModal} />
      {children}
    </StyledModal>
  );
};
