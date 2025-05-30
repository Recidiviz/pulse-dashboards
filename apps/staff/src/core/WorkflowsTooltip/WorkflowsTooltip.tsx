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

import { TooltipTrigger } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import React from "react";

import useHydrateOpportunities from "../../hooks/useHydrateOpportunities";
import useIsMobile from "../../hooks/useIsMobile";
import { isClient, JusticeInvolvedPerson } from "../../WorkflowsStore";
import { TooltipContainer } from "../sharedComponents";
import { MilestonesSection } from "./MilestonesSection";
import { OpportunitiesSection as WorkflowsOpportunitiesSection } from "./OpportunitiesSection";

export const TooltipDetails: React.FC<{
  person: JusticeInvolvedPerson;
  OpportunitiesSection?: React.FC<{ person: JusticeInvolvedPerson }>;
}> = ({ person, OpportunitiesSection = WorkflowsOpportunitiesSection }) => {
  return (
    <TooltipContainer>
      {isClient(person) && (
        <MilestonesSection milestones={person.congratulationsMilestones} />
      )}
      <OpportunitiesSection person={person} />
    </TooltipContainer>
  );
};

type WorkflowsTooltipProps = {
  person: JusticeInvolvedPerson;
  contents?: React.ReactNode;
  children: React.ReactElement;
  displayOnMobile?: boolean;
};

export const WorkflowsTooltip: React.FC<WorkflowsTooltipProps> = observer(
  function WorkflowsTooltip({
    person,
    contents = <TooltipDetails person={person} />,
    children,
    displayOnMobile = false,
  }) {
    useHydrateOpportunities(person);
    const { isMobile } = useIsMobile(true);

    const shouldDisplayTooltip = displayOnMobile || !isMobile;

    return (
      <TooltipTrigger contents={shouldDisplayTooltip && contents}>
        {children}
      </TooltipTrigger>
    );
  },
);
