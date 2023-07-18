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
import { TooltipTrigger } from "@recidiviz/design-system";
import React from "react";
import styled from "styled-components/macro";

import { ReactComponent as TealStar } from "../../assets/static/images/tealStar.svg";
import useHydrateOpportunities from "../../hooks/useHydrateOpportunities";
import { Client } from "../../WorkflowsStore";
import {
  TooltipContainer,
  TooltipRow,
  TooltipSection,
  TooltipSectionDetails,
  TooltipSectionHeader,
} from "../sharedComponents";
import { OpportunitiesSection } from "../WorkflowsTasks/WorkflowsTasksTooltip";

const MilestonesTooltipRow = styled(TooltipRow)`
  justify-content: flex-start;
  padding: 0.25rem 0;
  align-items: center;
`;

const SectionDetails = styled(TooltipSectionDetails)`
  padding: 0 0 0 0.5rem;
`;

const MilestonesSection: React.FC<{
  milestones: Client["congratulationsMilestones"];
}> = ({ milestones }) => {
  if (!milestones) return null;
  return (
    <TooltipSection>
      <TooltipSectionHeader>Milestones</TooltipSectionHeader>
      {milestones.map((m) => (
        <MilestonesTooltipRow key={m.type}>
          <TealStar height="16" width="16" />
          <SectionDetails>{m.text}</SectionDetails>
        </MilestonesTooltipRow>
      ))}
    </TooltipSection>
  );
};

const TooltipDetails: React.FC<{ client: Client }> = ({ client }) => {
  return (
    <TooltipContainer>
      <MilestonesSection milestones={client.congratulationsMilestones} />
      <OpportunitiesSection person={client} />
    </TooltipContainer>
  );
};

type MilestonesTooltipProps = {
  client: Client;
  children: React.ReactElement;
};

export const MilestonesTooltip: React.FC<MilestonesTooltipProps> = ({
  client,
  children,
}) => {
  useHydrateOpportunities(client);

  return (
    <TooltipTrigger contents={<TooltipDetails client={client} />}>
      {children}
    </TooltipTrigger>
  );
};
