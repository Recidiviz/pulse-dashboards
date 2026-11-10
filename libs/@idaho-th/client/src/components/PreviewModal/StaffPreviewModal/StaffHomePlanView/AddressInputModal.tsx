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

import { HOME_PLAN_ADDRESS_MAX_LENGTH } from "~@idaho-th/shared";

import {
  AUTOCOMPLETE_MIN_CHARS,
  useAutocompleteAddresses,
} from "../../../../hooks/places";
import { useDebouncedValue } from "../../../../hooks/useDebounce";
import { Heading5, palette } from "../../../../styles";
import XIcon from "../../../assets/x.svg?react";
import { ActionButton } from "../../../common/buttons";
import { Checkbox } from "../../../common/inputs";
import { Modal } from "../../../Modal/Modal";
import * as Styled from "./AddressInputModal.styles";
import { computeGhostSuffix } from "./AddressInputModal.utils";

const ADDRESS_ERROR_ID = "address-length-error";

interface AddressInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: string) => void;
  isSaving?: boolean;
}

export const AddressInputModal: React.FC<AddressInputModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}) => {
  const [address, setAddress] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isOptionChecked, setIsOptionChecked] = useState(false);

  const trimmedAddress = address.trim();
  const hasValue = trimmedAddress.length > 0;
  const isTooLong = trimmedAddress.length > HOME_PLAN_ADDRESS_MAX_LENGTH;
  const debouncedInput = useDebouncedValue(trimmedAddress, 300);
  const { data } = useAutocompleteAddresses(debouncedInput, isFocused);

  const firstPrediction = data?.predictions[0]?.description ?? "";

  // Only show the ghost once typing has settled (predictions match the current
  // text) and the field is focused, so we never render a stale completion.
  const hasDebounceSettled = debouncedInput === trimmedAddress;
  const ghostSuffix =
    isFocused &&
    hasDebounceSettled &&
    trimmedAddress.length >= AUTOCOMPLETE_MIN_CHARS
      ? computeGhostSuffix(trimmedAddress, firstPrediction)
      : "";

  // Suppress the ghost entirely when address has leading/trailing whitespace:
  // the mirror text length won't align with the caret, and a trailing space
  // before a comma-prefixed suffix (e.g. ", Boise, ID") produces "St , Boise".
  const displaySuffix = address === trimmedAddress ? ghostSuffix : "";

  const handleSave = () => {
    if (!hasValue || isTooLong) return;
    onSave(trimmedAddress);
  };

  const handleClose = () => {
    setAddress("");
    setIsOptionChecked(false);
    onClose();
  };

  const handleAddressChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setAddress(event.target.value);
  };

  const acceptSuggestion = () => {
    if (!displaySuffix || !firstPrediction) return;
    setAddress(firstPrediction.slice(0, HOME_PLAN_ADDRESS_MAX_LENGTH));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Only hijack Tab while a completion is showing; otherwise it moves focus.
    if (event.key === "Tab" && displaySuffix) {
      event.preventDefault();
      acceptSuggestion();
    }
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
            <Heading5 $color={palette.foreground.primary}>Add address</Heading5>
          </Styled.HeaderTextGroup>

          <Styled.CloseButton
            type="button"
            aria-label="Close modal"
            onClick={handleClose}
          >
            <XIcon />
          </Styled.CloseButton>
        </Styled.ModalHeader>

        <Styled.ModalBody>
          <Styled.AddressField>
            <Styled.AddressFieldWrapper
              $hasValue={hasValue}
              $hasError={isTooLong}
            >
              {displaySuffix && (
                <Styled.GhostMirror aria-hidden>
                  {address}
                  <Styled.GhostSuffix>{displaySuffix}</Styled.GhostSuffix>
                </Styled.GhostMirror>
              )}
              <Styled.AddressTextarea
                value={address}
                onChange={handleAddressChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="For example: 123 Main St, Apt 4B, Springfield, IL 62704"
                aria-invalid={isTooLong}
                aria-describedby={isTooLong ? ADDRESS_ERROR_ID : undefined}
                $hasValue={hasValue}
              />
            </Styled.AddressFieldWrapper>

            {isTooLong && (
              <Styled.AddressErrorText id={ADDRESS_ERROR_ID} role="alert">
                Address must be {HOME_PLAN_ADDRESS_MAX_LENGTH} characters or
                fewer.
              </Styled.AddressErrorText>
            )}
          </Styled.AddressField>

          <Styled.AddressOptionRow>
            <Checkbox
              checked={isOptionChecked}
              onChange={(event) => setIsOptionChecked(event.target.checked)}
            />
            <Styled.AddressOptionText>
              I understand that adding this address as the home plan will mark
              the case as complete and can't be undone.
            </Styled.AddressOptionText>
          </Styled.AddressOptionRow>
        </Styled.ModalBody>

        <Styled.ModalFooter>
          <Styled.FooterSpacer aria-hidden />
          <ActionButton variant="secondary" onClick={handleClose}>
            Cancel
          </ActionButton>
          <ActionButton
            disabled={!hasValue || isTooLong || isSaving || !isOptionChecked}
            isLoading={isSaving}
            onClick={handleSave}
          >
            Add Address &amp; Mark as Complete
          </ActionButton>
        </Styled.ModalFooter>
      </Styled.ModalRoot>
    </Modal>
  );
};
