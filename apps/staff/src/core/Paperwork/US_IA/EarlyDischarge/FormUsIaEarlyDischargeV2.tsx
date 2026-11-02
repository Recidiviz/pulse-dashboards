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

import { Opportunity } from "../../../../WorkflowsStore";
import { UsIaEarlyDischargeOpportunity } from "../../../../WorkflowsStore/Opportunity/UsIa";
import { FormContainer } from "../../FormContainer";
import { FormChargesStep } from "./FormChargesStep";
import { FormOrderStep } from "./FormOrderStep";

export function FormUsIaEarlyDischargeV2({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  if (!(opportunity instanceof UsIaEarlyDischargeOpportunity)) {
    return null;
  }

  const heading =
    opportunity.person.supervisionType === "PAROLE"
      ? "Early Discharge from Parole"
      : "Early Discharge from Probation";

  return (
    <FormContainer
      heading={heading}
      agencyName="IDOC"
      opportunity={opportunity}
      hideDownloadButton
      downloadButtonLabel=""
      onClickDownload={async () => undefined}
    >
      <FormChargesStep />
      <FormOrderStep />
    </FormContainer>
  );
}
