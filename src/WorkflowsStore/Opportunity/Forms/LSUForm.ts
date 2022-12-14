import dedent from "dedent";
import { format as formatPhone } from "phone-fns";

import { LSUDraftData } from "../LSUReferralRecord";
import { defaultFormValueJoiner, formatFormValueDateMMDDYYYYY } from "../utils";
import { FormBase, PrefilledDataTransformer } from "./FormBase";

export class LSUForm extends FormBase<LSUDraftData> {
  navigateToFormText = "Generate Chrono";

  prefilledDataTransformer: PrefilledDataTransformer<LSUDraftData> = () => {
    if (!this.opportunity.record) return {};

    const { formInformation: form } = this.opportunity.record;
    return {
      chargeDescriptions: form.chargeDescriptions?.join(",") ?? "",
      contactInformation: defaultFormValueJoiner(
        form.currentAddress,
        form.currentPhoneNumber
          ? formatPhone("(NNN) NNN-NNNN", form.currentPhoneNumber)
          : undefined,
        form.emailAddress
      ),

      employmentInformation: defaultFormValueJoiner(
        form.employerName,
        form.employerAddress,
        form.employmentStartDate
          ? `Started ${formatFormValueDateMMDDYYYYY(form.employmentStartDate)}`
          : "",
        form.employmentDateVerified
          ? `Verified ${formatFormValueDateMMDDYYYYY(
              form.employmentDateVerified
            )}`
          : ""
      ),

      assessmentInformation: dedent`
        ${form.assessmentScore ? `Score: ${form.assessmentScore}` : ""}
        ${
          form.assessmentDate
            ? `Last assessed: ${formatFormValueDateMMDDYYYYY(
                form.assessmentDate
              )}`
            : ""
        }
      `,

      substanceTest: form.latestNegativeDrugScreenDate
        ? `Tested negative on ${formatFormValueDateMMDDYYYYY(
            form.latestNegativeDrugScreenDate
          )}`
        : "",

      ncicCheck: defaultFormValueJoiner(
        form.ncicReviewDate
          ? `Completed on ${formatFormValueDateMMDDYYYYY(form.ncicReviewDate)}`
          : "",
        form.ncicNoteBody
      ),

      treatmentCompletionDate: defaultFormValueJoiner(
        form.txDischargeDate
          ? `${form.txNoteTitle} on ${formatFormValueDateMMDDYYYYY(
              form.txDischargeDate
            )}`
          : "",
        form.txNoteBody
      ),
    };
  };
}
