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

import { toJS } from "mobx";
import { observer } from "mobx-react-lite";

import { useRootStore } from "../../components/StoreProvider";
import { Client } from "../../WorkflowsStore";
import { downloadSingle } from "../Paperwork/DOCXFormGenerator";
import { FormContainer } from "../Paperwork/FormContainer";
import FormViewer from "../Paperwork/FormViewer";
import {
  connectComponentToOpportunityForm,
  useOpportunityFormContext,
} from "../Paperwork/OpportunityFormContext";
import FormEarlyTermination from "../Paperwork/US_ND/EarlyTermination/FormEarlyTermination";

const collectAdditionalDepositionLinesToDownload = (client: Client) => {
  const { earlyTermination } = client.verifiedOpportunities;
  return earlyTermination?.form?.additionalDepositionLines.map(
    (key) => earlyTermination?.form?.formData[key]
  );
};

const formDownloader = async (
  fileName: string,
  client: Client
): Promise<void> => {
  const { earlyTermination } = client.verifiedOpportunities;

  const contents = {
    ...toJS(earlyTermination?.form?.formData),
    additionalDepositionLines:
      collectAdditionalDepositionLinesToDownload(client),
  };

  await downloadSingle(
    fileName,
    client.stateCode,
    "early_termination_template.docx",
    contents,
    client.rootStore.getTokenSilently
  );
};

function WorkflowsEarlyTerminationForm() {
  const {
    workflowsStore: { selectedClient: client },
  } = useRootStore();

  const form = useOpportunityFormContext();

  return (
    <FormContainer
      heading="Early Termination"
      agencyName="ND DOCR"
      downloadButtonLabel={form.downloadText}
      onClickDownload={async () => form.download()}
      opportunity={form.opportunity}
    >
      <FormViewer
        fileName={`${client?.displayName} - Form SFN 9281.docx`}
        formDownloader={formDownloader}
      >
        <FormEarlyTermination />
      </FormViewer>
    </FormContainer>
  );
}

export default connectComponentToOpportunityForm(
  observer(WorkflowsEarlyTerminationForm),
  "earlyTermination"
);
