import { deleteField } from "firebase/firestore";
import { sortBy } from "lodash";
import moment from "moment";

import WorkflowsEarlyTerminationDeferredForm from "../../../core/WorkflowsEarlyTerminationDeferredForm/WorkflowsEarlyTerminationDeferredForm";
import WorkflowsEarlyTerminationForm from "../../../core/WorkflowsEarlyTerminationForm/WorkflowsEarlyTerminationForm";
import { pluralize } from "../../../utils";
import { UNKNOWN } from "../../Client";
import {
  UsNdEarlyTerminationDraftData,
  UsNdEarlyTerminationOpportunity,
} from "../UsNd";
import { FormBase } from "./FormBase";

const ADDITIONAL_DEPOSITION_LINES_PREFIX = "additionalDepositionLines";
const FORM_DATE_FORMAT = "MMMM Do, YYYY";

export class EarlyTerminationForm extends FormBase<
  UsNdEarlyTerminationDraftData,
  UsNdEarlyTerminationOpportunity
> {
  navigateToFormText = "Auto-fill paperwork";

  get formContents() {
    if (this.opportunity.formVariant === "deferred") {
      return WorkflowsEarlyTerminationDeferredForm;
    }
    return WorkflowsEarlyTerminationForm;
  }

  prefilledDataTransformer(): Partial<UsNdEarlyTerminationDraftData> {
    if (!this.opportunity.record || !this.person) return {};

    const {
      formInformation: {
        convictionCounty,
        judicialDistrictCode,
        criminalNumber,
        judgeName,
        priorCourtDate,
        sentenceLengthMonths,
        crimeNames,
        probationExpirationDate,
        probationOfficerFullName,
        statesAttorneyPhoneNumber,
        statesAttorneyEmailAddress,
        statesAttorneyMailingAddress,
      },
    } = this.opportunity.record;

    return {
      clientName: this.person.displayName,
      judgeName,
      convictionCounty: convictionCounty?.replaceAll("_", " ") ?? "",
      judicialDistrictCode: judicialDistrictCode?.replaceAll("_", " ") ?? "",
      priorCourtDate: moment(priorCourtDate).format(FORM_DATE_FORMAT),
      probationExpirationDate: moment(probationExpirationDate).format(
        FORM_DATE_FORMAT
      ),
      sentenceLengthMonths: sentenceLengthMonths
        ? pluralize(sentenceLengthMonths, "month")
        : UNKNOWN,
      plaintiff: "State of North Dakota",
      crimeNames: crimeNames?.join(", ") ?? "",
      probationOfficerFullName,
      criminalNumber,
      statesAttorneyPhoneNumber,
      statesAttorneyEmailAddress,
      statesAttorneyMailingAddress,
      priorCourtDay: moment(priorCourtDate).format("Do"),
      priorCourtMonth: moment(priorCourtDate).format("MMMM"),
      priorCourtYear: moment(priorCourtDate).format("YYYY"),
    };
  }

  get downloadText(): string {
    if (this.formIsDownloading) {
      return "Downloading .DOCX...";
    }

    if (this.opportunity?.updates?.completed) {
      return "Re-download .DOCX";
    }

    return "Download .DOCX";
  }

  get additionalDepositionLines(): string[] {
    const additionalDepositionLines = Object.keys(this.draftData).filter(
      (key: string) => key.startsWith(ADDITIONAL_DEPOSITION_LINES_PREFIX)
    );

    return sortBy(additionalDepositionLines, (key) =>
      Number(key.split(ADDITIONAL_DEPOSITION_LINES_PREFIX)[1])
    );
  }

  addDepositionLine(): void {
    const key = `${ADDITIONAL_DEPOSITION_LINES_PREFIX}${+new Date()}`;
    this.rootStore.firestoreStore.updateFormDraftData(this, key, "");
  }

  removeDepositionLine(key: string): void {
    this.rootStore.firestoreStore.updateFormDraftData(this, key, deleteField());
  }
}
