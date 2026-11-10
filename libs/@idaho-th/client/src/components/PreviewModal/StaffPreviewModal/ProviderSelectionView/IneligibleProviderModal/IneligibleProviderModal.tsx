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

import type { HousingProvider } from "~@idaho-th/client/interfaces/common";
import { ELIGIBILITY_OVERRIDE_NOTE_MAX_LENGTH } from "~@idaho-th/shared";

import XIcon from "../../../../assets/x.svg?react";
import { ActionButton } from "../../../../common/buttons";
import { Modal } from "../../../../Modal";
import { BadgeRow } from "../../common";
import * as Styled from "./IneligibleProviderModal.styles";

export interface IneligibleProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (provider: HousingProvider, note: string) => void;
  provider: HousingProvider;
}

export const IneligibleProviderModal: React.FC<
  IneligibleProviderModalProps
> = ({ isOpen, onClose, provider, onConfirm }) => {
  const [note, setNote] = useState("");
  const { labels = [], name } = provider;

  const handleConfirm = () => {
    onConfirm(provider, note);
  };

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
          <Styled.HeaderTextGroup>
            <Styled.ModalTitle>{`The client doesn’t meet the following eligibility requirements for ${name}`}</Styled.ModalTitle>
          </Styled.HeaderTextGroup>

          <Styled.CloseButton
            type="button"
            aria-label="Close modal"
            onClick={onClose}
          >
            <XIcon />
          </Styled.CloseButton>
        </Styled.ModalHeader>

        <Styled.ModalBody>
          <Styled.BodySlot>
            {labels.length > 0 && (
              <Styled.BadgesRow>
                <BadgeRow labels={labels} />
              </Styled.BadgesRow>
            )}

            <Styled.InputGroup>
              <Styled.TextArea
                maxLength={ELIGIBILITY_OVERRIDE_NOTE_MAX_LENGTH}
                placeholder="Why are you adding this provider? This note is internal to Recidiviz and helps us learn when the eligibility criteria fall short"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Styled.InputGroup>
          </Styled.BodySlot>
        </Styled.ModalBody>

        <Styled.ModalFooter>
          <Styled.FooterSpacer aria-hidden />
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton variant="primary" onClick={handleConfirm}>
            Add Provider
          </ActionButton>
        </Styled.ModalFooter>
      </Styled.ModalRoot>
    </Modal>
  );
};
