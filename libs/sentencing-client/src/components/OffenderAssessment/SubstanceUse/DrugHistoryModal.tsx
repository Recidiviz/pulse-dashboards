// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import React, { useEffect, useState } from "react";

import { Dropdown } from "../../CaseDetails/Form/Elements/Dropdown";
import { Modal } from "../../Modal/Modal";
import { SharedDatePicker } from "../../shared/SharedDatePicker";
import {
  ButtonRow,
  CancelButton,
  dropdownStyles,
  SaveButton,
} from "../FormComponents.styles";
import * as ModalStyled from "../ModalStyles";
import {
  AGE_OPTIONS,
  DrugHistory,
  FREQUENCY_OPTIONS,
  FrequencyOfUse,
  FrequencyOfUseLabels,
  METHOD_OPTIONS,
  MethodOfUse,
  MethodOfUseLabels,
  SUBSTANCE_OPTIONS,
  SubstanceType,
  SubstanceTypeLabels,
} from "./constants";
import { DatePickerWrapper } from "./DrugHistoryModal.styles";

type SelectOption = { label: string; value: string };

interface DrugHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (history: DrugHistory) => Promise<void>;
  initialData?: DrugHistory;
  editIndex?: number;
  clientFirstName: string;
}

export const DrugHistoryModal: React.FC<DrugHistoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  editIndex,
  clientFirstName,
}) => {
  const [formData, setFormData] = useState<DrugHistory>({
    substance: null,
    ageOfRegularUse: null,
    lastUse: null,
    heaviestUse: null,
    method: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isEditMode = editIndex !== undefined && initialData !== undefined;

  // Initialize form with initial data when in edit mode
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(initialData);
    } else if (isOpen && !initialData) {
      // Reset form for add mode
      setFormData({
        substance: null,
        ageOfRegularUse: null,
        lastUse: null,
        heaviestUse: null,
        method: null,
      });
    }
  }, [isOpen, initialData]);

  const handleClose = () => {
    // Reset form
    setFormData({
      substance: null,
      ageOfRegularUse: null,
      lastUse: null,
      heaviestUse: null,
      method: null,
    });
    setSaveError(null);
    onClose();
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(formData);
      handleClose();
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Check if form has any data (at least one field filled)
  const hasData =
    formData.substance ||
    formData.ageOfRegularUse ||
    formData.lastUse ||
    formData.heaviestUse ||
    formData.method;

  return (
    <Modal isOpen={isOpen} hideModal={handleClose} padding={0}>
      <ModalStyled.Container>
        <ModalStyled.Header>
          <ModalStyled.Title>
            {isEditMode ? "Edit Substance Use" : "Add Substance Use"}
          </ModalStyled.Title>
          <ModalStyled.Description>
            We will use this data to generate opportunities for{" "}
            {clientFirstName}. If you don't have this information yet, you can
            add it in later.
          </ModalStyled.Description>
        </ModalStyled.Header>

        <ModalStyled.Form>
          <ModalStyled.Field>
            <ModalStyled.Label>Substance</ModalStyled.Label>
            <Dropdown
              value={
                formData.substance
                  ? {
                      value: formData.substance,
                      label: SubstanceTypeLabels[formData.substance],
                    }
                  : null
              }
              options={SUBSTANCE_OPTIONS}
              onChange={(option) =>
                setFormData({
                  ...formData,
                  substance:
                    ((option as SelectOption)?.value as SubstanceType) || null,
                })
              }
              placeholder="Select..."
              styles={dropdownStyles}
            />
          </ModalStyled.Field>

          <ModalStyled.Field>
            <ModalStyled.Label>Age of Regular Use</ModalStyled.Label>
            <Dropdown
              value={
                formData.ageOfRegularUse
                  ? {
                      value: formData.ageOfRegularUse.toString(),
                      label: formData.ageOfRegularUse.toString(),
                    }
                  : null
              }
              options={AGE_OPTIONS}
              onChange={(option) =>
                setFormData({
                  ...formData,
                  ageOfRegularUse: option
                    ? parseInt((option as SelectOption).value, 10)
                    : null,
                })
              }
              placeholder="Select..."
              styles={dropdownStyles}
            />
          </ModalStyled.Field>

          <ModalStyled.Field>
            <ModalStyled.Label>Last Use</ModalStyled.Label>
            <DatePickerWrapper>
              <SharedDatePicker
                selected={formData.lastUse ? new Date(formData.lastUse) : null}
                onChange={(date) =>
                  setFormData({ ...formData, lastUse: date ?? null })
                }
                placeholder="Select date"
              />
            </DatePickerWrapper>
          </ModalStyled.Field>

          <ModalStyled.Field>
            <ModalStyled.Label>Heaviest Use</ModalStyled.Label>
            <Dropdown
              value={
                formData.heaviestUse
                  ? {
                      value: formData.heaviestUse,
                      label: FrequencyOfUseLabels[formData.heaviestUse],
                    }
                  : null
              }
              options={FREQUENCY_OPTIONS}
              onChange={(option) =>
                setFormData({
                  ...formData,
                  heaviestUse:
                    ((option as SelectOption)?.value as FrequencyOfUse) || null,
                })
              }
              placeholder="Select..."
              styles={dropdownStyles}
            />
          </ModalStyled.Field>

          <ModalStyled.Field>
            <ModalStyled.Label>Method</ModalStyled.Label>
            <Dropdown
              value={
                formData.method
                  ? {
                      value: formData.method,
                      label: MethodOfUseLabels[formData.method],
                    }
                  : null
              }
              options={METHOD_OPTIONS}
              onChange={(option) =>
                setFormData({
                  ...formData,
                  method:
                    ((option as SelectOption)?.value as MethodOfUse) || null,
                })
              }
              placeholder="Select..."
              styles={dropdownStyles}
            />
          </ModalStyled.Field>
        </ModalStyled.Form>

        <ModalStyled.Footer>
          {saveError && (
            <ModalStyled.ErrorMessage>{saveError}</ModalStyled.ErrorMessage>
          )}
          <ButtonRow>
            <CancelButton onClick={handleClose} disabled={isSaving}>
              Cancel
            </CancelButton>
            <SaveButton onClick={handleSave} disabled={!hasData || isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </SaveButton>
          </ButtonRow>
        </ModalStyled.Footer>
      </ModalStyled.Container>
    </Modal>
  );
};
