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
import { UsMeMediumTrusteeOpportunity } from "../UsMe/UsMeMediumTrusteeOpportunity";
import { FormBase } from "./FormBase";

export type UsMeMediumTrusteeFormData = {
  displayName: string;
  externalId: string;
  facilityId: string;
};

export class UsMeMediumTrusteeForm extends FormBase<
  UsMeMediumTrusteeFormData,
  UsMeMediumTrusteeOpportunity
> {
  navigateToFormText = "Generate paperwork";

  get formContents(): OpportunityFormComponentName {
    return "MediumTrustee";
  }

  get formType(): string {
    return "UsMeAnnualReclassificationReviewForm";
  }

  prefilledDataTransformer(): Partial<UsMeMediumTrusteeFormData> {
    if (!this.opportunity.record) return {};

    const { displayName, facilityId, externalId } = this.person;

    return {
      displayName,
      externalId,
      facilityId,
    };
  }
}
