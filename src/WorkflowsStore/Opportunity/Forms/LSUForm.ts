import dedent from "dedent";
import moment from "moment";
import { format as formatPhone } from "phone-fns";

import { LSUDraftData } from "../LSUReferralRecord";
import { FormBase, PrefilledDataTransformer } from "./FormBase";

const defaultFormValueJoiner = (...items: (string | undefined)[]) =>
  items.filter((item) => item).join("\n");

const formatFormValueDate = (date: string) => moment(date).format("MM/DD/YYYY");

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
          ? `Started ${formatFormValueDate(form.employmentStartDate)}`
          : "",
        form.employmentDateVerified
          ? `Verified ${formatFormValueDate(form.employmentDateVerified)}`
          : ""
      ),

      assessmentInformation: dedent`
        ${form.assessmentScore ? `Score: ${form.assessmentScore}` : ""}
        ${
          form.assessmentDate
            ? `Last assessed: ${formatFormValueDate(form.assessmentDate)}`
            : ""
        }
      `,

      substanceTest: form.latestNegativeDrugScreenDate
        ? `Tested negative on ${formatFormValueDate(
            form.latestNegativeDrugScreenDate
          )}`
        : "",

      ncicCheck: defaultFormValueJoiner(
        form.ncicReviewDate
          ? `Completed on ${formatFormValueDate(form.ncicReviewDate)}`
          : "",
        form.ncicNoteBody
      ),

      treatmentCompletionDate: defaultFormValueJoiner(
        form.txDischargeDate
          ? `${form.txNoteTitle} on ${formatFormValueDate(
              form.txDischargeDate
            )}`
          : "",
        form.txNoteBody
      ),
    };
  };
}
