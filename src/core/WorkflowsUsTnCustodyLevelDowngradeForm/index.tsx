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
import jsPDF from "jspdf";
import { observer } from "mobx-react-lite";
import React from "react";

import { useRootStore } from "../../components/StoreProvider";
import { FormContainer } from "../Paperwork/FormContainer";
import FormViewer from "../Paperwork/FormViewer";
import {
  connectComponentToOpportunityForm,
  useOpportunityFormContext,
} from "../Paperwork/OpportunityFormContext";
import { generate } from "../Paperwork/PDFFormGenerator";
import { PrintablePage } from "../Paperwork/styles";
import ClassificationCustodyAssessment from "../Paperwork/US_TN/CustodyLevelDowngrade/ClassificationCustodyAssessment";

const WorkflowsUsTnCustodyLevelDowngradeForm: React.FC = () => {
  const {
    workflowsStore: { selectedPerson: person },
  } = useRootStore();

  const form = useOpportunityFormContext();

  const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;

  const onClickDownload = async () => {
    return generate(formRef.current, `${PrintablePage}`).then((pdf: jsPDF) => {
      pdf.save(`${person?.displayName} - Classification Assessment Form.pdf`);
    });
  };

  return (
    <FormContainer
      heading="Classification Assessment Form"
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

export default connectComponentToOpportunityForm(
  observer(WorkflowsUsTnCustodyLevelDowngradeForm),
  "usTnCustodyLevelDowngrade"
);
