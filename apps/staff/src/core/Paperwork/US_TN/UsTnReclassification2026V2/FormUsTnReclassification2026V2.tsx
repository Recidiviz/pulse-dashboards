// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import {
  RCAF_LOW_UPPER_THRESHOLD_V2,
  RCAF_MEDIUM_UPPER_THRESHOLD_V2,
  rcafAssessmentQuestionsV2,
  showTrusteeChecklist,
} from "~datatypes";

import { Opportunity } from "../../../../WorkflowsStore";
import { UsTnReclassification2026FormV2 } from "../../../../WorkflowsStore/Opportunity/Forms/UsTnReclassification2026FormV2";
import { Resident } from "../../../../WorkflowsStore/Resident";
import { FileGeneratorArgs, renderMultipleDocx } from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";
import FormViewer from "../../FormViewer";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { PrintablePage } from "../../styles";
import { downloadZipFile } from "../../utils";
import {
  AGE_SUPPORTING_TEXT,
  BLOCKED_DOWNLOAD_WRONG_VERSION_NEW,
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
import {
  getTrusteeTemplateArgs,
  TrusteeChecklist,
} from "../common/Classification2026/TrusteeChecklist";
import {
  cafBlockedDownloadTooltip,
  RCAF_V2_CUTOFF_DATE,
} from "../common/Classification2026/utils";
import { PreworkModal } from "../common/preworkModal";
import { ScoredAssessmentQuestion } from "../common/ScoredAssessmentQuestion";
import CoverSheet from "../CustodyReclassification/CoverSheet";
import HearingNotice from "../CustodyReclassification/HearingNotice";
import { getCoverSheetTemplateArgs } from "../CustodyReclassification/utils";
import rcafTemplateV2 from "./rcaf_template_v2.docx";

export const FormUsTnReclassification2026V2 = observer(
  function FormUsTnReclassification2026V2({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    const formRef = React.useRef<HTMLDivElement>(null);
    const [postDownloadModalIsOpen, setPostDownloadModalIsOpen] =
      useState<boolean>(false);
    const form = useOpportunityFormContext() as UsTnReclassification2026FormV2;
    const { derivedData, formTemplateData, formData } = form;
    const resident = opportunity.person as Resident;

    const includeTrusteeChecklist = showTrusteeChecklist(
      derivedData.totalText,
      formData,
    );

    const onClickDownload = async () => {
      const fileInputs: FileGeneratorArgs[] = [
        [
          `${resident.displayName} - Classification Next Steps.docx`,
          classificationNextSteps2026Template,
          formTemplateData,
        ],
        [
          `${resident.displayName} - Reclassification Form.docx`,
          rcafTemplateV2,
          {
            ...getCoverSheetTemplateArgs(resident, formData),
            ...formTemplateData,
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

    const wrongFormVersion =
      formData.date === undefined ||
      new Date(formData.date) < RCAF_V2_CUTOFF_DATE;

    let downloadTooltip = cafBlockedDownloadTooltip(
      derivedData.totalScore,
      formData.hearingDate,
    );

    if (wrongFormVersion) downloadTooltip = BLOCKED_DOWNLOAD_WRONG_VERSION_NEW;

    return (
      <FormContainer
        heading="RCAF"
        agencyName="TDOC"
        onClickDownload={() => onClickDownload()}
        opportunity={opportunity}
        isMissingContent={downloadTooltip !== undefined}
        downloadTooltip={downloadTooltip}
        downloadButtonLabel="Download as .DOCX"
      >
        <PreworkModal />
        <FormViewer formRef={formRef}>
          <CoverSheet />
          <PrintablePage stretchable>
            <ClassificationFormPage>
              <Header>
                TENNESSEE CLASSIFICATION INSTRUMENT: RECLASSIFICATION
              </Header>
              <ScoredAssessmentQuestion
                questionSpec={rcafAssessmentQuestionsV2[0]}
                questionNumber={1}
                supportingText={Q1_SUPPORTING_TEXT}
              >
                <DoubleNotes>
                  <TextboxWithHeader
                    header={
                      "List prior violent/assaultive felony convictions (TDOC) in Last 60 Months (imposed date, charge):"
                    }
                    name={"q1aNotes"}
                  />
                  <TextboxWithHeader
                    header={
                      "List prior ISC or Diversion convictions in  the Last 60 Months - Please confirm if they are violent/assaultive felony convictions (imposed date, charge):"
                    }
                    name={"q1bNotes"}
                  />
                </DoubleNotes>
              </ScoredAssessmentQuestion>
              <ScoredAssessmentQuestion
                questionSpec={rcafAssessmentQuestionsV2[1]}
                questionNumber={2}
                supportingText={Q2_SUPPORTING_TEXT}
              >
                <TextboxWithHeader
                  header={"List current offenses:"}
                  name={"q2Notes"}
                />
              </ScoredAssessmentQuestion>
              <ScoredAssessmentQuestion
                questionSpec={rcafAssessmentQuestionsV2[2]}
                scoreSubtext="(if greater than 6, write 6)"
                questionNumber={3}
                supportingText={DISCIPLINARY_RECORD_SUPPORTING_TEXT}
              >
                <TextboxWithHeader
                  header={"List disciplinaries:"}
                  name={"q3NotesFormatted"}
                />
              </ScoredAssessmentQuestion>
              <ScoredAssessmentQuestion
                questionSpec={rcafAssessmentQuestionsV2[3]}
                questionNumber={4}
                scoreSubtext="(if greater than 9, write 9)"
                supportingText={DISCIPLINARY_RECORD_SUPPORTING_TEXT}
              >
                <TextboxWithHeader
                  header={"List disciplinaries:"}
                  name={"q4NotesFormatted"}
                />
              </ScoredAssessmentQuestion>
            </ClassificationFormPage>
          </PrintablePage>
          <PrintablePage stretchable>
            <ClassificationFormPage>
              <ScoredAssessmentQuestion
                questionSpec={rcafAssessmentQuestionsV2[4]}
                scoreSubtext="(if greater than 33, write 33)"
                questionNumber={5}
                supportingText={DISCIPLINARY_RECORD_SUPPORTING_TEXT}
              >
                <TextboxWithHeader
                  header={"List disciplinaries:"}
                  name={"q5NotesFormatted"}
                />
              </ScoredAssessmentQuestion>
              <ScoredAssessmentQuestion
                questionSpec={rcafAssessmentQuestionsV2[5]}
                questionNumber={6}
                supportingText={AGE_SUPPORTING_TEXT}
              />
              <ScoredAssessmentQuestion
                questionSpec={rcafAssessmentQuestionsV2[6]}
                questionNumber={7}
                supportingText={PROGRAM_COMPLETION_SUPPORTING_TEXT}
              >
                <TextboxWithHeader
                  header={"List completed programs:"}
                  name={"q7Notes"}
                />
              </ScoredAssessmentQuestion>
              <TotalScore
                score={derivedData.totalScore}
                lowUpper={RCAF_LOW_UPPER_THRESHOLD_V2}
                mediumUpper={RCAF_MEDIUM_UPPER_THRESHOLD_V2}
              />
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
