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

import { observer } from "mobx-react-lite";

import { pluralize } from "~utils";

import { formatNameFirstLast, formatWorkflowsDate } from "../../../../utils";
import { UsIaEarlyDischargeForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsIaEarlyDischargeForm";
import { WorkflowsBadgePill } from "../../../BadgePill/BadgePill";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { FormJurisdictionBlock } from "./FormJurisdictionBlock";
import {
  FieldLabel,
  FieldRow,
  FieldValue,
  SectionHeader,
  SectionLabel,
  SelectedCount,
  StepCard,
  StepHeader,
  StepHelpText,
  StepLabel,
  StepTitle,
} from "./styles";

export const FormOrderStep = observer(function FormOrderStep() {
  const form = useOpportunityFormContext() as UsIaEarlyDischargeForm;
  const { person, chargesByJurisdiction } = form.opportunity;
  const { selectedChargesByJurisdiction } = form;

  const headerFields = [
    { label: "Date", value: formatWorkflowsDate(new Date()) },
    { label: "DOC ID", value: person.displayId },
    { label: "Name", value: formatNameFirstLast(person.fullName) },
  ];

  return (
    <StepCard aria-labelledby="us-ia-ed-order-step-title">
      <StepHeader>
        <div>
          <StepLabel>Step 2</StepLabel>
          <StepTitle id="us-ia-ed-order-step-title">
            Discharge Order Report
          </StepTitle>
        </div>
        <SelectedCount>
          {pluralize(form.selectedChargeCount, "charge")} selected /{" "}
          {pluralize(selectedChargesByJurisdiction.size, "form")}
        </SelectedCount>
      </StepHeader>
      {selectedChargesByJurisdiction.size === 0 ? (
        <StepHelpText>
          {chargesByJurisdiction.size === 0
            ? "No eligible charges for this client."
            : "No charges selected — select charges above to generate the report."}
        </StepHelpText>
      ) : (
        <>
          <SectionHeader>
            <SectionLabel>Shared header</SectionLabel>
            <WorkflowsBadgePill text="Auto-filled" palette="GREEN" />
          </SectionHeader>
          {headerFields.map(({ label, value }) => (
            <FieldRow key={label}>
              <FieldLabel>{label}</FieldLabel>
              <FieldValue>{value}</FieldValue>
            </FieldRow>
          ))}
          {[...selectedChargesByJurisdiction].map(([jurisdiction, charges]) => (
            <FormJurisdictionBlock
              key={jurisdiction}
              jurisdiction={jurisdiction}
              charges={charges}
            />
          ))}
        </>
      )}
    </StepCard>
  );
});
