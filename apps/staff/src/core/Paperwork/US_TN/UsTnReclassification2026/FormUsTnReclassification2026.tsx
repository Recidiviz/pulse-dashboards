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

import { useRootStore } from "../../../../components/StoreProvider";
import { Opportunity } from "../../../../WorkflowsStore";
import { UsTnDiagnosticClassification2026Form } from "../../../../WorkflowsStore/Opportunity/Forms/UsTnDiagnosticClassification2026Form";
import { FileGeneratorArgs, renderMultipleDocx } from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";
import FormViewer from "../../FormViewer";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { PrintablePage } from "../../styles";
import { downloadZipFile } from "../../utils";
import {
  ClassificationFormPage,
  DoubleNotes,
  Header,
  TextboxWithHeader,
  TotalScore,
} from "../common/Classification2026";
import { PostDownloadModal } from "../common/Classification2026/NextStepsModal";
import { TrusteeChecklist } from "../common/Classification2026/TrusteeChecklist";
import { ScoredAssessmentQuestion } from "../common/ScoredAssessmentQuestion";
import { assessmentQuestions } from "./assessmentQuestions";

export const FormUsTnReclassification2026 = observer(
  function FormUsTnReclassification2026({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    const formRef = React.useRef<HTMLDivElement>(null);
    const [postDownloadModalIsOpen, setPostDownloadModalIsOpen] =
      useState<boolean>(false);
    const { derivedData } =
      useOpportunityFormContext() as UsTnDiagnosticClassification2026Form;
    const { getTokenSilently } = useRootStore();
    const resident = opportunity.person;

    const onClickDownload = async () => {
      const fileInputs: FileGeneratorArgs[] = [
        ["classification_next_steps_2026", "Classification Next Steps"],
      ].map(([filename, outputName]) => {
        return [
          `${resident.displayName} - ${outputName}.docx`,
          resident.stateCode,
          `${filename}.docx`,
          {}, // No form contents yet
        ];
      });

      const documents = await renderMultipleDocx(fileInputs, getTokenSilently);

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
        <FormViewer formRef={formRef}>
          <PrintablePage landscape stretchable>
            <ClassificationFormPage>
              <Header>
                TENNESSEE CLASSIFICATION INSTRUMENT: RECLASSIFICATION
              </Header>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[0]}
                questionNumber={1}
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
              >
                <TextboxWithHeader
                  header={"List current offenses:"}
                  name={"q2Notes"}
                />
              </ScoredAssessmentQuestion>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[2]}
                questionNumber={3}
              >
                <TextboxWithHeader
                  header={"List disciplinaries:"}
                  name={"q3NotesFormatted"}
                />
              </ScoredAssessmentQuestion>
            </ClassificationFormPage>
          </PrintablePage>
          <PrintablePage landscape stretchable>
            <ClassificationFormPage>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[3]}
                questionNumber={4}
              >
                <TextboxWithHeader
                  header={"List disciplinaries:"}
                  name={"q4NotesFormatted"}
                />
              </ScoredAssessmentQuestion>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[4]}
                questionNumber={5}
              >
                <TextboxWithHeader
                  header={"List disciplinaries:"}
                  name={"q5NotesFormatted"}
                />
              </ScoredAssessmentQuestion>
            </ClassificationFormPage>
          </PrintablePage>
          <PrintablePage landscape stretchable>
            <ClassificationFormPage>
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[5]}
                questionNumber={6}
              />
              <ScoredAssessmentQuestion
                questionSpec={assessmentQuestions[6]}
                questionNumber={7}
              >
                <TextboxWithHeader
                  header={"List completed programs:"}
                  name={"q7Notes"}
                />
              </ScoredAssessmentQuestion>
              <TotalScore score={derivedData.totalScore} />
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
