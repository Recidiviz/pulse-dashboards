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
  formData: Partial<UsTnSharedReclassificationDraftData>
) {
  const out: Record<string, any> = { ...formData };

  function expandMultipleChoice<F extends keyof typeof formData>(
    field: F,
    options: typeof formData[F][]
  ) {
    const val = formData[field];
    for (const o of options) {
      if (val === o) {
        out[`${field}Selected${o}`] = true;
        return;
      }
    }
    out[`$f{field}Other`] = val;
  }
  expandMultipleChoice("statusAtHearing", ["GEN", "AS", "PC"]);
  expandMultipleChoice("hasIncompatibles", [true, false]);
  expandMultipleChoice("recommendationTransfer", [true, false]);
  expandMultipleChoice("inmateAppeal", [true, false]);

  out.totalScore = 0;
  assessmentQuestions.forEach((question, i) => {
    const qNum = (i + 1) as AssessmentQuestionNumber;

    if (qNum > 4 && out.scheduleAScore > 9) return;

    const selection = formData[`q${qNum}Selection`];
    if (selection !== undefined) {
      if (selection === -1) {
        out[`q${qNum}SelectedNone`] = true;
        out[`q${qNum}Score`] = 0;
      } else {
        out[`q${qNum}Selected${selection}`] = true;
        const { score } = question.options[selection];
        out[`q${qNum}Score`] = score;
        out.totalScore += score;
      }
    }

    if (qNum === 4) {
      out.scheduleAScore = out.totalScore;
      if (out.scheduleAScore >= 15) {
        out.scheduleAText = "Maximum";
        out.totalText = "Maximum";
      } else if (out.scheduleAScore > 9) {
        out.scheduleAText = "Close";
        out.totalText = "Close";
      } else {
        out.scheduleAText = "Complete Schedule B";
      }
    }
  });

  if (out.totalText) {
    // skipped schedule B, we're done
  } else if (out.totalScore >= 17) {
    out.totalText = "Close";
  } else if (out.totalScore >= 7) {
    out.totalText = "Medium";
  } else {
    out.totalText = "Minimum";
  }
  return out;
}

const WorkflowsUsTnReclassForm: React.FC = () => {
  const {
    workflowsStore: { selectedResident: resident },
  } = useRootStore();

  const form = useOpportunityFormContext() as UsTnCustodyLevelDowngradeForm;

  const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;

  const onClickDownload = async () => {
    const { formData } = form;
    if (!formData || !resident) return;

    return downloadSingle(
      `${resident.displayName} - Reclassification Packet.docx`,
      resident.stateCode,
      "custody_reclassification_template.docx",
      templateValuesForFormData(formData),
      resident.rootStore.getTokenSilently
    );
  };

  return (
    <FormContainer
      heading="Reclassification Packet"
      agencyName="TDOC"
      dataProviso="Please review any data pre-filled in lines 2, 4, 5 and 9 in the Classification Assessment Form."
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
