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
import React from "react";

import { Opportunity } from "../../WorkflowsStore";
import { UsTnReclassificationReviewForm } from "../../WorkflowsStore/Opportunity/Forms/UsTnReclassificationReviewForm";
import { Resident } from "../../WorkflowsStore/Resident";
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

  if (!(resident instanceof Resident)) {
    return <div />;
  }

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

    downloadZipFile(
      `${resident.displayName} - Reclassification Packet.zip`,
      documents,
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
