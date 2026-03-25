// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import React, { useState } from "react";

import { dcafAssessmentQuestions } from "~datatypes";

import { Opportunity } from "../../../../WorkflowsStore";
import { UsTnDiagnosticClassification2026Form } from "../../../../WorkflowsStore/Opportunity/Forms/UsTnDiagnosticClassification2026Form";
import { Resident } from "../../../../WorkflowsStore/Resident";
import { FileGeneratorArgs, renderMultipleDocx } from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";
import FormViewer from "../../FormViewer";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { PrintablePage } from "../../styles";
import { downloadZipFile } from "../../utils";
import { CafScoreSourceModal } from "../common/cafScoreSourceModal";
import {
  AGE_SUPPORTING_TEXT,
  ClassificationFormPage,
  DISCIPLINARY_RECORD_SUPPORTING_TEXT,
  DoubleNotes,
  Header,
  PROGRAM_COMPLETION_SUPPORTING_TEXT,
  Q1_SUPPORTING_TEXT,
  Q2_SUPPORTING_TEXT,
  TextboxWithHeader,
  TotalScore,
} from "../common/Classification2026";
import classificationNextSteps2026Template from "../common/Classification2026/classification_next_steps_2026.docx";
import { PostDownloadModal } from "../common/Classification2026/NextStepsModal";
import { ScoredAssessmentQuestion } from "../common/ScoredAssessmentQuestion";
import CoverSheet from "../CustodyReclassification/CoverSheet";
import HearingNotice from "../CustodyReclassification/HearingNotice";
import { getCoverSheetTemplateArgs } from "../CustodyReclassification/utils";
import dcafTemplate from "./dcaf_template.docx";

export const FormUsTnDiagnosticClassification2026 = observer(
  function FormUsTnDiagnosticClassification2026({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    const formRef = React.useRef<HTMLDivElement>(null);
    const [postDownloadModalIsOpen, setPostDownloadModalIsOpen] =
      useState<boolean>(false);
    const form =
      useOpportunityFormContext() as UsTnDiagnosticClassification2026Form;
    const { derivedData, formTemplateData, formData } = form;
    const resident = opportunity.person as Resident;

    const onClickDownload = async () => {
      const fileInputs: FileGeneratorArgs[] = [
        [
          `${resident.displayName} - Classification Next Steps.docx`,
          classificationNextSteps2026Template,
          formTemplateData,
        ],
        [
          `${resident.displayName} - Diagnostic Classification Form.docx`,
          dcafTemplate,
          {
            ...getCoverSheetTemplateArgs(resident, formData),
            ...formTemplateData,
          },
        ],
      ];

      const documents = await renderMultipleDocx(fileInputs);

      downloadZipFile(
        `${resident.displayName} - Classification Packet 2026.zip`,
        documents,
      );

      setPostDownloadModalIsOpen(true);
    };

    return (
      <FormContainer
        heading="DCAF"
        agencyName="TDOC"
        onClickDownload={() => onClickDownload()}
        opportunity={opportunity}
        downloadButtonLabel="Download as .DOCX"
      >
        <CafScoreSourceModal latestRecordQs={[3, 4, 5, 6]} jobHistoryQs={[7]} />
        <FormViewer formRef={formRef}>
          <CoverSheet />
          <PrintablePage landscape stretchable>
            <ClassificationFormPage>
              <Header>TENNESSEE CLASSIFICATION INSTRUMENT: DIAGNOSTIC</Header>
              <ScoredAssessmentQuestion
                questionSpec={dcafAssessmentQuestions[0]}
                questionNumber={1}
                supportingText={Q1_SUPPORTING_TEXT}
              >
                <DoubleNotes>
                  <TextboxWithHeader
                    header={
                      "List prior violent felony convictions (TDOC) in Last 60 Months (imposed date, charge):"
                    }
                    name={"q1aNotes"}
                  />
                  <TextboxWithHeader
                    header={
                      "List prior ISC or Diversion convictions in  the Last 60 Months - Please confirm if they are violent felony convictions (imposed date, charge):"
                    }
                    name={"q1bNotes"}
                  />
                </DoubleNotes>
              </ScoredAssessmentQuestion>
              <ScoredAssessmentQuestion
                questionSpec={dcafAssessmentQuestions[1]}
                questionNumber={2}
                supportingText={Q2_SUPPORTING_TEXT}
              >
                <TextboxWithHeader
                  header={"List current offenses:"}
                  name={"q2Notes"}
                />
              </ScoredAssessmentQuestion>
              <ScoredAssessmentQuestion
                questionSpec={dcafAssessmentQuestions[2]}
                questionNumber={3}
                supportingText={DISCIPLINARY_RECORD_SUPPORTING_TEXT}
              >
                <TextboxWithHeader
                  header={"List disciplinaries:"}
                  name={"q3Notes"}
                />
              </ScoredAssessmentQuestion>
            </ClassificationFormPage>
          </PrintablePage>
          <PrintablePage landscape stretchable>
            <ClassificationFormPage>
              <ScoredAssessmentQuestion
                questionSpec={dcafAssessmentQuestions[3]}
                questionNumber={4}
                supportingText={DISCIPLINARY_RECORD_SUPPORTING_TEXT}
              >
                <TextboxWithHeader
                  header={"List disciplinaries:"}
                  name={"q4Notes"}
                />
              </ScoredAssessmentQuestion>
              <ScoredAssessmentQuestion
                questionSpec={dcafAssessmentQuestions[4]}
                questionNumber={5}
                supportingText={DISCIPLINARY_RECORD_SUPPORTING_TEXT}
              >
                <TextboxWithHeader
                  header={"List disciplinaries:"}
                  name={"q5Notes"}
                />
              </ScoredAssessmentQuestion>
              <ScoredAssessmentQuestion
                questionSpec={dcafAssessmentQuestions[5]}
                questionNumber={6}
                supportingText={AGE_SUPPORTING_TEXT}
              />
            </ClassificationFormPage>
          </PrintablePage>
          <PrintablePage landscape>
            <ClassificationFormPage>
              <ScoredAssessmentQuestion
                questionSpec={dcafAssessmentQuestions[6]}
                questionNumber={7}
                supportingText={PROGRAM_COMPLETION_SUPPORTING_TEXT}
              >
                <TextboxWithHeader
                  header={"List completed programs:"}
                  name={"q7Notes"}
                />
              </ScoredAssessmentQuestion>
              <TotalScore score={derivedData.totalScore} mediumUpper={24} />
            </ClassificationFormPage>
          </PrintablePage>
          <HearingNotice pilotVersion />
        </FormViewer>
        <PostDownloadModal
          isOpen={postDownloadModalIsOpen}
          onClose={() => setPostDownloadModalIsOpen(false)}
        />
      </FormContainer>
    );
  },
);
