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
import { observer } from "mobx-react-lite";
import React from "react";

import { useRootStore } from "../../components/StoreProvider";
import { UsTnSharedReclassificationDraftData } from "../../WorkflowsStore";
import { UsTnCustodyLevelDowngradeForm } from "../../WorkflowsStore/Opportunity/Forms/usTnCustodyLevelDowngradeForm";
import { downloadSingle } from "../Paperwork/DOCXFormGenerator";
import { FormContainer } from "../Paperwork/FormContainer";
import FormViewer from "../Paperwork/FormViewer";
import { useOpportunityFormContext } from "../Paperwork/OpportunityFormContext";
import {
  AssessmentQuestionNumber,
  assessmentQuestions,
} from "../Paperwork/US_TN/CustodyReclassification/assessmentQuestions";
import ClassificationCustodyAssessment from "../Paperwork/US_TN/CustodyReclassification/ClassificationCustodyAssessment";

export function templateValuesForFormData(
  formData: Partial<UsTnSharedReclassificationDraftData> & {
    userExternalId?: string;
  }
) {
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
    options: typeof formData[F][]
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
        if (runningScore > 15) {
          out.scheduleAText = "Maximum";
        } else {
          out.scheduleAText = "Close";
        }
        out.totalText = out.scheduleAText;
        out.totalScore = out.scheduleAScore;
        break; // SKIP SCHEDULE B;
      }
    }

    // If we skipped Schedule B we'll never get here
    if (qNum === 9) {
      out.totalScore = seenABlank ? "" : runningScore;
      if (seenABlank) {
        out.totalText = "";
      } else if (runningScore >= 17) {
        out.totalText = "Close";
      } else if (runningScore >= 7) {
        out.totalText = "Medium";
      } else {
        out.totalText = "Minimum";
      }
    }
  }
  return out;
}

const WorkflowsUsTnReclassForm: React.FC = () => {
  const {
    workflowsStore: { selectedResident: resident },
  } = useRootStore();

  const userExternalId = resident?.rootStore.userStore.externalId;

  const form = useOpportunityFormContext() as UsTnCustodyLevelDowngradeForm;

  const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;

  const onClickDownload = async () => {
    const { formData } = form;
    if (!formData || !resident) return;

    return downloadSingle(
      `${resident.displayName} - Reclassification Packet.docx`,
      resident.stateCode,
      "custody_reclassification_template.docx",
      templateValuesForFormData({ ...formData, userExternalId }),
      resident.rootStore.getTokenSilently
    );
  };

  return (
    <FormContainer
      heading="Reclassification Packet"
      agencyName="TDOC"
      dataProviso="Please review any data pre-filled from previous Classification scores for questions 3, 4, 5 and 9 in the Classification Assessment Form."
      downloadButtonLabel={form.downloadText}
      onClickDownload={async () => onClickDownload()}
      opportunity={form.opportunity}
    >
      <FormViewer formRef={formRef}>
        <ClassificationCustodyAssessment />
      </FormViewer>
    </FormContainer>
  );
};

export default observer(WorkflowsUsTnReclassForm);
