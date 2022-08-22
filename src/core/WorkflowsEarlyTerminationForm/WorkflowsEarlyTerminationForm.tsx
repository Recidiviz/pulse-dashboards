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
import { observer } from "mobx-react-lite";
import moment from "moment";
import * as React from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import FormViewer from "../Paperwork/FormViewer";
import { FormViewerStatus } from "../Paperwork/styles";
import FormEarlyTermination from "../Paperwork/US_ND/EarlyTermination/FormEarlyTermination";

const EarlyTerminationFormContainer = styled.div`
  background-color: ${palette.pine1};
  border-left: 1px solid ${palette.slate20};
  height: 100%;
`;

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
      <>
        <FormViewer
          fileName={`${client?.displayName} - Form SFN 9281.pdf`}
          statuses={[lastEdited]}
        >
          <FormEarlyTermination />
        </FormViewer>
      </>
    </EarlyTerminationFormContainer>
  );
};

export default observer(WorkflowsEarlyTerminationForm);
