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

import { UsMiReviewClassification2026DraftData } from "~datatypes";

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { FormBase } from "./FormBase";
import { calculateRemaining } from "./UsMiInitialClassification2026Form";

const ReviewKeySelections = [
  "s1q1Selection",
  "s1q2Selection",

  "s2q3Selection",
  "s2q4Selection",
  "s2q5Selection",
  "s2q6Selection",
  "s2q7Selection",
  "s2q8Selection",
  "s2q9Selection",
  "s2q10Selection",
  "s2q11Selection",
  "s2q12Selection",
  "s2q13Selection",

  "s3q14Selection",
  "s3q15Selection",
  "s3q16Selection",
  "s3q17Selection",
] as const;
export class UsMiReviewClassificationForm extends FormBase<UsMiReviewClassification2026DraftData> {
  get navigateToFormText(): string {
    return this.opportunity.isSubmitted
      ? "Review classification"
      : "Auto-fill classification";
  }

  get formContents(): OpportunityFormComponentName {
    return "FormUsMiClassification";
  }

  get formTitle() {
    return "Review Classification";
  }

  get remainingFields() {
    return calculateRemaining(this.formData, ReviewKeySelections);
  }
}
