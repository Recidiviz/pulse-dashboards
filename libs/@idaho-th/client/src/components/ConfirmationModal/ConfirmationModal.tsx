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

import React from "react";

import { BodyS1, Heading5, palette } from "../../styles";
import XIcon from "../assets/x.svg?react";
import { ActionButton, ActionButtonVariant } from "../common/buttons";
import { Modal } from "../Modal/Modal";
import * as Styled from "./ConfirmationModal.styles";

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  heading: string;
  subheading?: string | React.ReactNode;
  icon?: React.ReactNode;
  secondaryBtnText?: string;
  primaryBtnText?: string;
  variant?: ActionButtonVariant;
  isLoading?: boolean;
  hideSecondaryButton?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  heading,
  subheading,
  icon,
  secondaryBtnText = "Go Back",
  primaryBtnText = "Confirm",
  variant = "primary",
  isLoading = false,
  hideSecondaryButton = false,
}) => {
  const subheadingContent =
    typeof subheading === "string" ? (
      <BodyS1 $color={palette.foreground.secondary}>{subheading}</BodyS1>
    ) : (
      subheading ?? null
    );

  return (
    <Modal
      isOpen={isOpen}
      hideModal={onClose}
      width="32.5rem"
      maxWidth="32.5rem"
      padding="0"
    >
      <Styled.ModalRoot>
        <Styled.ModalHeader>
          <Styled.HeaderContent>
            {icon && <Styled.IconSlot>{icon}</Styled.IconSlot>}
            <Styled.HeaderTextGroup>
              <Heading5 $color={palette.foreground.primary}>{heading}</Heading5>
              {subheadingContent}
            </Styled.HeaderTextGroup>
          </Styled.HeaderContent>

          <Styled.CloseButton
            type="button"
            aria-label="Close modal"
            onClick={onClose}
          >
            <XIcon />
          </Styled.CloseButton>
        </Styled.ModalHeader>

        <Styled.ModalFooter>
          <Styled.FooterSpacer aria-hidden />
          {!hideSecondaryButton && (
            <ActionButton
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              {secondaryBtnText}
            </ActionButton>
          )}
          <ActionButton
            variant={variant}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {primaryBtnText}
          </ActionButton>
        </Styled.ModalFooter>
      </Styled.ModalRoot>
    </Modal>
  );
};
