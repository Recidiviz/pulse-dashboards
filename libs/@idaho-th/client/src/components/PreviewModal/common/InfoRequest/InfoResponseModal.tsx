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
import toast from "react-hot-toast";

import { ActionButton } from "~@idaho-th/client/components/common/buttons";

import QuotesIcon from "../../../assets/quotes-icon.svg?react";
import XIcon from "../../../assets/x.svg?react";
import { Modal } from "../../../Modal";
import { ScrollableText as MessageText } from "./InfoRequest.styles";
import * as Styled from "./InfoResponseModal.styles";

export interface InfoResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (response: string) => void | Promise<void>;
  providerName: string;
  message: string;
  isLoading?: boolean;
}

export const InfoResponseModal: React.FC<InfoResponseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  providerName,
  message,
  isLoading = false,
}) => {
  const [response, setResponse] = useState("");

  const handleSubmit = async () => {
    if (!response) {
      toast("Please provide a response before submitting.");
      return;
    }
    await onSubmit(response);
    setResponse("");
  };

  const handleClose = () => {
    setResponse("");
    onClose();
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
            <Styled.ModalTitle>Provide info to provider</Styled.ModalTitle>
            {response && (
              <Styled.ModalSubtitle>
                Provide the information requested by the provider. This message
                will be sent directly to them
              </Styled.ModalSubtitle>
            )}
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
          <Styled.BodySlot>
            <Styled.ProviderContainer>
              <Styled.ProviderLabel>{providerName}</Styled.ProviderLabel>

              <Styled.MessageRow>
                <Styled.VerticalDivider />
                <MessageText>{message}</MessageText>
                <QuotesIcon />
              </Styled.MessageRow>
            </Styled.ProviderContainer>

            <Styled.InputGroup>
              <Styled.TextArea
                placeholder="Provide the requested information..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                disabled={isLoading}
              />
            </Styled.InputGroup>
          </Styled.BodySlot>
        </Styled.ModalBody>

        <Styled.ModalFooter>
          <Styled.StyledActionButton>
            <ActionButton
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </ActionButton>
          </Styled.StyledActionButton>
          <Styled.StyledActionButton>
            <ActionButton
              variant={response ? "primary" : "secondary"}
              onClick={handleSubmit}
              disabled={isLoading || !response}
            >
              Submit
            </ActionButton>
          </Styled.StyledActionButton>
        </Styled.ModalFooter>
      </Styled.ModalRoot>
    </Modal>
  );
};
