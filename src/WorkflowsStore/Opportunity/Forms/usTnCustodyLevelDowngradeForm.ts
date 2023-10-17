import { differenceInMonths } from "date-fns";
import { findIndex, some, uniq } from "lodash";

import {
  assessmentQuestionNumbers,
  assessmentQuestions,
} from "../../../core/Paperwork/US_TN/CustodyLevelDowngrade/assessmentQuestions";
import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { formatDate } from "../../../utils";
import {
  UsTnAnnualReclassificationReviewOpportunity,
  UsTnCustodyLevelDowngradeOpportunity,
  UsTnSharedReclassificationDraftData,
} from "../UsTn";
import { FormBase } from "./FormBase";
// TODO(#4108): Consider and apply refactoring `UsTnAnnualReclassificationReview...` and `UsTnCustodyLevelDowngrade...` files to remove duplicated logic.
function formatViolationNotes(
  notes: { eventDate: Date; noteBody: string }[]
): string {
  return notes
    .map(({ eventDate, noteBody }) => {
      // TODO(#4041): Remove q6 and q7 note fallback
      if (["A", "B", "C"].includes(noteBody)) {
        return `${formatDate(eventDate)} - Class ${noteBody}`;
      }
      return `${formatDate(eventDate)} - ${noteBody}`;
    })
    .join(", ");
}

export class UsTnCustodyLevelDowngradeForm extends FormBase<
  UsTnSharedReclassificationDraftData,
  | UsTnCustodyLevelDowngradeOpportunity
  | UsTnAnnualReclassificationReviewOpportunity
> {
  navigateToFormText = "Auto-fill CAF Form";

  get formContents(): OpportunityFormComponentName {
    if (
      this.rootStore.workflowsStore.featureVariants.usTnAnnualReclassification
    )
      return "WorkflowsUsTnReclassForm";
    return "WorkflowsUsTnCustodyLevelDowngradeForm";
  }

  get downloadText(): string {
    if (this.formIsDownloading) {
      return "Downloading PDF...";
    }

    if (this.opportunity.updates?.completed) {
      return "Re-download PDF";
    }

    return "Download PDF";
  }

  prefilledDataTransformer(): Partial<UsTnSharedReclassificationDraftData> {
    const {
      opportunity: { record },
    } = this;
    const out: Partial<UsTnSharedReclassificationDraftData> = {
      residentFullName: this.person.displayName,
      omsId: this.person.externalId,
      institutionName: this.person.facilityId,
      date: formatDate(new Date()),
    };
    if (record) {
      const { formInformation, eligibleCriteria } = record;
      out.lastCafDate = formatDate(formInformation.lastCafDate);
      out.lastCafTotal = formInformation.lastCafTotal;
      out.latestClassificationDate = formatDate(
        formInformation.latestClassificationDate
      );
      out.levelOfCare = formInformation.levelOfCare;

      out.statusAtHearing = formInformation.statusAtHearingSeg;
      out.hasIncompatibles = formInformation.hasIncompatibles;
      out.incompatiblesList = formInformation.incompatibleArray
        ?.map(({ incompatibleOffenderId }) => incompatibleOffenderId)
        .join(", ");
      if ("custodyLevelHigherThanRecommended" in eligibleCriteria) {
        out.currentCustodyLevel =
          eligibleCriteria.custodyLevelHigherThanRecommended.custodyLevel;
      } else {
        out.currentCustodyLevel =
          eligibleCriteria.custodyLevelComparedToRecommended.custodyLevel ??
          undefined;
      }

      const justifications: string[] = [];
      if (formInformation.sentenceExpirationDate) {
        justifications.push(
          `Release Date: ${formatDate(formInformation.sentenceExpirationDate)}`
        );
      }
      if (formInformation.sentenceReleaseEligibilityDate) {
        justifications.push(
          `RED Date: ${formatDate(
            formInformation.sentenceReleaseEligibilityDate
          )}`
        );
      }
      if (formInformation.healthClassification) {
        justifications.push(
          `Medical Classification: ${formInformation.healthClassification}`
        );
      }
      if (formInformation.levelOfCare) {
        justifications.push(`Level of Care: ${formInformation.levelOfCare}`);
      }
      if (formInformation.latestVantageRiskLevel) {
        justifications.push(
          `Latest Vantage Risk Level: ${formInformation.latestVantageRiskLevel}`
        );
      }
      if (
        formInformation.activeRecommendations &&
        formInformation.activeRecommendations.length
      ) {
        justifications.push(
          `Active Recommendations: ${uniq(
            formInformation.activeRecommendations.map(
              ({ Recommendation }) => Recommendation
            )
          ).join(", ")}`
        );
      }
      out.recommendationJustification = justifications.join("\n");

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
              differenceInMonths(new Date(), eventDate) < 18
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
        out.q6Note = formatViolationNotes(q6Notes);
      }
      if (q7Notes) {
        out.q7Note = formatViolationNotes(q7Notes);
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
