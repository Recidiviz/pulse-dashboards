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
import { observer } from "mobx-react-lite";
import React from "react";

import { UsTnAnnualReclassificationReviewForm } from "../../WorkflowsStore/Opportunity/Forms/UsTnAnnualReclassificationReviewForm";
import { downloadSingle } from "../Paperwork/DOCXFormGenerator";
import { FormContainer } from "../Paperwork/FormContainer";
import FormViewer from "../Paperwork/FormViewer";
import { useOpportunityFormContext } from "../Paperwork/OpportunityFormContext";
import ClassificationCustodyAssessment from "../Paperwork/US_TN/CustodyReclassification/ClassificationCustodyAssessment";

const WorkflowsUsTnReclassForm: React.FC = () => {
  const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;
  const form =
    useOpportunityFormContext() as UsTnAnnualReclassificationReviewForm;
  const resident = form.opportunity.person;

  const onClickDownload = async () => {
    const { derivedData } = form;

    const userExternalId = resident.rootStore.userStore.externalId;

    return downloadSingle(
      `${resident.displayName} - Reclassification Packet.docx`,
      resident.stateCode,
      "custody_reclassification_template.docx",
      { ...derivedData, userExternalId },
      resident.rootStore.getTokenSilently,
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
