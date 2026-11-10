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

import UploadIcon from "../../../assets/upload.svg?react";
import XIcon from "../../../assets/x.svg?react";
import { Modal } from "../../../Modal";
import * as SharedStyled from "./InfoResponseModal.styles";
import * as Styled from "./RequestInfoModal.styles";

const PLACEHOLDER =
  "e.g. We need documentation of the client's current medications";

export interface RequestInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  initialMessage?: string;
  isLoading?: boolean;
}

export const RequestInfoModal: React.FC<RequestInfoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialMessage = "",
  isLoading = false,
}) => {
  const [message, setMessage] = useState(initialMessage);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Every open starts from the saved message; unsent edits are discarded on close.
  useEffect(() => {
    if (!isOpen) return;
    setMessage(initialMessage);
    textareaRef.current?.focus();
    textareaRef.current?.setSelectionRange(
      initialMessage.length,
      initialMessage.length,
    );
  }, [isOpen, initialMessage]);

  const trimmedMessage = message.trim();
  const canSend =
    trimmedMessage.length > 0 && trimmedMessage !== initialMessage.trim();

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
              What additional information do you need?
            </SharedStyled.ModalTitle>
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

            <Styled.Banner>
              <Styled.BannerIcon>
                <UploadIcon />
              </Styled.BannerIcon>
              <Styled.BannerText>
                If you have a form for the case manager to complete, upload it
                to the <Styled.BannerEmphasis>Documents</Styled.BannerEmphasis>{" "}
                tab and mention it in your message so they know to look.
              </Styled.BannerText>
            </Styled.Banner>
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
            onClick={() => onSubmit(trimmedMessage)}
            isLoading={isLoading}
            disabled={isLoading || !canSend}
          >
            Send info request
          </ActionButton>
        </SharedStyled.ModalFooter>
      </SharedStyled.ModalRoot>
    </Modal>
  );
};
