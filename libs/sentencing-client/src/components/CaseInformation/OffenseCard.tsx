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

import { FormCharge } from "../../datastores/types";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { SAR_AUTOSAVE_DELAY } from "../SARDetails/constants";
import { EditableChargeField } from "./constants";
import { FormField } from "./FormField";
import * as Styled from "./OffenseCard.styles";

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
  charge: FormCharge;
  onUpdate: (
    chargeId: string,
    fieldId: EditableChargeField,
    value: string,
  ) => Promise<void>;
}

export const OffenseCard: React.FC<OffenseCardProps> = observer(
  function OffenseCard({ charge, onUpdate, showTitle }) {
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

    // Format judge name and division
    const judgeAndDivision =
      charge.judgeName && charge.division
        ? `${charge.judgeName} / ${charge.division}`
        : charge.judgeName || charge.division || null;

    return (
      <Styled.CardContainer>
        <Styled.Divider />
        {showTitle && <Styled.SubsectionTitle>Offenses</Styled.SubsectionTitle>}

        <Styled.Card>
          {/* Column 1: Offense Information */}
          <Styled.ColumnSection>
            <Styled.SectionHeader>Offense Information</Styled.SectionHeader>
            <ReadOnlyField label="Offense" value={charge.offense || "—"} />
            <ReadOnlyField label="Class" value={charge.felonyClass || "—"} />
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
            <FormField
              label="Prosecuting Attorney: "
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
              label="Defense Attorney: "
              value={charge.defenseAttorney}
              onChange={(value) => handleFieldChange("defenseAttorney", value)}
              type="text"
              helperText='Write "None Listed" if not applicable'
              placeholder="Add Name"
              inline
            />
            <FormField
              label="Plea Agreement: "
              value={charge.pleaAgreement}
              onChange={(value) => handleFieldChange("pleaAgreement", value)}
              type="text"
              placeholder="Add Agreement"
              inline
            />
            <FormField
              label="Date of Plea: "
              value={
                charge.pleaDate
                  ? new Date(charge.pleaDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(value) => handleFieldChange("pleaDate", value)}
              type="date"
              placeholder="Enter Date"
              inline
            />
            <FormField
              label="Date of Sentencing: "
              value={
                charge.sentencingDate
                  ? new Date(charge.sentencingDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(value) => handleFieldChange("sentencingDate", value)}
              type="date"
              placeholder="Enter Date"
              inline
            />
          </Styled.ColumnSection>
        </Styled.Card>
      </Styled.CardContainer>
    );
  },
);
