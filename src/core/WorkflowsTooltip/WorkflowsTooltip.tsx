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

import { ReactComponent as TealStar } from "../../assets/static/images/tealStar.svg";
import useHydrateOpportunities from "../../hooks/useHydrateOpportunities";
import { Client, isClient, JusticeInvolvedPerson } from "../../WorkflowsStore";
import {
  TooltipContainer,
  TooltipSection,
  TooltipSectionHeader,
} from "../sharedComponents";
import { OpportunitiesSection } from "./OpportunitiesSection";
import { SectionDetails, WorkflowsTooltipRow } from "./styles";

const MilestonesSection: React.FC<{
  milestones: Client["congratulationsMilestones"];
}> = ({ milestones }) => {
  if (!milestones.length) return null;
  return (
    <TooltipSection>
      <TooltipSectionHeader>Milestones</TooltipSectionHeader>
      {milestones.map((m) => (
        <WorkflowsTooltipRow key={m.type}>
          <TealStar height="16" width="16" />
          <SectionDetails>{m.text}</SectionDetails>
        </WorkflowsTooltipRow>
      ))}
    </TooltipSection>
  );
};

const TooltipDetails: React.FC<{ person: JusticeInvolvedPerson }> = ({
  person,
}) => {
  return (
    <TooltipContainer>
      {isClient(person) && (
        <MilestonesSection milestones={person.congratulationsMilestones} />
      )}
      <OpportunitiesSection person={person} includeStarIcon />
    </TooltipContainer>
  );
};

type WorkflowsTooltipProps = {
  person: JusticeInvolvedPerson;
  children: React.ReactElement;
};

export const WorkflowsTooltip: React.FC<WorkflowsTooltipProps> = ({
  person,
  children,
}) => {
  useHydrateOpportunities(person);

  return (
    <TooltipTrigger contents={<TooltipDetails person={person} />}>
      {children}
    </TooltipTrigger>
  );
};
