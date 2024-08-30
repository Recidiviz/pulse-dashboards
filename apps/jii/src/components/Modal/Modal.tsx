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

import {
  Button,
  Icon,
  Modal as ModalBase,
  spacing,
} from "@recidiviz/design-system";
import { rem } from "polished";
import { FC, ReactNode } from "react";
import styled from "styled-components/macro";

import { PAGE_WIDTH } from "../../utils/constants";
import { ModalProps } from "./types";

export const MAX_MODAL_HEIGHT = "90vh";
export const MODAL_PADDING = spacing.xxl;

const StyledModal = styled(ModalBase)`
  .ReactModal__Content {
    max-height: ${MAX_MODAL_HEIGHT};
    padding: ${rem(MODAL_PADDING)};
    width: ${rem(PAGE_WIDTH * 0.9)};
  }
`;

const CloseButton = styled(Button).attrs({
  kind: "borderless",
  shape: "block",
})`
  padding: ${rem(spacing.md)};
  position: absolute;
  right: ${rem(spacing.sm)};
  top: ${rem(spacing.sm)};
`;

export const Modal: FC<
  { children: ReactNode; className?: string } & ModalProps
> = ({ children, className, isOpen, hideModal }) => {
  return (
    <StyledModal
      className={className}
      isOpen={isOpen}
      onRequestClose={hideModal}
    >
      <CloseButton onClick={hideModal}>
        {/* TODO(https://github.com/Recidiviz/web-libraries/issues/188): accessibility workaround */}
        <Icon kind="Close" size={16} role="img" aria-label="Close" />
      </CloseButton>
      {children}
    </StyledModal>
  );
};
