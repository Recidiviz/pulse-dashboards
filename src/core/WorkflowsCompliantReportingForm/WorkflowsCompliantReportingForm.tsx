// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { Client } from "../../WorkflowsStore";
import { FormContainer } from "../Paperwork/FormContainer";
import FormViewer from "../Paperwork/FormViewer";
import {
  connectComponentToOpportunityForm,
  useOpportunityFormContext,
} from "../Paperwork/OpportunityFormContext";
import { generate } from "../Paperwork/PDFFormGenerator";
import { PrintablePage } from "../Paperwork/styles";
import FormCR3947Rev0518 from "../Paperwork/US_TN";

const formDownloader = async (
  fileName: string,
  client: Client,
  formContents: HTMLElement
) => {
  return generate(formContents, `${PrintablePage}`).then((pdf: jsPDF) => {
    pdf.save(fileName);
  });
};

const WorkflowsCompliantReportingForm: React.FC = () => {
  const {
    workflowsStore: { selectedClient: client },
  } = useRootStore();

  const form = useOpportunityFormContext();

  return (
    <FormContainer
      heading="Compliant Reporting"
      agencyName="TDOC"
      downloadButtonLabel={form.downloadText}
      onClickDownload={async () => form.download()}
      opportunity={form.opportunity}
    >
      <FormViewer
        fileName={`${client?.displayName} - Form CR3947 Rev05-18.pdf`}
        formDownloader={formDownloader}
      >
        <FormCR3947Rev0518 />
      </FormViewer>
    </FormContainer>
  );
};

export default connectComponentToOpportunityForm(
  observer(WorkflowsCompliantReportingForm),
  "compliantReporting"
);
