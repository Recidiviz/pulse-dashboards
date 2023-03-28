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
import {
  Sans12,
  Sans14,
  spacing,
  TooltipTrigger,
} from "@recidiviz/design-system";
import { autorun } from "mobx";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React, { useEffect } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import { SupervisionTask } from "../../WorkflowsStore/Task/types";
import { TASK_DISPLAY_NAME } from "./fixtures";

const TooltipContainer = styled.div`
  min-width: 13rem;
  margin: ${rem(spacing.sm)};
`;

const TooltipSection = styled.div`
  &:not(:first-child) {
    padding-top: 1rem;
  }
`;

const SectionHeader = styled(Sans14)`
  color: white;
  padding-bottom: 0.25rem;
`;

type SectionDetailsProps = {
  overdue?: boolean;
};

const SectionDetails = styled(Sans12)<SectionDetailsProps>`
  padding-top: 0.25rem;
  color: ${(p) => (p.overdue ? "rgb(224, 14, 0)" : "rgba(255, 255, 255, 0.7)")};
`;

type TooltipDetailsProps = {
  person: JusticeInvolvedPerson;
  tasks: SupervisionTask[];
};

// TODO: Put these directly on the opportunity classes
const OPPORTUNITY_TEXT = {
  LSU: "transfer to LSU",
  usIdSupervisionLevelDowngrade: "supervision downgrade",
  earnedDischarge: "Earned Discharge",
  pastFTRD: "discharge",
};

const OpportunitiesSection: React.FC<{ person: JusticeInvolvedPerson }> =
  observer(function OpportunitiesSection({ person }) {
    const opportunities = Object.values(person.verifiedOpportunities);
    if (opportunities.length === 0) {
      return null;
    }

    return (
      <TooltipSection>
        <SectionHeader>Opportunities</SectionHeader>
        {opportunities.map((o) => (
          <SectionDetails key={o.type}>{`Eligible for ${
            // @ts-expect-error Only launched in ID, so we only expect those four opps
            OPPORTUNITY_TEXT[o.type]
          }`}</SectionDetails>
        ))}
      </TooltipSection>
    );
  });

const TooltipTaskRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const TasksSection: React.FC<{
  tasks: SupervisionTask[];
}> = ({ tasks }) => {
  if (tasks.length === 0) return null;

  return (
    <TooltipSection>
      <SectionHeader>Tasks</SectionHeader>
      {tasks.map((t) => (
        <TooltipTaskRow key={t.type}>
          <SectionDetails>{TASK_DISPLAY_NAME[t.type]}</SectionDetails>
          <SectionDetails overdue={t.isOverdue}>
            Due {t.dueDateFromToday}
          </SectionDetails>
        </TooltipTaskRow>
      ))}
    </TooltipSection>
  );
};

const NEED_TEXT = {
  employment: "Unemployed",
};

const NeedsSection: React.FC<{ person: JusticeInvolvedPerson }> = observer(
  function NeedsSection({ person }) {
    const needs = person.supervisionTasks?.needs ?? [];
    if (needs.length === 0) {
      return null;
    }

    return (
      <TooltipSection>
        <SectionHeader>Needs</SectionHeader>
        {needs.map((n) => (
          <SectionDetails key={n.type}>{NEED_TEXT[n.type]}</SectionDetails>
        ))}
      </TooltipSection>
    );
  }
);

const PersonSection: React.FC<{ person: JusticeInvolvedPerson }> = observer(
  function PersonSection({ person }) {
    return (
      <TooltipSection>
        <SectionHeader>{person.displayName}</SectionHeader>
      </TooltipSection>
    );
  }
);

const TooltipDetails: React.FC<TooltipDetailsProps> = ({ person, tasks }) => {
  return (
    <TooltipContainer>
      <PersonSection person={person} />
      <OpportunitiesSection person={person} />
      <TasksSection tasks={tasks} />
      <NeedsSection person={person} />
    </TooltipContainer>
  );
};

type TaskClientTooltipProps = {
  person: JusticeInvolvedPerson;
  tasks: SupervisionTask[];
  children: React.ReactElement;
};

export const TaskListTooltip: React.FC<TaskClientTooltipProps> = ({
  person,
  tasks,
  children,
}) => {
  const {
    workflowsStore: { opportunityTypes },
  } = useRootStore();

  // We don't use a full hydrator with an intermediate loading state since we
  // do not want to prevent the rendering of the children components while we
  // fetch opportunity information for use in part of the tooltip. The user
  // will not see any jitter unless they are currently displaying the tooltip
  // for a person with opportunities to load.
  useEffect(
    () =>
      autorun(() => {
        const { potentialOpportunities } = person;
        opportunityTypes.forEach((opportunityType) => {
          potentialOpportunities[opportunityType]?.hydrate();
        });
      }),
    [person, opportunityTypes]
  );

  return (
    <TooltipTrigger contents={<TooltipDetails person={person} tasks={tasks} />}>
      {children}
    </TooltipTrigger>
  );
};
