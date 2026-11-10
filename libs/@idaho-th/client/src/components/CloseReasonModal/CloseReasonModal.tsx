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

import React, { useState } from "react";

import {
  CLOSE_APPLICATION_REASONS,
  CloseApplicationReason,
  CLOSED_OUTCOME_NOTE_MAX_LENGTH,
} from "~@idaho-th/shared";

import { BodyM2, BodyS1, Heading5, palette } from "../../styles";
import XIcon from "../assets/x.svg?react";
import { ActionButton } from "../common/buttons";
import { Modal } from "../Modal/Modal";
import * as Styled from "./CloseReasonModal.styles";

export type {
  CloseApplicationReason,
  ClosedOutcomeValue,
} from "~@idaho-th/shared";
export {
  CLOSE_APPLICATION_REASONS,
  REASON_TO_CLOSED_OUTCOME,
} from "~@idaho-th/shared";

export interface CloseReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: CloseApplicationReason, otherText?: string) => void;
  isLoading?: boolean;
}

export const CloseReasonModal: React.FC<CloseReasonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [selectedReason, setSelectedReason] =
    useState<CloseApplicationReason | null>(null);
  const [otherText, setOtherText] = useState("");

  const isOtherSelected = selectedReason === "other";
  const isSubmitDisabled =
    !selectedReason || (isOtherSelected && !otherText.trim());

  const handleClose = () => {
    setSelectedReason(null);
    setOtherText("");
    onClose();
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOtherText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleSubmit = () => {
    if (!selectedReason || isSubmitDisabled) return;
    onSubmit(selectedReason, isOtherSelected ? otherText : undefined);
  };

  return (
    <Modal
      isOpen={isOpen}
      hideModal={handleClose}
      width="32.5rem"
      maxWidth="32.5rem"
      padding="0"
    >
      <Styled.ModalRoot>
        <Styled.ModalHeader>
          <Styled.HeaderTextGroup>
            <Heading5 $color={palette.foreground.primary}>
              Mark Application Complete
            </Heading5>
            <BodyS1 $color={palette.foreground.secondary}>
              This will close the application and can&apos;t be undone. To start
              a new application, you&apos;ll need to duplicate the application
              under &quot;Application details&quot;.
            </BodyS1>
          </Styled.HeaderTextGroup>

          <Styled.CloseButton
            type="button"
            aria-label="Close modal"
            onClick={handleClose}
            disabled={isLoading}
          >
            <XIcon />
          </Styled.CloseButton>
        </Styled.ModalHeader>

        <Styled.ModalBody>
          <BodyM2 $color={palette.foreground.primary}>
            How did this case resolve?
          </BodyM2>

          <Styled.OptionList>
            {CLOSE_APPLICATION_REASONS.map(({ value, label }) => (
              <Styled.OptionItem key={value}>
                <Styled.HiddenRadioInput
                  type="radio"
                  name="closeReason"
                  value={value}
                  checked={selectedReason === value}
                  onChange={() => setSelectedReason(value)}
                />
                <Styled.RadioCircle $checked={selectedReason === value} />
                <Styled.OptionLabel>{label}</Styled.OptionLabel>
              </Styled.OptionItem>
            ))}
          </Styled.OptionList>

          {isOtherSelected && (
            <Styled.ReasonTextarea
              placeholder="Describe how the case was resolved"
              value={otherText}
              maxLength={CLOSED_OUTCOME_NOTE_MAX_LENGTH}
              onChange={handleTextareaChange}
            />
          )}
        </Styled.ModalBody>

        <Styled.ModalFooter>
          <Styled.FooterSpacer aria-hidden />
          <ActionButton
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Go back
          </ActionButton>
          <ActionButton
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            isLoading={isLoading}
          >
            Mark Application Complete
          </ActionButton>
        </Styled.ModalFooter>
      </Styled.ModalRoot>
    </Modal>
  );
};
