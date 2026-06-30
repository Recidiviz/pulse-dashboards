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

import { Dropdown } from "../CaseDetails/Form/Elements/Dropdown";
import { SharedDatePicker } from "../shared/SharedDatePicker";
import { Banner } from "../shared/styles/Banner";
import {
  AssessmentTypeDisplayNames,
  AssessmentTypeKey,
} from "./assessmentTypeUtils";
import * as DomainCardStyled from "./DomainCard.styles";
import {
  CancelButton,
  Checkbox,
  CheckboxContainer,
  CheckboxLabel,
  DatePickerWrapper,
  dropdownStyles,
  FieldContainer,
  Input,
  Label,
  ORASTitle,
  SaveButton,
} from "./FormComponents.styles";
import * as ModalStyled from "./ModalStyles";
import {
  DomainConfig,
  getDomainsForAssessmentType,
  ORAS_EMPTY_FORM,
  ORASFormData,
} from "./utils";

const ASSESSMENT_TYPE_OPTIONS = Object.entries(AssessmentTypeDisplayNames).map(
  ([value, label]) => ({ value, label }),
);

type SelectOption = { label: string; value: string };

interface ORASFormProps {
  onCancel: () => void;
  onSave: (data: ORASFormData) => Promise<void>;
  initialData?: ORASFormData | null;
}

export const ORASForm: React.FC<ORASFormProps> = ({
  onCancel,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState<ORASFormData>(
    initialData ?? ORAS_EMPTY_FORM,
  );
  const [isSkipped, setIsSkipped] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const domains = getDomainsForAssessmentType(formData.assessmentType);
  const scoredDomains = domains.filter((d) => d.scoreField);
  const totalScore = scoredDomains.reduce(
    (sum, d) =>
      sum + ((formData[d.scoreField as keyof ORASFormData] as number) ?? 0),
    0,
  );
  const maxTotalScore = scoredDomains.reduce(
    (sum, d) => sum + (d.maxScore ?? 0),
    0,
  );
  const allScoresFilled =
    scoredDomains.length === 0 ||
    scoredDomains.every(
      (d) => formData[d.scoreField as keyof ORASFormData] != null,
    );
  const hasAnyScore = scoredDomains.some(
    (d) => formData[d.scoreField as keyof ORASFormData] != null,
  );

  const handleCancel = () => {
    setFormData(ORAS_EMPTY_FORM);
    setSaveError(null);
    onCancel();
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave({
        ...formData,
        assessmentScore: isSkipped ? null : totalScore,
      });
      handleCancel();
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const requiredFieldsFilled =
    !!formData.assessmentAdministeredBy?.trim() &&
    !!formData.assessmentType &&
    !!formData.assessmentDate &&
    (isSkipped || allScoresFilled);

  return (
    <DomainCardStyled.CardContainer>
      <DomainCardStyled.HeaderSection>
        <ORASTitle>ORAS Assessment</ORASTitle>
      </DomainCardStyled.HeaderSection>
      <Banner>
        Manually entering assessment data will overwrite any current or future
        data synced from the ORAS system.
      </Banner>

      <DomainCardStyled.ContentArea>
        <FieldContainer>
          <Label>Select an Assessment Type</Label>
          <Dropdown
            value={
              formData.assessmentType
                ? {
                    value: formData.assessmentType,
                    label: AssessmentTypeDisplayNames[formData.assessmentType],
                  }
                : null
            }
            options={ASSESSMENT_TYPE_OPTIONS}
            onChange={(option) =>
              setFormData({
                ...ORAS_EMPTY_FORM,
                assessmentDate: formData.assessmentDate,
                assessmentAdministeredBy: formData.assessmentAdministeredBy,
                assessmentType:
                  ((option as SelectOption)?.value as AssessmentTypeKey) ??
                  null,
              })
            }
            placeholder="Select"
            styles={dropdownStyles}
          />
        </FieldContainer>

        <FieldContainer>
          <Label>Assessment Date</Label>
          <DatePickerWrapper>
            <SharedDatePicker
              selected={formData.assessmentDate ?? null}
              onChange={(date) =>
                setFormData({ ...formData, assessmentDate: date ?? null })
              }
              placeholder="--"
            />
          </DatePickerWrapper>
        </FieldContainer>

        <FieldContainer>
          <Label>Administered By</Label>
          <Input
            value={formData.assessmentAdministeredBy ?? ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                assessmentAdministeredBy: e.target.value || null,
              })
            }
          />
        </FieldContainer>

        <FieldContainer>
          <DomainCardStyled.SpacedRow>
            <Label>Domains</Label>
            {formData.assessmentType && (
              <CheckboxContainer>
                <Checkbox
                  type="checkbox"
                  id="skip-domains"
                  checked={isSkipped}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsSkipped(checked);
                    if (checked) {
                      setFormData((prev) => ({
                        ...prev,
                        ...Object.fromEntries(
                          scoredDomains.map((d) => [d.scoreField, null]),
                        ),
                      }));
                    }
                  }}
                />
                <CheckboxLabel>Skip entering scores</CheckboxLabel>
              </CheckboxContainer>
            )}
          </DomainCardStyled.SpacedRow>
          <DomainCardStyled.HelperText>
            {formData.assessmentType
              ? "Enter the numerical values for each domain"
              : "Waiting for assessment type"}
          </DomainCardStyled.HelperText>
          {domains
            .filter(
              (
                domain,
              ): domain is DomainConfig & { scoreField: keyof ORASFormData } =>
                domain.scoreField !== undefined,
            )
            .map((domain) => (
              <DomainCardStyled.SpacedRow key={domain.key}>
                <DomainCardStyled.DomainEntryTitle>
                  {domain.title}
                </DomainCardStyled.DomainEntryTitle>
                {!isSkipped && (
                  <DomainCardStyled.DomainRow>
                    <Input
                      $shrink
                      type="number"
                      value={
                        (formData[domain.scoreField] as number | null) ?? ""
                      }
                      onChange={(e) => {
                        const raw = e.target.value
                          ? Number(e.target.value)
                          : null;
                        const clamped =
                          raw !== null
                            ? Math.min(Math.max(raw, 0), domain.maxScore ?? raw)
                            : null;
                        setFormData({
                          ...formData,
                          [domain.scoreField]: clamped,
                        });
                      }}
                    />
                    <DomainCardStyled.ORASDomainText>
                      / {domain.maxScore}
                    </DomainCardStyled.ORASDomainText>
                  </DomainCardStyled.DomainRow>
                )}
              </DomainCardStyled.SpacedRow>
            ))}

          {!isSkipped && (
            <DomainCardStyled.SpacedRow>
              <DomainCardStyled.DomainEntryTitle>
                Total Score
              </DomainCardStyled.DomainEntryTitle>
              <DomainCardStyled.DomainRow $center>
                <DomainCardStyled.ORASDomainText>
                  {hasAnyScore ? `${totalScore} / ${maxTotalScore}` : "--"}
                </DomainCardStyled.ORASDomainText>
              </DomainCardStyled.DomainRow>
            </DomainCardStyled.SpacedRow>
          )}
        </FieldContainer>

        {saveError && (
          <ModalStyled.ErrorMessage>{saveError}</ModalStyled.ErrorMessage>
        )}

        <DomainCardStyled.SpacedRow>
          <CancelButton onClick={handleCancel} disabled={isSaving}>
            Cancel
          </CancelButton>
          <SaveButton
            onClick={handleSave}
            disabled={!requiredFieldsFilled || isSaving}
          >
            {isSaving ? "Saving..." : "Continue"}
          </SaveButton>
        </DomainCardStyled.SpacedRow>
      </DomainCardStyled.ContentArea>
    </DomainCardStyled.CardContainer>
  );
};
