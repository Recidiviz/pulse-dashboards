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
import { EmploymentHistory, VERIFIED_OPTIONS } from "./constants";
import * as Styled from "./EmploymentHistoryModal.styles";

type SelectOption = { label: string; value: string };

interface EmploymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (history: Omit<EmploymentHistory, "id">) => Promise<void>;
  initialData?: EmploymentHistory;
  isEditMode?: boolean;
}

export const EmploymentHistoryModal: React.FC<EmploymentHistoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isEditMode = false,
}) => {
  const [formData, setFormData] = useState<Omit<EmploymentHistory, "id">>({
    employerName: null,
    startDate: null,
    endDate: null,
    verifiedByReportAuthor: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize form with initial data when in edit mode
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        employerName: initialData.employerName,
        startDate: initialData.startDate,
        endDate: initialData.endDate,
        verifiedByReportAuthor: initialData.verifiedByReportAuthor,
      });
    } else if (isOpen && !initialData) {
      // Reset form for add mode
      setFormData({
        employerName: null,
        startDate: null,
        endDate: null,
        verifiedByReportAuthor: null,
      });
    }
  }, [isOpen, initialData]);

  const handleClose = () => {
    // Reset form
    setFormData({
      employerName: null,
      startDate: null,
      endDate: null,
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

  // Check if form has any data (at least employer name filled)
  const hasData =
    formData.employerName ||
    formData.startDate ||
    formData.endDate ||
    formData.verifiedByReportAuthor !== null;

  return (
    <Modal isOpen={isOpen} hideModal={handleClose} padding={0}>
      <Styled.Container>
        <Styled.Header>
          <Styled.Title>
            {isEditMode ? "Edit Employment History" : "Add Employment History"}
          </Styled.Title>
        </Styled.Header>

        <Styled.Form>
          <Styled.Field>
            <Styled.Label>Name of Employer</Styled.Label>
            <Styled.TextInput
              value={formData.employerName ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  employerName: e.target.value || null,
                })
              }
              placeholder="Enter employer name"
            />
          </Styled.Field>

          <Styled.Field>
            <Styled.Label>Verified by Report Author</Styled.Label>
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
          </Styled.Field>

          <Styled.DateRow>
            <Styled.Field>
              <Styled.Label>Start Date</Styled.Label>
              <Styled.DatePickerWrapper>
                <SharedDatePicker
                  selected={
                    formData.startDate ? new Date(formData.startDate) : null
                  }
                  onChange={(date) =>
                    setFormData({ ...formData, startDate: date ?? null })
                  }
                  placeholder="dd/mm/yyyy"
                />
              </Styled.DatePickerWrapper>
            </Styled.Field>

            <Styled.Field>
              <Styled.Label>End Date</Styled.Label>
              <Styled.DatePickerWrapper>
                <SharedDatePicker
                  selected={
                    formData.endDate ? new Date(formData.endDate) : null
                  }
                  onChange={(date) =>
                    setFormData({ ...formData, endDate: date ?? null })
                  }
                  placeholder="dd/mm/yyyy"
                />
              </Styled.DatePickerWrapper>
            </Styled.Field>
          </Styled.DateRow>
        </Styled.Form>

        <Styled.Footer>
          {saveError && <Styled.ErrorMessage>{saveError}</Styled.ErrorMessage>}
          <ButtonRow>
            <CancelButton onClick={handleClose} disabled={isSaving}>
              Cancel
            </CancelButton>
            <SaveButton onClick={handleSave} disabled={!hasData || isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </SaveButton>
          </ButtonRow>
        </Styled.Footer>
      </Styled.Container>
    </Modal>
  );
};
