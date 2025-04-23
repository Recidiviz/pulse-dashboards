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
import { formatWorkflowsDate } from "../../../utils";
import { UsPaAdminSupervisionOpportunity } from "../UsPa/UsPaAdminSupervisionOpportunity/UsPaAdminSupervisionOpportunity";
import { UsPaAdminSupervisionDraftData } from "../UsPa/UsPaAdminSupervisionOpportunity/UsPaAdminSupervisionReferralRecord";
import { FormBase } from "./FormBase";

export class UsPaAdminSupervisionForm extends FormBase<
  UsPaAdminSupervisionDraftData,
  UsPaAdminSupervisionOpportunity
> {
  navigateToFormText = "Complete checklist";

  get formContents(): OpportunityFormComponentName {
    return "FormUsPaAdminSupervision";
  }

  get formType(): string {
    return "UsPaAdminSupervisionForm";
  }

  prefilledDataTransformer(): Partial<UsPaAdminSupervisionDraftData> {
    if (!this.opportunity.record || !this.person) return {};

    const {
      fullName: { givenNames, surname },
      externalId: paroleNumber,
      supervisionLevel: currentGradeOfSupervisionLevel,
    } = this.person;

    const {
      eligibleCriteria,
      formInformation: {
        drugConviction: guiltyPADrugCharge,
        statute14: charge780_11314,
        statute30: charge780_11330,
        statute37: charge780_11337,
        drugUnreportedDisposition: noDispositionPADrugCharge,
      },
    } = this.opportunity.record;

    const reentrantName = `${surname}, ${givenNames}`;

    const dateOfReview = formatWorkflowsDate(new Date());

    const criteriaHighSanction = !(
      "usPaNoHighSanctionsInPastYear" in eligibleCriteria
    );

    return {
      criteriaHighSanction,
      reentrantName,
      paroleNumber,
      currentGradeOfSupervisionLevel,
      dateOfReview,
      guiltyPADrugCharge,
      charge780_11314,
      charge780_11330,
      charge780_11337,
      unreportedPersonalInjuryDispositions: false,
      noDispositionPADrugCharge,
    };
  }
}
