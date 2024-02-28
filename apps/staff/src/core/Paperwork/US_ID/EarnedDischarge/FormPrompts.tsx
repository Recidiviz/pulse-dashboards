import { observer } from "mobx-react-lite";
import { rem } from "polished";
import * as React from "react";
import styled from "styled-components/macro";

import { EarnedDischargeOpportunity } from "../../../../WorkflowsStore";
import { Prompt } from "../../FormPrompt";

interface FormPromptsProps extends React.HTMLAttributes<HTMLElement> {
  opportunity: EarnedDischargeOpportunity;
}

const FormPromptsSection = styled.section`
  margin-top: -${rem(32)};
`;

const FormPrompts: React.FC<FormPromptsProps> = ({ opportunity, ...props }) => {
  const client = opportunity.person;

  if (!client) {
    return null;
  }

  const prompts = [];

  if (client.supervisionType === "DUAL") {
    prompts.push(
      <Prompt key="dualSupervision">
        {client?.displayName} is on dual supervision. Download and fill out
        additional forms for other active sentences.
      </Prompt>,
    );
  }
  return <FormPromptsSection {...props}>{prompts}</FormPromptsSection>;
};

export default observer(FormPrompts);
