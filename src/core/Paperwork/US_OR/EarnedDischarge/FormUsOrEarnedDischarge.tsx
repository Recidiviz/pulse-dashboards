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
import { runInAction, toJS } from "mobx";
import { observer } from "mobx-react-lite";
import styled from "styled-components/macro";

import { useRootStore } from "../../../../components/StoreProvider";
import { Client } from "../../../../WorkflowsStore";
import { UsOrEarnedDischargeDraftData } from "../../../../WorkflowsStore/Opportunity/UsOr";
import { FileGeneratorArgs, renderMultipleDocx } from "../../DOCXFormGenerator";
import { FormContainer } from "../../FormContainer";
import { downloadZipFile } from "../../utils";
import p1 from "./assets/p1.png";

const FormPreviewPage = styled.img`
  height: auto;
  width: 100%;
`;

const formDownloader = async (client: Client): Promise<void> => {
  let contents: Partial<UsOrEarnedDischargeDraftData> = {};
  // we are not mutating any observables here, just telling Mobx not to track this access
  runInAction(() => {
    contents = {
      ...toJS(client.verifiedOpportunities.usOrEarnedDischarge?.form?.formData),
    };
  });

  const { sentences } = contents;

  if (!sentences) {
    throw new Error(
      "[Workflows][US_OR] Unable to generate Earned Discharge forms due to missing sentences"
    );
  }

  const fileInputs: FileGeneratorArgs[] = Object.values(sentences).map(
    (sentence) => [
      `${client.displayName} - ${sentence.docket} - EDIS County Review Checklist.docx`,
      client.stateCode,
      "edis_review_checklist.docx",
      { ...contents, ...sentence },
    ]
  );

  const documents = await renderMultipleDocx(
    fileInputs,
    client.rootStore.getTokenSilently
  );

  downloadZipFile(`${client.displayName} EDIS packet.zip`, documents);
};

export const FormUsOrEarnedDischarge = observer(function FormSCCP() {
  const { workflowsStore } = useRootStore();
  const opportunity =
    workflowsStore?.selectedPerson?.verifiedOpportunities?.usOrEarnedDischarge;

  if (!opportunity) {
    return null;
  }

  const client = opportunity.person;

  return (
    <FormContainer
      heading="EDIS Checklist"
      agencyName="ODOC"
      downloadButtonLabel="Download packet"
      onClickDownload={() => formDownloader(client)}
      opportunity={opportunity}
    >
      <FormPreviewPage src={p1} alt="Early Discharge Preview Form" />
    </FormContainer>
  );
});
