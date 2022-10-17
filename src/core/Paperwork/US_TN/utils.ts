// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { when } from "mobx";

import { trackSetOpportunityStatus } from "../../../analytics";
import {
  FormFieldData,
  updateCompliantReportingDraft,
} from "../../../firestore";
import { Client } from "../../../WorkflowsStore";

export function updateCompliantReportingFormFieldData(
  updatedBy: string,
  client: Client,
  fieldData: FormFieldData
): void {
  const { stateCode, recordId } = client;
  updateCompliantReportingDraft(updatedBy, stateCode, recordId, fieldData);

  when(
    () => client.opportunities.compliantReporting?.isHydrated === true,
    () => {
      if (client.opportunities.compliantReporting?.reviewStatus === "PENDING") {
        trackSetOpportunityStatus({
          clientId: client.pseudonymizedId,
          status: "IN_PROGRESS",
          opportunityType: "compliantReporting",
        });
      }
    }
  );
}
