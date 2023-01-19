import { observer } from "mobx-react-lite";
import * as React from "react";

import { useRootStore } from "../../../../components/StoreProvider";
import {
  Client,
  EarlyTerminationReferralRecord,
} from "../../../../WorkflowsStore";
import { Prompt } from "../../FormPrompt";

const getMetadataPrompts = (
  client?: Client,
  metadata: Partial<EarlyTerminationReferralRecord["metadata"]> = {}
): React.ReactChild[] => {
  const prompts = [];
  if (metadata.outOfState) {
    prompts.push(
      <Prompt key="outOfState">
        This case is eligible for early termination. Please send a request to
        the sending state for early termination via ICOTS.
      </Prompt>
    );
  }
  if (metadata.ICOut) {
    prompts.push(
      <Prompt key="ICOut">
        This case is eligible for early termination. Please contact receiving
        state for early termination consideration.
      </Prompt>
    );
  }
  if (metadata.multipleSentences) {
    prompts.push(
      <Prompt key="multipleSentences">
        {client?.displayName} has multiple sentences that are eligible for Early
        Termination. Fill out additional forms for other sentences.
      </Prompt>
    );
  }
  return prompts;
};

const FormPrompts: React.FC<React.HTMLAttributes<HTMLElement>> = (
  props: React.HTMLAttributes<HTMLElement>
) => {
  const { workflowsStore } = useRootStore();

  const client = workflowsStore.selectedClient;
  const earlyTermination = client?.verifiedOpportunities?.earlyTermination;

  if (!earlyTermination) return null;

  const { metadata } = earlyTermination;

  return <section {...props}>{getMetadataPrompts(client, metadata)}</section>;
};

export default observer(FormPrompts);
