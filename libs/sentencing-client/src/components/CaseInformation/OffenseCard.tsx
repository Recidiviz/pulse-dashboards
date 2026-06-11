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

import { observer } from "mobx-react-lite";
import React from "react";
import { MultiValue, SingleValue } from "react-select";

import { FormCharge } from "../../datastores/types";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import {
  formatClassification,
  formatJudgeAndDivision,
} from "../../utils/utils";
import { Dropdown } from "../CaseDetails/Form/Elements/Dropdown";
import { SelectOption } from "../CaseDetails/Form/types";
import { CHARGE_FIELD_LABELS } from "../constants";
import { SAR_AUTOSAVE_DELAY } from "../SARDetails/constants";
import { EditableChargeField } from "./constants";
import { FormField } from "./FormField";
import * as FormFieldStyled from "./FormField.styles";
import * as Styled from "./OffenseCard.styles";

const PLEA_OPTIONS: SelectOption[] = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "Unknown", label: "Unknown" },
];

const ReadOnlyField: React.FC<{
  label: string;
  value?: string | number | null;
}> = ({ label, value }) => (
  <div>
    {label}: {value || "—"}
  </div>
);

interface OffenseCardProps {
  showTitle?: boolean;
  isMostSevere?: boolean;
  charge: FormCharge;
  onUpdate: (
    chargeId: string,
    fieldId: EditableChargeField,
    value: string,
  ) => Promise<void>;
  disabled?: boolean;
}

export const OffenseCard: React.FC<OffenseCardProps> = observer(
  function OffenseCard({
    charge,
    onUpdate,
    showTitle,
    isMostSevere,
    disabled,
  }) {
    // Create debounced save function
    const debouncedSave = useDebouncedCallback(
      (chargeId: string, fieldId: EditableChargeField, value: string) => {
        onUpdate(chargeId, fieldId, value);
      },
      SAR_AUTOSAVE_DELAY,
    );

    const handleFieldChange = (fieldId: EditableChargeField, value: string) => {
      // Update local state immediately for instant UI feedback
      charge[fieldId] = value;

      // Trigger debounced save
      debouncedSave(charge.id, fieldId, value);
    };

    const handlePleaChange = (
      option: MultiValue<SelectOption> | SingleValue<SelectOption> | null,
    ) => {
      if (!option || Array.isArray(option) || !("value" in option)) return;
      const value = typeof option.value === "string" ? option.value : "";
      if (value === charge.pleaAgreement) return;
      handleFieldChange("pleaAgreement", value);
    };

    const pleaOption =
      PLEA_OPTIONS.find((opt) => opt.value === charge.pleaAgreement) ?? null;

    const judgeAndDivision = formatJudgeAndDivision(charge);
    const classificationDisplay = formatClassification(charge);

    return (
      <Styled.CardContainer>
        <Styled.Divider />
        {showTitle && <Styled.SubsectionTitle>Offenses</Styled.SubsectionTitle>}

        <Styled.Card>
          {/* Column 1: Offense Information */}
          <Styled.ColumnSection>
            <Styled.SectionHeader>Offense Information</Styled.SectionHeader>
            <ReadOnlyField label="Offense" value={charge.offense || "—"} />
            <ReadOnlyField label="Class" value={classificationDisplay || "—"} />
            {isMostSevere && (
              <Styled.MostSevereOffenseBadge>
                Most Severe Offense
              </Styled.MostSevereOffenseBadge>
            )}
          </Styled.ColumnSection>

          {/* Column 2: Case Information */}
          <Styled.ColumnSection>
            <Styled.SectionHeader>Case Information</Styled.SectionHeader>

            {/* Locked fields (imported, read-only) */}
            <ReadOnlyField label="Cause Number" value={charge.causeNum} />
            <ReadOnlyField
              label="Judge/ Division Name"
              value={judgeAndDivision}
            />
            <ReadOnlyField label="County" value={charge.county} />
            <ReadOnlyField label="MoCode" value={charge.moCode} />

            {/* Editable fields (required) */}
            {disabled ? (
              <>
                <ReadOnlyField
                  label={CHARGE_FIELD_LABELS.prosecutingAttorney}
                  value={charge.prosecutingAttorney}
                />
                <ReadOnlyField
                  label={CHARGE_FIELD_LABELS.defenseAttorney}
                  value={charge.defenseAttorney}
                />
                <ReadOnlyField
                  label={CHARGE_FIELD_LABELS.pleaAgreement}
                  value={charge.pleaAgreement}
                />
                <ReadOnlyField
                  label={CHARGE_FIELD_LABELS.pleaDate}
                  value={
                    charge.pleaDate
                      ? new Date(charge.pleaDate).toLocaleDateString("en-US", {
                          timeZone: "UTC",
                        })
                      : null
                  }
                />
                <ReadOnlyField
                  label={CHARGE_FIELD_LABELS.sentencingDate}
                  value={
                    charge.sentencingDate
                      ? new Date(charge.sentencingDate).toLocaleDateString(
                          "en-US",
                          { timeZone: "UTC" },
                        )
                      : null
                  }
                />
              </>
            ) : (
              <>
                <FormField
                  label={`${CHARGE_FIELD_LABELS.prosecutingAttorney}: `}
                  value={charge.prosecutingAttorney}
                  onChange={(value) =>
                    handleFieldChange("prosecutingAttorney", value)
                  }
                  type="text"
                  helperText='Write "None Listed" if not applicable'
                  placeholder="Add Name"
                  inline
                />
                <FormField
                  label={`${CHARGE_FIELD_LABELS.defenseAttorney}: `}
                  value={charge.defenseAttorney}
                  onChange={(value) =>
                    handleFieldChange("defenseAttorney", value)
                  }
                  type="text"
                  helperText='Write "None Listed" if not applicable'
                  placeholder="Add Name"
                  inline
                />
                <FormFieldStyled.FieldContainer>
                  <FormFieldStyled.InlineRow>
                    <FormFieldStyled.Label>
                      {CHARGE_FIELD_LABELS.pleaAgreement}:{" "}
                    </FormFieldStyled.Label>
                    <Dropdown
                      value={pleaOption}
                      options={PLEA_OPTIONS}
                      onChange={handlePleaChange}
                      placeholder={
                        !pleaOption && charge.pleaAgreement
                          ? charge.pleaAgreement
                          : "Select..."
                      }
                      styles={Styled.pleaDropdownStyles}
                    />
                  </FormFieldStyled.InlineRow>
                </FormFieldStyled.FieldContainer>
                <FormField
                  label={`${CHARGE_FIELD_LABELS.pleaDate}: `}
                  value={
                    charge.pleaDate
                      ? new Date(charge.pleaDate).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(value) => handleFieldChange("pleaDate", value)}
                  type="date"
                  placeholder="Enter Date"
                  inline
                  showValidation={false}
                />
                <FormField
                  label={`${CHARGE_FIELD_LABELS.sentencingDate}: `}
                  value={
                    charge.sentencingDate
                      ? new Date(charge.sentencingDate)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(value) =>
                    handleFieldChange("sentencingDate", value)
                  }
                  type="date"
                  placeholder="Enter Date"
                  inline
                />
              </>
            )}
          </Styled.ColumnSection>
        </Styled.Card>
      </Styled.CardContainer>
    );
  },
);
