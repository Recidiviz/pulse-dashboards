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

import { runInAction, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";

import {
  Opportunity,
  UsTnInitialClassificationOpportunity,
} from "../../WorkflowsStore";
import { UsTnReclassificationReviewForm } from "../../WorkflowsStore/Opportunity/Forms/UsTnReclassificationReviewForm";
import { Resident } from "../../WorkflowsStore/Resident";
import { DialogModal, DialogView, ModalText } from "../DialogModal";
import {
  DocxTemplateFormContents,
  FileGeneratorArgs,
  renderMultipleDocx,
} from "../Paperwork/DOCXFormGenerator";
import { FormContainer } from "../Paperwork/FormContainer";
import FormViewer from "../Paperwork/FormViewer";
import ClassificationCustodyAssessment from "../Paperwork/US_TN/CustodyReclassification/ClassificationCustodyAssessment";
import { downloadZipFile } from "../Paperwork/utils";

const WorkflowsUsTnReclassForm = ({
  opportunity,
}: {
  opportunity: Opportunity;
}) => {
  const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;
  const form = opportunity.form as UsTnReclassificationReviewForm;
  const resident = opportunity.person;
  const [showCafScoresModal, setShowCafScoresModal] = useState(true);
  if (!(resident instanceof Resident)) {
    return <div />;
  }

  const isInitialClassification =
    opportunity instanceof UsTnInitialClassificationOpportunity;
  const packetName = isInitialClassification
    ? "Classification Packet"
    : "Reclassification Packet";
  const dataProviso = isInitialClassification
    ? "Please fill in questions 3 and 4 in the Classification Assessment form and, if applicable, fill in Schedule B."
    : "Please review any data pre-filled from previous Classification scores for questions 3, 4, 5 and 9 in the Classification Assessment Form.";

  const onClickDownload = async () => {
    let contents: DocxTemplateFormContents;

    const { derivedData } = form;

    // we are not mutating any observables here, just telling Mobx not to track this access
    runInAction(() => {
      contents = {
        ...toJS(derivedData),
      };
    });

    const fileInputs: FileGeneratorArgs[] = [
      ["custody_reclassification_template", "Offender Classification Summary"],
      [
        "classification_pilot_verification_template",
        "Classification Pilot Verification",
      ],
    ].map(([filename, outputName]) => {
      return [
        `${resident.displayName} - ${outputName}.docx`,
        resident.stateCode,
        `${filename}.docx`,
        contents,
      ];
    });

    const documents = await renderMultipleDocx(
      fileInputs,
      resident.rootStore.getTokenSilently,
    );

    downloadZipFile(`${resident.displayName} - ${packetName}.zip`, documents);
  };

  return (
    <FormContainer
      heading={packetName}
      agencyName="TDOC"
      dataProviso={dataProviso}
      downloadButtonLabel={form.downloadText}
      onClickDownload={async () => onClickDownload()}
      opportunity={form.opportunity}
    >
      <DialogModal isOpen={showCafScoresModal}>
        <DialogView
          title="About CAF Scores"
          onSubmit={() => setShowCafScoresModal(false)}
          isSubmitDisabled={false}
          submitButtonText="Got it"
        >
          <ModalText
            style={{
              textAlign: "justify",
            }}
          >
            <b>For questions 3, 4, 5 and 9</b> Recidiviz is auto-filling scores
            from this resident's <b>last completed CAF</b> directly from eTOMIS.
            <br />
            <br />
            <b>For questions 1, 2, 6, 7 and 8</b> Recidiviz is auto-filling
            scores based on any{" "}
            <b>changes to the resident's disciplinary record</b> using data from
            eTOMIS.
          </ModalText>
        </DialogView>
      </DialogModal>
      <FormViewer formRef={formRef}>
        <ClassificationCustodyAssessment />
      </FormViewer>
    </FormContainer>
  );
};

export default observer(WorkflowsUsTnReclassForm);
