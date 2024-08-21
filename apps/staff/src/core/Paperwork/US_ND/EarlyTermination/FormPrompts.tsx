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
import * as React from "react";

import { useRootStore } from "../../../../components/StoreProvider";
import {
  Client,
  UsNdEarlyTerminationReferralRecord,
} from "../../../../WorkflowsStore";
import { Prompt } from "../../FormPrompt";

const getMetadataPrompts = (
  client?: Client,
  metadata: Partial<UsNdEarlyTerminationReferralRecord["metadata"]> = {},
): React.ReactChild[] => {
  const prompts = [];
  if (metadata.outOfState) {
    prompts.push(
      <Prompt key="outOfState">
        This case is eligible for early termination. Please send a request to
        the sending state for early termination via ICOTS.
      </Prompt>,
    );
  }
  if (metadata.ICOut) {
    prompts.push(
      <Prompt key="ICOut">
        This case is eligible for early termination. Please contact receiving
        state for early termination consideration.
      </Prompt>,
    );
  }
  if (metadata.multipleSentences) {
    prompts.push(
      <Prompt key="multipleSentences">
        {client?.displayName} has multiple sentences that are eligible for Early
        Termination. Fill out additional forms for other sentences.
      </Prompt>,
    );
  }
  return prompts;
};

const FormPrompts: React.FC<React.HTMLAttributes<HTMLElement>> = (
  props: React.HTMLAttributes<HTMLElement>,
) => {
  const { workflowsStore } = useRootStore();

  const client = workflowsStore.selectedClient;
  const earlyTermination = client?.verifiedOpportunities?.earlyTermination;

  if (!earlyTermination) return null;

  const { metadata } = earlyTermination;

  return <section {...props}>{getMetadataPrompts(client, metadata)}</section>;
};

export default observer(FormPrompts);
