import { Icon, palette, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem, transparentize } from "polished";
import * as React from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../../../components/StoreProvider";
import {
  Client,
  TransformedEarlyTerminationReferral,
} from "../../../../WorkflowsStore";

const PromptElement = styled.div`
  background-color: ${transparentize(0.9, palette.signal.highlight)};
  ${typography.Sans16}

  color: white;
  border-radius: ${rem(spacing.sm)};
  width: 100%;
  margin-bottom: ${rem(spacing.md)};
  padding: ${rem(spacing.md)};
`;

const Prompt: React.FC = ({ children }) => {
  return (
    <PromptElement>
      <Icon size={14} kind="Info" /> {children}
    </PromptElement>
  );
};

const getMetadataPrompts = (
  client?: Client,
  metadata: Partial<TransformedEarlyTerminationReferral["metadata"]> = {}
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
  const metadata = client?.earlyTerminationMetadata;

  return <section {...props}>{getMetadataPrompts(client, metadata)}</section>;
};

export default observer(FormPrompts);
