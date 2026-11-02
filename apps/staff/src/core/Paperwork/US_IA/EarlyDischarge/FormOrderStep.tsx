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

import { formatNameFirstLast, formatWorkflowsDate } from "../../../../utils";
import { UsIaEarlyDischargeForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsIaEarlyDischargeForm";
import { WorkflowsBadgePill } from "../../../BadgePill/BadgePill";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { FormCountyBlock } from "./FormCountyBlock";
import {
  FieldLabel,
  FieldRow,
  FieldValue,
  SectionHeader,
  SectionLabel,
  StepCard,
  StepLabel,
  StepTitle,
} from "./styles";

// TODO(IA-385): render every county, not just the first.
const MAX_COUNTY_BLOCKS = 1;

export const FormOrderStep = observer(function FormOrderStep() {
  const { opportunity } = useOpportunityFormContext() as UsIaEarlyDischargeForm;
  const { person, chargesByJurisdiction } = opportunity;

  const headerFields = [
    { label: "Date", value: formatWorkflowsDate(new Date()) },
    { label: "DOC ID", value: person.displayId },
    { label: "Name", value: formatNameFirstLast(person.fullName) },
  ];

  return (
    <StepCard aria-labelledby="us-ia-ed-order-step-title">
      <StepLabel>Step 2</StepLabel>
      <StepTitle id="us-ia-ed-order-step-title">
        Discharge Order Report
      </StepTitle>
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
      {[...chargesByJurisdiction]
        .slice(0, MAX_COUNTY_BLOCKS)
        .map(([jurisdiction, charges]) => (
          <FormCountyBlock
            key={jurisdiction}
            jurisdiction={jurisdiction}
            charges={charges}
          />
        ))}
    </StepCard>
  );
});
