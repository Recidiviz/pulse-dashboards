/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import * as React from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../../../components/StoreProvider";
import { Client } from "../../../../WorkflowsStore";
import { downloadSingle } from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";
import { connectComponentToOpportunityForm } from "../../OpportunityFormContext";
import { DIMENSIONS_PX } from "../../PDFFormGenerator";
import { useResizeForm } from "../../utils";
import { FORM_US_ID_EARLY_DISCHARGE_FORM_FONT_FAMILY } from "./FormComponents";
import { FormCrimeTable } from "./FormCrimeTable";
import { FormFeesTable } from "./FormFeesTable";
import FormHeading from "./FormHeading";
import { FormLsirTable } from "./FormLsirTable";
import FormPrompts from "./FormPrompts";
import { FormStaticContent } from "./FormStaticContent";
import { FormSummarySection } from "./FormSummarySection";

const FORM_LINE_HEIGHT = 1.0;

const FormPage = styled.div`
  font-family: ${FORM_US_ID_EARLY_DISCHARGE_FORM_FONT_FAMILY};
  line-height: ${FORM_LINE_HEIGHT};
  display: flex;
  flex-direction: column;
  font-size: 14pt;
  color: black;
  background-color: white;
  box-sizing: content-box;

  min-height: ${rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  padding: ${rem(54)} ${rem(72)};

  & > * {
    margin-bottom: 2rem;
  }
`;

const formDownloader = async (client: Client): Promise<void> => {
  const contents = {
    ...toJS(
      client.verifiedOpportunities.earnedDischarge?.form?.prepareDataForTemplate()
    ),
  };

  await downloadSingle(
    `${client.displayName} Earned Discharge Application.docx`,
    client.stateCode,
    "earned_discharge_template.docx",
    contents,
    client.rootStore.getTokenSilently
  );
};

const Form = observer(function FormEarnedDischarge() {
  const {
    workflowsStore: { selectedClient: client },
  } = useRootStore();
  const opportunity = client?.verifiedOpportunities?.earnedDischarge;

  if (!opportunity) {
    return null;
  }

  return (
    <FormContainer
      heading="Earned Discharge"
      agencyName="IDOC"
      downloadButtonLabel="Download .DOCX"
      onClickDownload={async () => formDownloader(client)}
      opportunity={opportunity}
    >
      <FormPrompts opportunity={opportunity} />
      <FormPage>
        <FormHeading />
        <FormSummarySection />
        <FormCrimeTable />
        <FormFeesTable />
        <FormLsirTable />
        <FormStaticContent />
      </FormPage>
    </FormContainer>
  );
});

export const FormEarnedDischarge = connectComponentToOpportunityForm(
  Form,
  "earnedDischarge"
);
