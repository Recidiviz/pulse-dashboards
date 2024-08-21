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
