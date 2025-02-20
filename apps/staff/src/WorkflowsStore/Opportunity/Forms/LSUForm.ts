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

import dedent from "dedent";
import { format as formatPhone } from "phone-fns";

import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { LSUDraftData, LSUOpportunity } from "../UsId";
import {
  defaultFormValueJoiner,
  formatFormValueDateMMDDYYYYY,
} from "../utils/formUtils";
import { FormBase, PrefilledDataTransformer } from "./FormBase";

export class LSUForm extends FormBase<LSUDraftData, LSUOpportunity> {
  navigateToFormText = "Generate Chrono";

  get formContents(): OpportunityFormComponentName {
    return "WorkflowsLSUForm";
  }

  get formType(): string {
    return "LSUForm";
  }

  prefilledDataTransformer: PrefilledDataTransformer<LSUDraftData> = () => {
    if (!this.opportunity.record) return {};

    const { formInformation: form } = this.opportunity.record;
    return {
      chargeDescriptions: `${form.chargeDescriptions?.join(",")} ${
        form.caseNumbers ? `(${form.caseNumbers?.join(", ")})` : ""
      }`,

      contactInformation: defaultFormValueJoiner(
        form.currentAddress,
        form.currentPhoneNumber
          ? formatPhone("(NNN) NNN-NNNN", form.currentPhoneNumber)
          : undefined,
        form.emailAddress,
      ),

      employmentInformation: defaultFormValueJoiner(
        form.employerName,
        form.employerAddress,
        form.employmentStartDate
          ? `Started ${formatFormValueDateMMDDYYYYY(form.employmentStartDate)}`
          : "",
        form.employmentDateVerified
          ? `Verified ${formatFormValueDateMMDDYYYYY(
              form.employmentDateVerified,
            )}`
          : "",
      ),

      assessmentInformation: dedent`
        ${form.assessmentScore ? `Score: ${form.assessmentScore}` : ""}
        ${
          form.assessmentDate
            ? `Last assessed: ${formatFormValueDateMMDDYYYYY(
                form.assessmentDate,
              )}`
            : ""
        }
      `,

      substanceTest: form.latestNegativeDrugScreenDate
        ? `Tested negative on ${formatFormValueDateMMDDYYYYY(
            form.latestNegativeDrugScreenDate,
          )}`
        : "",

      ncicCheck: defaultFormValueJoiner(
        form.ncicReviewDate
          ? `Completed on ${formatFormValueDateMMDDYYYYY(form.ncicReviewDate)}`
          : "",
        form.ncicNoteBody,
      ),

      treatmentCompletionDate: defaultFormValueJoiner(
        form.txDischargeDate
          ? `${form.txNoteTitle} on ${formatFormValueDateMMDDYYYYY(
              form.txDischargeDate,
            )}`
          : "",
        form.txNoteBody,
      ),
    };
  };
}
