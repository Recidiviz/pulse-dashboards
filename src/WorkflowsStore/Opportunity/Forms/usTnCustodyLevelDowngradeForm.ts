import { differenceInMonths } from "date-fns";
import { findIndex, some, uniq } from "lodash";

import {
  assessmentQuestionNumbers,
  assessmentQuestions,
} from "../../../core/Paperwork/US_TN/CustodyLevelDowngrade/assessmentQuestions";
import WorkflowsUsTnCustodyLevelDowngradeForm from "../../../core/WorkflowsUsTnCustodyLevelDowngradeForm";
import { formatDate } from "../../../utils";
import { UsTnCustodyLevelDowngradeOpportunity } from "../UsTnCustodyLevelDowngradeOpportunity";
import { UsTnCustodyLevelDowngradeDraftData } from "../UsTnCustodyLevelDowngradeReferralRecord";
import { FormBase } from "./FormBase";

export class UsTnCustodyLevelDowngradeForm extends FormBase<
  UsTnCustodyLevelDowngradeDraftData,
  UsTnCustodyLevelDowngradeOpportunity
> {
  navigateToFormText = "Auto-fill CAF Form";

  formComponent = WorkflowsUsTnCustodyLevelDowngradeForm;

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
      date: formatDate(new Date()),
    };
    if (record) {
      const { formInformation } = record;
      out.lastCafDate = formatDate(formInformation.lastCafDate);
      out.lastCafTotal = formInformation.lastCafTotal;
      out.latestClassificationDecisionDate = formatDate(
        formInformation.latestClassificationDecisionDate
      );
      out.levelOfCare = formInformation.levelOfCare;
      assessmentQuestionNumbers.forEach((q) => {
        const score = formInformation[`q${q}Score`];
        if (q === 1 && score === 5) {
          // special logic because two options give the same score
          const recentWeapon = some(
            record.caseNotes["ASSAULTIVE DISCIPLINARIES"],
            ({ noteTitle, eventDate }) =>
              noteTitle &&
              eventDate &&
              ["AOW", "ASW", "ASV"].includes(noteTitle.slice(0, 3)) &&
              differenceInMonths(eventDate, new Date()) < 18
          );
          out.q1Selection = recentWeapon ? 1 : 3;
          return;
        }
        const { canBeNone, options } = assessmentQuestions[q - 1];
        if (canBeNone && score === 0) {
          out[`q${q}Selection`] = -1;
        } else {
          const selection = findIndex(options, (o) => o.score === score);
          if (selection === -1) throw new Error("bad CAF score");
          out[`q${q}Selection`] = selection;
        }
      });
      const { currentOffenses, q6Notes, q7Notes, q8Notes } = formInformation;
      if (currentOffenses) {
        out.q3Note = uniq(currentOffenses).join(", ");
      }
      if (q6Notes) {
        out.q6Note = q6Notes
          .map(
            ({ eventDate, noteBody }) =>
              `${formatDate(eventDate)} - Class ${noteBody}`
          )
          .join(", ");
      }
      if (q7Notes) {
        out.q7Note = q7Notes
          .map(
            ({ eventDate, noteBody }) =>
              `${formatDate(eventDate)} - Class ${noteBody}`
          )
          .join(", ");
      }
      if (q8Notes) {
        out.q8Note = q8Notes
          .map(
            ({ detainerReceivedDate, detainerFelonyFlag }) =>
              `${formatDate(detainerReceivedDate)} - ${
                detainerFelonyFlag ? "Felony" : "Misdemeanor"
              }`
          )
          .join(", ");
      }
    }
    return out;
  }
}
