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

import { Opportunity } from "../../../../WorkflowsStore";
import { UsTnDiagnosticClassification2026Form } from "../../../../WorkflowsStore/Opportunity/Forms/UsTnDiagnosticClassification2026Form";
import { FileGeneratorArgs, renderMultipleDocx } from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";
import FormViewer from "../../FormViewer";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { PrintablePage } from "../../styles";
import { downloadZipFile } from "../../utils";
import { CafScoreSourceModal } from "../common/cafScoreSourceModal";
import {
  ClassificationFormPage,
  DoubleNotes,
  Header,
  TextboxWithHeader,
  TotalScore,
} from "../common/Classification2026";
import classificationNextSteps2026Template from "../common/Classification2026/classification_next_steps_2026.docx";
import { PostDownloadModal } from "../common/Classification2026/NextStepsModal";
import {
  getTrusteeTemplateArgs,
  TrusteeChecklist,
} from "../common/Classification2026/TrusteeChecklist";
import { ScoredAssessmentQuestion } from "../common/ScoredAssessmentQuestion";
import CoverSheet from "../CustodyReclassification/CoverSheet";
import { assessmentQuestions } from "./assessmentQuestions";
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
    const { derivedData, formTemplateData } = form;
    const resident = opportunity.person;

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
          formTemplateData,
        ],
      ];

      if (derivedData.totalScore <= 12) {
        fileInputs.push(getTrusteeTemplateArgs(resident, form));
      }

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
        <CafScoreSourceModal
          lastestCafQs={[2]}
          latestRecordQs={[1, 3, 4, 5, 6]}
        />
        <FormViewer formRef={formRef}>
          <CoverSheet />
          <PrintablePage landscape stretchable watermark="Draft">
            <ClassificationFormPage>
              <Header>TENNESSEE CLASSIFICATION INSTRUMENT: DIAGNOSTIC</Header>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[0]}
                questionNumber={1}
                supportingText={
                  "Recidiviz is auto-filling this score based on the resident’s sentence history, as found in eTOMIS. Convictions are considered prior if they did not occur on the resident’s most recent felony Sentence Imposed Date."
                }
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
                questionSpec={assessmentQuestions[1]}
                questionNumber={2}
                supportingText={
                  "Recidiviz is auto-filling this score from the resident’s last completed CAF, directly from eTOMIS."
                }
              >
                <TextboxWithHeader
                  header={"List current offenses:"}
                  name={"q2Notes"}
                />
              </ScoredAssessmentQuestion>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[2]}
                questionNumber={3}
                supportingText={
                  "Recidiviz is auto-filling this score based on the resident’s disciplinary record using data from eTOMIS."
                }
              >
                <TextboxWithHeader
                  header={"List disciplinaries:"}
                  name={"q3Notes"}
                />
              </ScoredAssessmentQuestion>
            </ClassificationFormPage>
          </PrintablePage>
          <PrintablePage landscape stretchable watermark="Draft">
            <ClassificationFormPage>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[3]}
                questionNumber={4}
                supportingText={
                  "Recidiviz is auto-filling this score based on the resident’s disciplinary record using data from eTOMIS."
                }
              >
                <TextboxWithHeader
                  header={"List disciplinaries:"}
                  name={"q4Notes"}
                />
              </ScoredAssessmentQuestion>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[4]}
                questionNumber={5}
                supportingText={
                  "Recidiviz is auto-filling this score based on the resident’s disciplinary record using data from eTOMIS."
                }
              >
                <TextboxWithHeader
                  header={"List disciplinaries:"}
                  name={"q5Notes"}
                />
              </ScoredAssessmentQuestion>
            </ClassificationFormPage>
          </PrintablePage>
          <PrintablePage landscape watermark="Draft">
            <ClassificationFormPage>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[5]}
                questionNumber={6}
                supportingText={
                  "Recidiviz is auto-filling this score based on the resident’s age using data from eTOMIS."
                }
              />
              <TotalScore score={derivedData.totalScore} mediumUpper={27} />
            </ClassificationFormPage>
          </PrintablePage>
          <TrusteeChecklist display={derivedData.totalScore <= 12} />
        </FormViewer>
        <PostDownloadModal
          isOpen={postDownloadModalIsOpen}
          onClose={() => setPostDownloadModalIsOpen(false)}
        />
      </FormContainer>
    );
  },
);
