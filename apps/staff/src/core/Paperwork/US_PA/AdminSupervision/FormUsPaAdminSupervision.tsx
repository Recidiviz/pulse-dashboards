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
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../../../components/StoreProvider";
import { Client } from "../../../../WorkflowsStore";
import { FormContainer } from "../../FormContainer";
import FormViewer from "../../FormViewer";
import { PrintablePage, PrintablePageMargin } from "../../styles";
import { FORM_US_PA_ADMIN_SUPERVISION_FORM_FONT_FAMILY } from "./constants";
import FormClientDetails from "./FormClientDetails";
import FormHeading from "./FormHeading";

const FormPage = styled.div`
  font-family: ${FORM_US_PA_ADMIN_SUPERVISION_FORM_FONT_FAMILY};
  display: flex;
  flex-direction: column;
  font-size: ${rem(9)};
  color: black;
  background-color: white;
  padding: 0 ${rem(18)};
`;

const formDownloader = async (client: Client): Promise<void> => {
  return;
};

export const FormUsPaAdminSupervision = observer(function FormSCCP() {
  const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;

  const { workflowsStore } = useRootStore();
  const opportunity =
    workflowsStore?.selectedPerson?.verifiedOpportunities?.usPaAdminSupervision;

  if (!opportunity) {
    return null;
  }

  const client = opportunity.person;

  return (
    <FormContainer
      heading="DC-P 402"
      agencyName="PDOC"
      onClickDownload={() => formDownloader(client)}
      opportunity={opportunity}
      downloadButtonLabel="Download DOCX"
    >
      <FormViewer formRef={formRef}>
        <PrintablePageMargin>
          <PrintablePage>
            <FormPage>
              <FormHeading />
              <FormClientDetails />
              There will be a checklist here soon!
            </FormPage>
          </PrintablePage>
        </PrintablePageMargin>
      </FormViewer>
    </FormContainer>
  );
});
