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

import { format } from "date-fns";
import { differenceInMonths } from "date-fns";
import { findIndex, some, uniq } from "lodash";

import {
  AssessmentQuestionNumber,
  assessmentQuestionNumbers,
  assessmentQuestions,
} from "../../../core/Paperwork/US_TN/CustodyReclassification/assessmentQuestions";
import { OpportunityFormComponentName } from "../../../core/WorkflowsLayouts";
import { formatDate } from "../../../utils";
import {
  UsTnAnnualReclassificationReviewOpportunity,
  UsTnCustodyLevelDowngradeOpportunity,
  UsTnSharedReclassificationDraftData,
} from "../UsTn";
import { FormBase } from "./FormBase";

function formatViolationNotes(
  notes: { eventDate: Date; noteBody: string }[],
): string {
  return notes
    .map(({ eventDate, noteBody }) => `${formatDate(eventDate)} - ${noteBody}`)
    .join(", ");
}

export class UsTnReclassificationReviewForm extends FormBase<
  UsTnSharedReclassificationDraftData,
  | UsTnCustodyLevelDowngradeOpportunity
  | UsTnAnnualReclassificationReviewOpportunity
> {
  navigateToFormText = "Auto-fill Paperwork";

  get formContents(): OpportunityFormComponentName {
    return "WorkflowsUsTnReclassForm";
  }

  get formType(): string {
    return "UsTnReclassificationReviewForm";
  }

  get downloadText(): string {
    if (this.formIsDownloading) {
      return "Downloading DOCX...";
    }

    if (this.opportunity.updates?.completed) {
      return "Re-download DOCX";
    }

    return "Download DOCX";
  }

  prefilledDataTransformer(): Partial<UsTnSharedReclassificationDraftData> {
    const {
      opportunity: { record },
    } = this;
    const out: Partial<UsTnSharedReclassificationDraftData> = {
      residentFullName: this.person.displayName,
      omsId: this.person.externalId,
      institutionName: this.person.facilityId,
      recommendationFacilityAssignment: this.person.facilityId,
      date: formatDate(new Date()),
    };
    if (record) {
      const { formInformation, eligibleCriteria } = record;
      out.lastCafDate = formatDate(formInformation.lastCafDate);
      out.lastCafTotal = formInformation.lastCafTotal;
      out.latestClassificationDate = formatDate(
        formInformation.latestClassificationDate,
      );
      out.levelOfCare = formInformation.levelOfCare;

      out.statusAtHearing = formInformation.statusAtHearingSeg;
      out.hasIncompatibles = formInformation.hasIncompatibles;
      out.incompatiblesList = formInformation.incompatibleArray
        ?.map(({ incompatibleOffenderId }) => incompatibleOffenderId)
        .join(", ");

      // These reverse checks are needed because unknown criteria pass through.
      // Checking that a criteria required for one opportunity is absent verifies
      // that we're dealing with the other type.
      if (!("custodyLevelComparedToRecommended" in eligibleCriteria)) {
        out.currentCustodyLevel =
          eligibleCriteria.custodyLevelHigherThanRecommended.custodyLevel;
      } else if (!("custodyLevelHigherThanRecommended" in eligibleCriteria)) {
        out.currentCustodyLevel =
          eligibleCriteria.custodyLevelComparedToRecommended.custodyLevel;
      }

      const justifications: string[] = ["Justification for classification: "];
      if (formInformation.sentenceExpirationDate) {
        justifications.push(
          `Release Date: ${formatDate(formInformation.sentenceExpirationDate)}`,
        );
      }
      if (formInformation.sentenceReleaseEligibilityDate) {
        justifications.push(
          `RED Date: ${formatDate(
            formInformation.sentenceReleaseEligibilityDate,
          )}`,
        );
      }
      if (formInformation.healthClassification) {
        justifications.push(
          `Medical Classification: ${formInformation.healthClassification}`,
        );
      }
      if (formInformation.levelOfCare) {
        justifications.push(`Level of Care: ${formInformation.levelOfCare}`);
      }
      if (formInformation.latestVantageRiskLevel) {
        justifications.push(
          `Latest Vantage Risk Assessment: ${formInformation.latestVantageRiskLevel}`,
        );
      }
      if (formInformation.latestVantageCompletedDate) {
        justifications.push(
          `Latest Vantage Risk Assessment Date: ${formatDate(
            formInformation.latestVantageCompletedDate,
          )}`,
        );
      }
      if (formInformation.latestPreaScreeningResults) {
        const {
          latestPreaScreeningDate,
          aggressorFindingLevelChanged,
          victimFindingLevelChanged,
        } = formInformation.latestPreaScreeningResults;
        const preaClauses = [
          `Latest PREA screening date: ${formatDate(latestPreaScreeningDate)}`,
          aggressorFindingLevelChanged
            ? "Aggressor Finding has changed"
            : "Aggressor finding same as previous screening",

          victimFindingLevelChanged
            ? "Victim Finding has changed"
            : "Victim finding same as previous screening",
        ];
        justifications.push(preaClauses.join(", "));
      } else {
        justifications.push("Latest PREA screening: Unavailable");
      }
      if (
        formInformation.activeRecommendations &&
        formInformation.activeRecommendations.length
      ) {
        justifications.push(
          `Active Recommendations: ${uniq(
            formInformation.activeRecommendations.map(
              ({ Recommendation }) => Recommendation,
            ),
          ).join(", ")}`,
        );
      }

      out.recommendationJustification = justifications.join("\n");

      assessmentQuestionNumbers.forEach((q) => {
        // If we haven't calculated a score, skip this one
        if (!(`q${q}Score` in formInformation)) return;
        const score = formInformation[`q${q}Score`];
        if (q === 1 && score === 5) {
          // special logic because two options give the same score
          const recentWeapon = some(
            record.caseNotes["ASSAULTIVE DISCIPLINARIES"],
            ({ noteTitle, eventDate }) =>
              noteTitle &&
              eventDate &&
              ["AOW", "ASW", "ASV"].includes(noteTitle.slice(0, 3)) &&
              differenceInMonths(new Date(), eventDate) < 18,
          );
          out.q1Selection = recentWeapon ? 1 : 3;
          return;
        }
        const { canBeNone, options } = assessmentQuestions[q - 1];
        if (canBeNone && score === 0) {
          out[`q${q}Selection`] = -1;
        } else {
          const selection = findIndex(options, (o) => o.score === score);
          if (selection === -1) return;
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
            ({
              detainerReceivedDate,
              detainerFelonyFlag,
              detainerMisdemeanorFlag,
              jurisdiction,
              description,
              chargePending,
            }) => {
              const parts = [formatDate(detainerReceivedDate)];
              if (detainerFelonyFlag || detainerMisdemeanorFlag)
                parts.push(detainerFelonyFlag ? "Felony" : "Misdemeanor");
              if (description) parts.push(description);
              if (jurisdiction) parts.push(`Jurisdiction: ${jurisdiction}`);
              if (chargePending !== undefined)
                parts.push(
                  chargePending ? "Charge Pending" : "No Charge Pending",
                );
              return parts.join(" - ");
            },
          )
          .join("; ");
      }
    }
    return out;
  }

  get derivedData() {
    const { formData } = this;
    const out: Record<string, any> = { ...formData };

    out.downloadDate = format(new Date(), "MM/dd/yyyy");
    out.downloadTime = format(new Date(), "hh:mm bb");

    // Add tabs before newlines so the underlining looks right in these big blocks
    [
      "recommendationJustification",
      "disagreementReasons",
      "denialReasons",
    ].forEach((multiLineField) => {
      if (out[multiLineField])
        out[multiLineField] = out[multiLineField].replace(/\n/g, "\t\n");
    });

    function expandMultipleChoice<F extends keyof typeof formData>(
      field: F,
      options: (typeof formData)[F][],
    ) {
      const val = formData[field];
      if (val === undefined) return;
      for (const o of options) {
        if (val === o) {
          out[`${field}Selected${o}`] = true;
          return;
        }
      }
      out[`${field}Other`] = val;
    }
    expandMultipleChoice("statusAtHearing", ["GEN", "AS", "PC"]);
    expandMultipleChoice("hasIncompatibles", [true, false]);
    expandMultipleChoice("recommendationTransfer", [true, false]);
    expandMultipleChoice("updatedPhotoNeeded", [true, false]);
    expandMultipleChoice("emergencyContactUpdated", [true, false]);
    expandMultipleChoice("inmateAppeal", [true, false]);

    // This scoring logic is pretty convoluted. Here's what it should do:
    // If qNSelection exists, then qNSelectedX and qNScore should be set
    //   Except if N > 4 and scheduleAScore > 9
    //
    // If any 1-4 are blank: scheduleAScore, scheduleAText should be blank
    //   Else scheduleAScore, scheduleAText based on score 1-4
    // If scheduleAScore > 9 {
    //     totalText = scheduleAText and totalScore = scheduleAScore
    //     skip 5-9
    //   }
    //   Else if any 1-9 are blank: totalScore and totalText are blank
    //   Else totalScore, totalText based on score 1-9

    let runningScore = 0;
    let seenABlank = false;
    for (let i = 0; i < assessmentQuestions.length; i += 1) {
      const question = assessmentQuestions[i];
      const qNum = (i + 1) as AssessmentQuestionNumber;

      const selection = formData[`q${qNum}Selection`];
      if (selection === undefined) {
        seenABlank = true;
      } else if (selection === -1) {
        out[`q${qNum}SelectedNone`] = true;
        out[`q${qNum}Score`] = 0;
      } else {
        out[`q${qNum}Selected${selection}`] = true;
        const { score } = question.options[selection];
        out[`q${qNum}Score`] = score;
        runningScore += score;
      }

      // End of Schedule A
      if (qNum === 4) {
        out.scheduleAScore = runningScore;
        out.scheduleAText = "Complete Schedule B";
        if (seenABlank) {
          out.scheduleAScore = "";
          out.scheduleAText = "";
        } else if (runningScore > 9) {
          if (runningScore >= 15) {
            out.scheduleAText = "MAXIMUM";
          } else {
            out.scheduleAText = "CLOSE";
          }
          out.totalText = out.scheduleAText;
          out.totalScore = out.scheduleAScore;
          out.scheduleBSkipped = true;
          break; // SKIP SCHEDULE B;
        }
      }

      // If we skipped Schedule B we'll never get here
      if (qNum === 9) {
        out.totalScore = seenABlank ? "" : runningScore;
        if (seenABlank) {
          out.totalText = "";
        } else if (runningScore >= 17) {
          out.totalText = "CLOSE";
        } else if (runningScore >= 7) {
          out.totalText = "MEDIUM";
        } else {
          out.totalText = "MINIMUM";
        }
      }
    }
    return out;
  }
}
