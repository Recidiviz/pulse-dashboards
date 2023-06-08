import { findIndex } from "lodash";

import {
  assessmentQuestionNumbers,
  assessmentQuestions,
} from "../../../core/Paperwork/US_TN/CustodyLevelDowngrade/assessmentQuestions";
import { UsTnCustodyLevelDowngradeOpportunity } from "../UsTnCustodyLevelDowngradeOpportunity";
import { UsTnCustodyLevelDowngradeDraftData } from "../UsTnCustodyLevelDowngradeReferralRecord";
import { FormBase } from "./FormBase";

export class UsTnCustodyLevelDowngradeForm extends FormBase<
  UsTnCustodyLevelDowngradeDraftData,
  UsTnCustodyLevelDowngradeOpportunity
> {
  navigateToFormText = "Auto-fill assessment";

  get downloadText(): string {
    if (this.formIsDownloading) {
      return "Downloading PDF...";
    }

    if (this.opportunity.updates?.completed) {
      return "Re-download PDF";
    }

    return "Download PDF";
  }

  prefilledDataTransformer(): Partial<UsTnCustodyLevelDowngradeDraftData> {
    const {
      opportunity: { record },
    } = this;
    const out: Partial<UsTnCustodyLevelDowngradeDraftData> = {
      residentFullName: this.person.displayName,
      omsId: this.person.externalId,
      institutionName: this.person.facilityId,
    };
    if (record) {
      const { formInformation } = record;
      assessmentQuestionNumbers.forEach((q) => {
        // TODO: Add logic for question 1 (ambiguous by score alone)
        const score = formInformation[`q${q}Score`];
        const { canBeNone, options } = assessmentQuestions[q - 1];
        if (canBeNone && score === 0) {
          out[`q${q}Selection`] = -1;
        } else {
          const selection = findIndex(options, (o) => o.score === score);
          if (selection === -1) throw new Error("bad CAF score");
          out[`q${q}Selection`] = selection;
        }
      });
      // TODO: Notes translations for 6,7,8
    }
    return out;
  }
}
