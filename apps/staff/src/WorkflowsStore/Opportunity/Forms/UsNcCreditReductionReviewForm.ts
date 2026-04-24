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

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { formatWorkflowsDate } from "../../../utils";
import { UsNcCreditReductionReviewOpportunity } from "../UsNc/UsNcCreditReductionReviewOpportunity";
import { FormBase } from "./FormBase";

export type UsNcCreditReductionReviewDraftData = {
  // Data-populated fields
  offenderName: string;
  OPUS: string;
  supStart: string;
  supEnd: string;

  // Conditions
  condition1: boolean;
  comment1: string;
  start1: string;
  condition2: boolean;
  comment2: string;
  start2: string;
  condition3: boolean;
  comment3: string;
  start3: string;
  condition4: boolean;
  comment4: string;
  start4: string;
  condition5: boolean;
  comment5: string;
  start5: string;
  comment6: string;
  yn1: boolean;
  no1: boolean;
  violations: string;
  yn2: boolean;
  no2: boolean;
  yn3: boolean;
  no3: boolean;
  np: boolean;
  neg: boolean;
  comment7: string;

  // Client history fields
  supLevel: string;
  yn4: boolean;
  no4: boolean;
  restitution: string;
  arrears: string;

  // Signature fields
  ppoName: string;
  ppoSignature: string;
  ppoSignDate: string;
  cppoName: string;
  cppoSignature: string;
  cppoSignDate: string;
};
export class UsNcCreditReductionReviewForm extends FormBase<
  any,
  UsNcCreditReductionReviewOpportunity
> {
  navigateToFormText = "Go to Form DCS-183";

  get formContents(): OpportunityFormComponentName {
    return "FormUsNcCreditReductionReview";
  }

  get formType(): string {
    return "UsNcCreditReductionReviewForm";
  }

  prefilledDataTransformer(): Partial<UsNcCreditReductionReviewDraftData> {
    const {
      externalId: OPUS,
      displayName: offenderName,
      supervisionStartDate,
      expirationDate,
      supervisionLevel: supLevel,
    } = this.person;
    return {
      OPUS,
      offenderName,
      supStart: formatWorkflowsDate(supervisionStartDate),
      supEnd: formatWorkflowsDate(expirationDate),
      supLevel,
    };
  }
}
