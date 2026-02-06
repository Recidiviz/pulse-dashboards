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

import React, { useEffect, useState } from "react";

import { Dropdown } from "../../CaseDetails/Form/Elements/Dropdown";
import { Modal } from "../../Modal/Modal";
import { SelectOption, VERIFIED_OPTIONS } from "../constants";
import {
  ButtonRow,
  CancelButton,
  dropdownStyles,
  SaveButton,
} from "../FormComponents.styles";
import * as ModalStyled from "../ModalStyles";
import { getYearOptions } from "./constants";
import { PriorTreatmentHistory } from "./types";

// Memoize year options to avoid regenerating on every render
const YEAR_OPTIONS = getYearOptions();

interface PriorTreatmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (history: Omit<PriorTreatmentHistory, "id">) => Promise<void>;
  initialData?: PriorTreatmentHistory;
  isEditMode?: boolean;
}

export const PriorTreatmentHistoryModal: React.FC<
  PriorTreatmentHistoryModalProps
> = ({ isOpen, onClose, onSave, initialData, isEditMode }) => {
  const [formData, setFormData] = useState<Omit<PriorTreatmentHistory, "id">>({
    yearCompleted: null,
    programName: null,
    verifiedByReportAuthor: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize form with initial data when in edit mode
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(initialData);
    } else if (isOpen && !initialData) {
      // Reset form for add mode
      setFormData({
        yearCompleted: null,
        programName: null,
        verifiedByReportAuthor: null,
      });
    }
  }, [isOpen, initialData]);

  const handleClose = () => {
    // Reset form
    setFormData({
      yearCompleted: null,
      programName: null,
      verifiedByReportAuthor: null,
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
    formData.yearCompleted !== null ||
    !!formData.programName ||
    formData.verifiedByReportAuthor !== null;

  return (
    <Modal isOpen={isOpen} hideModal={handleClose} padding={0}>
      <ModalStyled.Container>
        <ModalStyled.Header>
          <ModalStyled.Title>
            {isEditMode
              ? "Edit Prior Treatment History"
              : "Add Prior Treatment History"}
          </ModalStyled.Title>
        </ModalStyled.Header>

        <ModalStyled.Form>
          <ModalStyled.Field>
            <ModalStyled.Label>Year Completed</ModalStyled.Label>
            <Dropdown
              value={
                formData.yearCompleted
                  ? {
                      value: formData.yearCompleted.toString(),
                      label: formData.yearCompleted.toString(),
                    }
                  : null
              }
              options={YEAR_OPTIONS}
              onChange={(option) =>
                setFormData({
                  ...formData,
                  yearCompleted: option
                    ? parseInt((option as SelectOption).value, 10)
                    : null,
                })
              }
              placeholder="Select..."
              styles={dropdownStyles}
            />
          </ModalStyled.Field>

          <ModalStyled.Field>
            <ModalStyled.Label>Program Name</ModalStyled.Label>
            <ModalStyled.TextInput
              value={formData.programName ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  programName: e.target.value || null,
                })
              }
              placeholder="Enter program name"
            />
          </ModalStyled.Field>

          <ModalStyled.Field>
            <ModalStyled.Label>Verified</ModalStyled.Label>
            <Dropdown
              value={
                formData.verifiedByReportAuthor !== null
                  ? {
                      value: formData.verifiedByReportAuthor.toString(),
                      label: formData.verifiedByReportAuthor ? "Yes" : "No",
                    }
                  : null
              }
              options={VERIFIED_OPTIONS}
              onChange={(option) =>
                setFormData({
                  ...formData,
                  verifiedByReportAuthor: option
                    ? (option as SelectOption).value === "true"
                    : null,
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
