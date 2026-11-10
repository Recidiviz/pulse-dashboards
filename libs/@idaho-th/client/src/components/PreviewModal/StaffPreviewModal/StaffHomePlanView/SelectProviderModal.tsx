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

import { ConfirmationModal } from "~@idaho-th/client/components/ConfirmationModal";
import type { HousingProvider } from "~@idaho-th/client/interfaces/common";

import { BodyS1, Heading5, palette } from "../../../../styles";
import XIcon from "../../../assets/x.svg?react";
import { ActionButton } from "../../../common/buttons";
import { Spinner } from "../../../common/LoadingSpinner/Spinner";
import { Modal } from "../../../Modal/Modal";
import { ConditionallyApprovedCard } from "../ProviderResponses/cards";
import * as Styled from "./SelectProviderModal.styles";

interface SelectProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProvider: (provider: HousingProvider) => void;
  providers: HousingProvider[];
  isLoading: boolean;
  isError: boolean;
}

export const SelectProviderModal: React.FC<SelectProviderModalProps> = ({
  isOpen,
  onClose,
  onSelectProvider,
  providers,
  isLoading,
  isError,
}) => {
  if (!isLoading && !isError && providers.length === 0) {
    return (
      <ConfirmationModal
        isOpen={isOpen}
        onClose={onClose}
        heading="No eligible providers"
        subheading="Providers must submit an approval before they can be selected."
        primaryBtnText="Close"
        onConfirm={onClose}
        hideSecondaryButton
      />
    );
  }
  return (
    <Modal
      isOpen={isOpen}
      hideModal={onClose}
      width="36.5rem"
      maxWidth="36.5rem"
      padding="0"
    >
      <Styled.ModalRoot>
        <Styled.ModalHeader>
          <Styled.HeaderTextGroup>
            <Heading5 $color={palette.foreground.primary}>
              Select Home Plan Provider
            </Heading5>
            <BodyS1 $color={palette.foreground.secondary}>
              Choose from providers who have responded to this application.
            </BodyS1>
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
          {isLoading && (
            <Styled.StateContainer>
              <Spinner size="1.5rem" />
            </Styled.StateContainer>
          )}

          {!isLoading && isError && (
            <Styled.StateContainer>
              <Styled.StateMessage $error>
                Failed to load eligible providers. Please try again.
              </Styled.StateMessage>
            </Styled.StateContainer>
          )}

          {!isLoading && !isError && providers.length > 0 && (
            <Styled.ProvidersList>
              {providers.map((provider) => (
                <ConditionallyApprovedCard
                  key={provider.id}
                  providerName={provider.name}
                  providerId={provider.id}
                  labels={provider.labels}
                  isPreferred={provider.isPreferred}
                  acceptButton={
                    <Styled.SelectButton
                      type="button"
                      onClick={() => onSelectProvider(provider)}
                    >
                      Set as Home Plan
                    </Styled.SelectButton>
                  }
                />
              ))}
            </Styled.ProvidersList>
          )}
        </Styled.ModalBody>

        <Styled.ModalFooter>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
        </Styled.ModalFooter>
      </Styled.ModalRoot>
    </Modal>
  );
};
