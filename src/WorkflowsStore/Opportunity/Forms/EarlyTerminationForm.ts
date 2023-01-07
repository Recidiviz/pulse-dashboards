import { deleteField } from "firebase/firestore";
import { sortBy } from "lodash";
import moment from "moment";

import { updateFormDraftData } from "../../../firestore";
import { pluralize } from "../../../utils";
import { EarlyTerminationDraftData } from "../EarlyTerminationReferralRecord";
import { FormBase } from "./FormBase";

const ADDITIONAL_DEPOSITION_LINES_PREFIX = "additionalDepositionLines";
const FORM_DATE_FORMAT = "MMMM Do, YYYY";

export class EarlyTerminationForm extends FormBase<EarlyTerminationDraftData> {
  navigateToFormText = "Auto-fill paperwork";

  prefilledDataTransformer(): Partial<EarlyTerminationDraftData> {
    if (!this.opportunity.record || !this.person) return {};

    const {
      formInformation: {
        convictionCounty,
        judicialDistrictCode,
        criminalNumber,
        judgeName,
        priorCourtDate,
        sentenceLengthYears,
        crimeNames,
        probationExpirationDate,
        probationOfficerFullName,
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
      sentenceLengthYears: pluralize(sentenceLengthYears, "year"),
      plaintiff: "State of North Dakota",
      crimeNames: crimeNames?.join(", ") ?? "",
      probationOfficerFullName,
      criminalNumber,
    };
  }

  get printText(): string {
    if (this.formIsPrinting) {
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
    updateFormDraftData(this, key, "");
  }

  removeDepositionLine(key: string): void {
    if (!this.draftData) return;
    updateFormDraftData(this, key, deleteField());
  }
}
