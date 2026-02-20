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
import { UsTnReclassification2026Form } from "../../../../WorkflowsStore/Opportunity/Forms/UsTnReclassification2026Form";
import { Resident } from "../../../../WorkflowsStore/Resident";
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
import HearingNotice from "../CustodyReclassification/HearingNotice";
import { getCoverSheetTemplateArgs } from "../CustodyReclassification/utils";
import { assessmentQuestions } from "./assessmentQuestions";
import rcafTemplate from "./rcaf_template.docx";

export const FormUsTnReclassification2026 = observer(
  function FormUsTnReclassification2026({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    const formRef = React.useRef<HTMLDivElement>(null);
    const [postDownloadModalIsOpen, setPostDownloadModalIsOpen] =
      useState<boolean>(false);
    const form = useOpportunityFormContext() as UsTnReclassification2026Form;
    const { derivedData, formTemplateData, formData } = form;
    const resident = opportunity.person as Resident;

    const includeTrusteeChecklist =
      derivedData.totalScore <= 12 ||
      formData.counselorRecommendedCustody === "LOW" ||
      formData.recommendationCustodyLevel === "LOW";

    const onClickDownload = async () => {
      const fileInputs: FileGeneratorArgs[] = [
        [
          `${resident.displayName} - Classification Next Steps.docx`,
          classificationNextSteps2026Template,
          formTemplateData,
        ],
        [
          `${resident.displayName} - Reclassification Form.docx`,
          rcafTemplate,
          {
            ...formTemplateData,
            ...getCoverSheetTemplateArgs(resident, formData),
          },
        ],
      ];

      if (includeTrusteeChecklist) {
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
        heading="RCAF"
        agencyName="TDOC"
        onClickDownload={() => onClickDownload()}
        opportunity={opportunity}
        downloadButtonLabel="Download as .DOCX"
      >
        <CafScoreSourceModal
          sentenceHistoryQs={[1]}
          lastestCafQs={[2]}
          latestRecordQs={[3, 4, 5, 6]}
          jobHistoryQs={[7]}
        />
        <FormViewer formRef={formRef}>
          <CoverSheet />
          <PrintablePage landscape stretchable watermark="Draft">
            <ClassificationFormPage>
              <Header>
                TENNESSEE CLASSIFICATION INSTRUMENT: RECLASSIFICATION
              </Header>
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
                  name={"q3NotesFormatted"}
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
                  name={"q4NotesFormatted"}
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
                  name={"q5NotesFormatted"}
                />
              </ScoredAssessmentQuestion>
            </ClassificationFormPage>
          </PrintablePage>
          <PrintablePage landscape stretchable watermark="Draft">
            <ClassificationFormPage>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[5]}
                questionNumber={6}
                supportingText={
                  "Recidiviz is auto-filling this score based on the resident’s disciplinary record using data from eTOMIS."
                }
              />
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[6]}
                questionNumber={7}
                supportingText={
                  "Recidiviz is auto-filling this score based on the resident’s class and job history in eTOMIS."
                }
              >
                <TextboxWithHeader
                  header={"List completed programs:"}
                  name={"q7Notes"}
                />
              </ScoredAssessmentQuestion>
              <TotalScore score={derivedData.totalScore} mediumUpper={30} />
            </ClassificationFormPage>
          </PrintablePage>
          <TrusteeChecklist display={includeTrusteeChecklist} />
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
