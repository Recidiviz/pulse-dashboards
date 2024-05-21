// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import {
  AssessmentQuestionNumber,
  assessmentQuestions,
} from "../../../core/Paperwork/US_TN/CustodyLevelDowngrade/assessmentQuestions";
import { UsTnCustodyLevelDowngradeForm } from "./usTnCustodyLevelDowngradeForm";
// TODO(#4108): Consider and apply refactoring `UsTnAnnualReclassificationReview...` and `UsTnCustodyLevelDowngrade...` files to remove duplicated logic.
export class UsTnAnnualReclassificationReviewForm extends UsTnCustodyLevelDowngradeForm {
  navigateToFormText = "Auto-fill Paperwork";

  get downloadText(): string {
    if (this.formIsDownloading) {
      return "Downloading DOCX...";
    }

    if (this.opportunity.updates?.completed) {
      return "Re-download DOCX";
    }

    return "Download DOCX";
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
