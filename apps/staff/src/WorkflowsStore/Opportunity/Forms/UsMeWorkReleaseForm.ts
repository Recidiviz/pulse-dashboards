// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { formatFacilityHousingUnit } from "../../utils";
import { UsMeWorkReleaseOpportunity } from "../UsMe";
import { FormBase, PrefilledDataTransformer } from "./FormBase";

type UsMeWorkReleaseDraftData = {
  residentName: string;
  mdocNo: string;
  facilityHousingUnit: string;
  caseManager: string;
};

export class UsMeWorkReleaseForm extends FormBase<
  UsMeWorkReleaseDraftData,
  UsMeWorkReleaseOpportunity
> {
  navigateToFormText = "Generate paperwork";

  get formContents(): OpportunityFormComponentName {
    return "FormWorkRelease";
  }

  get formType(): string {
    return "UsMeWorkReleaseForm";
  }

  prefilledDataTransformer: PrefilledDataTransformer<UsMeWorkReleaseDraftData> =
    () => {
      if (!this.opportunity.record) return {};

      const residentName = this.person.displayName;
      const mdocNo = this.person.externalId;
      const facilityHousingUnit = formatFacilityHousingUnit(
        this.person.facilityId,
        this.person.unitId,
      );
      const caseManagerRecord =
        this.rootStore.workflowsStore.availableOfficers.find(
          (r) => r.id === this.person.assignedStaffId,
        );
      const caseManager = `${caseManagerRecord?.givenNames} ${caseManagerRecord?.surname}`;

      return {
        caseManager,
        facilityHousingUnit,
        mdocNo,
        residentName,
      };
    };
}
