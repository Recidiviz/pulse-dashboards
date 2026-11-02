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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { palette } from "~design-system";
import { pluralize } from "~utils";

import { UsIaEarlyDischargeForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsIaEarlyDischargeForm";
import {
  DetailsBox,
  SecureDetailsContent,
  SecureSmallDetailsCopy,
} from "../../../WorkflowsJusticeInvolvedPersonProfile/styles";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { StepCard, StepHelpText, StepLabel, StepTitle } from "./styles";
import { chargeMetaLine } from "./utils";

const JurisdictionGroup = styled.div`
  margin-top: ${rem(spacing.lg)};
`;

const SecondaryCopy = styled(SecureSmallDetailsCopy)`
  color: ${palette.slate60};
`;

const JurisdictionLabel = styled(SecondaryCopy)`
  margin-bottom: ${rem(spacing.sm)};
`;

const ChargeRow = styled(DetailsBox)`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${rem(spacing.md)};
`;

const ChargeMeta = styled(SecondaryCopy)`
  flex: none;
`;

export const FormChargesStep = observer(function FormChargesStep() {
  const { opportunity } = useOpportunityFormContext() as UsIaEarlyDischargeForm;
  const { chargesByJurisdiction } = opportunity;
  const showJurisdictionLabels = chargesByJurisdiction.size > 1;

  return (
    <StepCard aria-labelledby="us-ia-ed-charges-step-title">
      <StepLabel>Step 1</StepLabel>
      <StepTitle id="us-ia-ed-charges-step-title">Select charges</StepTitle>
      <StepHelpText>
        Charges under different counties become separate ICON discharge orders.
      </StepHelpText>
      {[...chargesByJurisdiction].map(([jurisdiction, charges]) => (
        <JurisdictionGroup key={jurisdiction}>
          {showJurisdictionLabels && (
            <JurisdictionLabel>
              {jurisdiction} · {pluralize(charges.length, "charge")}
            </JurisdictionLabel>
          )}
          {charges.map((charge) => (
            <ChargeRow key={charge.chargeExternalId}>
              <SecureDetailsContent as="div">
                {charge.description}
              </SecureDetailsContent>
              <ChargeMeta>{chargeMetaLine(charge)}</ChargeMeta>
            </ChargeRow>
          ))}
        </JurisdictionGroup>
      ))}
    </StepCard>
  );
});
