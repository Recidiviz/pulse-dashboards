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
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import moment from "moment";
import * as React from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { Client } from "../../WorkflowsStore";
import { generate } from "../Paperwork/DOCXFormGenerator";
import FormViewer from "../Paperwork/FormViewer";
import { FormViewerStatus } from "../Paperwork/styles";
import FormEarlyTermination from "../Paperwork/US_ND/EarlyTermination/FormEarlyTermination";
import { REACTIVE_INPUT_UPDATE_DELAY } from "../Paperwork/utils";

const EarlyTerminationFormContainer = styled.div`
  background-color: ${palette.pine1};
  border-left: 1px solid ${palette.slate20};
  height: 100%;
`;

const collectAdditionalDepositionLinesToPrint = (client: Client) => {
  const { earlyTermination } = client.opportunities;
  return earlyTermination?.additionalDepositionLines.map(
    (key) => earlyTermination?.formData[key]
  );
};

const formDownloader = async (
  fileName: string,
  client: Client
): Promise<void> => {
  await new Promise((resolve) =>
    setTimeout(resolve, REACTIVE_INPUT_UPDATE_DELAY)
  );

  const templateUrl = `${process.env.REACT_APP_API_URL}/api/${client.stateCode}/workflows/templates?filename=early_termination_template.docx`;
  const { earlyTermination } = client.opportunities;

  const contents = {
    ...toJS(earlyTermination?.formData),
    additionalDepositionLines: collectAdditionalDepositionLinesToPrint(client),
  };

  await generate(
    fileName,
    templateUrl,
    contents,
    client.rootStore.getTokenSilently
  );
};

const WorkflowsEarlyTerminationForm = () => {
  const { workflowsStore } = useRootStore();

  const client = workflowsStore.selectedClient;

  const draft = client?.earlyTerminationReferralDraft;

  let lastEdited = null;
  if (draft) {
    lastEdited = (
      <FormViewerStatus color={palette.slate85}>
        Last edited by {draft.updated.by}{" "}
        {moment(draft.updated.date.seconds * 1000).fromNow()}
      </FormViewerStatus>
    );
  }

  return (
    <EarlyTerminationFormContainer>
      <FormViewer
        fileName={`${client?.displayName} - Form SFN 9281.docx`}
        statuses={[lastEdited]}
        formDownloader={formDownloader}
      >
        <FormEarlyTermination />
      </FormViewer>
    </EarlyTerminationFormContainer>
  );
};

export default observer(WorkflowsEarlyTerminationForm);
