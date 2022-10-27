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
import { palette } from "@recidiviz/design-system";
import jsPDF from "jspdf";
import React from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { Client } from "../../WorkflowsStore";
import { FormLastEdited } from "../FormLastEdited";
import FormViewer from "../Paperwork/FormViewer";
import { connectComponentToOpportunityForm } from "../Paperwork/OpportunityFormContext";
import { generate } from "../Paperwork/PDFFormGenerator";
import { FormViewerStatus, PrintablePage } from "../Paperwork/styles";
import FormCR3947Rev0518 from "../Paperwork/US_TN";

const CompliantReportingFormContainer = styled.div`
  background-color: ${palette.pine2};
  border-left: 1px solid ${palette.slate20};
  height: 100%;
`;

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

  return (
    <CompliantReportingFormContainer>
      <FormViewer
        fileName={`${client?.displayName} - Form CR3947 Rev05-18.pdf`}
        statuses={[
          <FormViewerStatus color={palette.slate85}>
            Edit and collaborate on the document below
          </FormViewerStatus>,
          <FormViewerStatus color={palette.slate85}>
            <FormLastEdited
              agencyName="TDOC"
              form={client?.opportunities.compliantReporting?.form}
            />
          </FormViewerStatus>,
        ]}
        formDownloader={formDownloader}
      >
        <FormCR3947Rev0518 />
      </FormViewer>
    </CompliantReportingFormContainer>
  );
};

export default connectComponentToOpportunityForm(
  WorkflowsCompliantReportingForm,
  "compliantReporting"
);
