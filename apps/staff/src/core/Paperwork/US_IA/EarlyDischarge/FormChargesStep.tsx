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

import { spacing } from "@recidiviz/design-system";
import { difference } from "lodash";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { UsIaEarlyDischargeCharge } from "~datatypes";
import { Checkbox, CheckboxGroup, palette, typography } from "~design-system";
import { pluralize } from "~utils";

import { UsIaEarlyDischargeForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsIaEarlyDischargeForm";
import { hideWhenPrintingStyle } from "../../../sharedComponents";
import { SecureSmallDetailsCopy } from "../../../WorkflowsJusticeInvolvedPersonProfile/styles";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { ErrorMessage } from "./ErrorMessage";
import { FormChargeRow } from "./FormChargeRow";
import {
  SelectedCount,
  StepCard,
  StepHeader,
  StepHelpText,
  StepLabel,
  StepTitle,
} from "./styles";
import { jurisdictionSlug } from "./utils";

const JurisdictionLabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${rem(spacing.md)};
  padding-bottom: ${rem(spacing.sm)};
  border-bottom: 1px solid ${palette.slate10};
`;

const JurisdictionLabel = styled(SecureSmallDetailsCopy)`
  color: ${palette.slate60};
`;

const JurisdictionSelectAll = styled(Checkbox)`
  ${typography.Sans12}
  color: ${palette.slate60};
  margin-left: auto;

  /* Bootstrap's reboot gives every label a bottom margin, which pushes the
     text above the box. */
  .ds-checkbox__label {
    margin-bottom: 0;
  }
`;

const StepErrorMessage = styled(ErrorMessage)`
  margin-bottom: ${rem(spacing.md)};
`;

const ChargeGroup = styled(CheckboxGroup)`
  gap: 0;
  padding: 0;
  margin-top: ${rem(spacing.lg)};
`;

// The court gets the report from Step 2; choosing charges stays on screen.
const ChargesStepCard = styled(StepCard)`
  ${hideWhenPrintingStyle}
`;

type JurisdictionChargesProps = {
  jurisdiction: string;
  charges: UsIaEarlyDischargeCharge[];
  showLabel: boolean;
};

const JurisdictionCharges = observer(function JurisdictionCharges({
  jurisdiction,
  charges,
  showLabel,
}: JurisdictionChargesProps) {
  const form = useOpportunityFormContext() as UsIaEarlyDischargeForm;

  const chargeIds = charges.map((charge) => charge.chargeExternalId);
  const selectedIds = chargeIds.filter((id) => form.isChargeSelected(id));

  const handleChange = (nextSelectedIds: string[]) => {
    const newlySelected = difference(nextSelectedIds, selectedIds);
    const newlyDeselected = difference(selectedIds, nextSelectedIds);
    if (newlySelected.length > 0) {
      form.setChargesSelected(newlySelected, true);
    }
    if (newlyDeselected.length > 0) {
      form.setChargesSelected(newlyDeselected, false);
    }
  };

  const showSelectAll = charges.length > 1;
  const allSelected = selectedIds.length === charges.length;
  const partlySelected = !allSelected && selectedIds.length > 0;

  const handleSelectAll = () => {
    const changedIds = chargeIds.filter(
      (id) => selectedIds.includes(id) === allSelected,
    );
    form.setChargesSelected(changedIds, !allSelected);
  };

  const labelId = `us-ia-ed-charges-${jurisdictionSlug(jurisdiction)}-label`;

  return (
    <ChargeGroup
      value={selectedIds}
      onChange={handleChange}
      ariaLabelledBy={showLabel ? labelId : undefined}
      ariaLabel={showLabel ? undefined : `${jurisdiction} charges`}
    >
      {(showLabel || showSelectAll) && (
        <JurisdictionLabelRow>
          {showLabel && (
            <JurisdictionLabel id={labelId}>
              {jurisdiction} · {pluralize(charges.length, "charge")}
            </JurisdictionLabel>
          )}
          {showSelectAll && (
            <JurisdictionSelectAll
              value={`selectAll-${jurisdiction}`}
              checked={allSelected}
              indeterminate={partlySelected}
              onChange={handleSelectAll}
            >
              Select all
            </JurisdictionSelectAll>
          )}
        </JurisdictionLabelRow>
      )}
      {charges.map((charge) => (
        <FormChargeRow key={charge.chargeExternalId} charge={charge} />
      ))}
    </ChargeGroup>
  );
});

export const FormChargesStep = observer(function FormChargesStep({
  emptySelectionAction,
}: {
  /** The last action the PO tried while no charge was selected. */
  emptySelectionAction?: "submit" | "print";
}) {
  const form = useOpportunityFormContext() as UsIaEarlyDischargeForm;
  const { chargesByJurisdiction } = form.opportunity;
  const showJurisdictionLabels = chargesByJurisdiction.size > 1;

  return (
    <ChargesStepCard aria-labelledby="us-ia-ed-charges-step-title">
      <StepHeader>
        <div>
          <StepLabel>Step 1</StepLabel>
          <StepTitle id="us-ia-ed-charges-step-title">Select charges</StepTitle>
        </div>
        <SelectedCount role="status">
          {form.selectedChargeCount} selected
        </SelectedCount>
      </StepHeader>
      <StepHelpText>
        Charges under different jurisdictions become separate ICON discharge
        orders.
      </StepHelpText>
      {emptySelectionAction && form.selectedChargeCount === 0 && (
        <StepErrorMessage>
          Select at least one charge to {emptySelectionAction}.
        </StepErrorMessage>
      )}
      {[...chargesByJurisdiction].map(([jurisdiction, charges]) => (
        <JurisdictionCharges
          key={jurisdiction}
          jurisdiction={jurisdiction}
          charges={charges}
          showLabel={showJurisdictionLabels}
        />
      ))}
    </ChargesStepCard>
  );
});
