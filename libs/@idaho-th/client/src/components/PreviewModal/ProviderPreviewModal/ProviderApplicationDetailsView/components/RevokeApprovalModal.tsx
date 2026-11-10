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

import React, { useEffect, useRef, useState } from "react";

import { ActionButton } from "~@idaho-th/client/components/common/buttons";
import { INFO_REQUEST_MESSAGE_MAX_LENGTH } from "~@idaho-th/shared";

import XIcon from "../../../../assets/x.svg?react";
import { Modal } from "../../../../Modal";
import * as SharedStyled from "../../../common/InfoRequest/InfoResponseModal.styles";

const PLACEHOLDER = "Describe why you are revoking this approval...";
const SHARED_REASON_NOTE =
  "Your reason will also be shared with the case manager.";
const CLOSES_CASE_WARNING =
  "As the selected home plan, revoking will close this application and it can't be undone.";

export interface RevokeApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  isLoading?: boolean;
  /** True when the provider is the home plan, so the revoke closes the case. */
  closesCase?: boolean;
}

export const RevokeApprovalModal: React.FC<RevokeApprovalModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  closesCase = false,
}) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMessage("");
    textareaRef.current?.focus();
  }, [isOpen]);

  const trimmedMessage = message.trim();
  const canSend = trimmedMessage.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      hideModal={onClose}
      width="34.5rem"
      maxWidth="34.5rem"
      padding="0"
    >
      <SharedStyled.ModalRoot>
        <SharedStyled.ModalHeader>
          <SharedStyled.HeaderTextGroup>
            <SharedStyled.ModalTitle>
              Revoke Conditional Approval
            </SharedStyled.ModalTitle>
            <SharedStyled.ModalSubtitle>
              {closesCase && `${CLOSES_CASE_WARNING} `}
              {SHARED_REASON_NOTE}
            </SharedStyled.ModalSubtitle>
          </SharedStyled.HeaderTextGroup>

          <SharedStyled.CloseButton
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            disabled={isLoading}
          >
            <XIcon />
          </SharedStyled.CloseButton>
        </SharedStyled.ModalHeader>

        <SharedStyled.ModalBody>
          <SharedStyled.BodySlot>
            <SharedStyled.InputGroup>
              <SharedStyled.TextArea
                ref={textareaRef}
                placeholder={PLACEHOLDER}
                maxLength={INFO_REQUEST_MESSAGE_MAX_LENGTH}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isLoading}
              />
            </SharedStyled.InputGroup>
          </SharedStyled.BodySlot>
        </SharedStyled.ModalBody>

        <SharedStyled.ModalFooter>
          <ActionButton
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </ActionButton>
          <ActionButton
            variant="destructive"
            onClick={() => onSubmit(trimmedMessage)}
            isLoading={isLoading}
            disabled={isLoading || !canSend}
          >
            Revoke approval
          </ActionButton>
        </SharedStyled.ModalFooter>
      </SharedStyled.ModalRoot>
    </Modal>
  );
};
