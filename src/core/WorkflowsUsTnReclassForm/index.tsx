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

function templateValuesForFormData(
  formData: Partial<UsTnSharedReclassificationDraftData>
) {
  const out: Record<string, any> = { ...formData };
  assessmentQuestions.forEach((question, i) => {
    const qNum = (i + 1) as AssessmentQuestionNumber;
    const selection = formData[`q${qNum}Selection`];
    if (selection !== undefined) {
      if (selection === -1) {
        out[`q${qNum}SelectedNone`] = true;
        out[`q${qNum}Score`] = 0;
      } else {
        out[`q${qNum}Selected${selection}`] = true;
        out[`q${qNum}Score`] = question.options[selection].score;
      }
    }
  });

  out.scheduleAScore = out.q1Score + out.q2Score + out.q3Score + out.q4Score;
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
