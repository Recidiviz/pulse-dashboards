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
import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import {
  SupervisionTask,
  SupervisionTaskType,
} from "../../WorkflowsStore/Task/types";
import {
  TooltipContainer,
  TooltipRow,
  TooltipSection,
  TooltipSectionDetails,
  TooltipSectionHeader,
} from "../sharedComponents";
import { TasksOpportunitiesSection } from "./TasksOpportunitiesSection";

type TooltipDetailsProps = {
  person: JusticeInvolvedPerson;
  tasks: SupervisionTask<SupervisionTaskType>[];
};

const TasksSection: React.FC<{
  tasks: SupervisionTask<SupervisionTaskType>[];
}> = ({ tasks }) => {
  if (tasks.length === 0) return null;

  return (
    <TooltipSection>
      <TooltipSectionHeader>Tasks</TooltipSectionHeader>
      {tasks.map((t) => (
        <TooltipRow justifyContent="space-between" key={t.key}>
          <TooltipSectionDetails>{t.displayName}</TooltipSectionDetails>
          <TooltipSectionDetails overdue={t.isOverdue}>
            {t.dueDateDisplayShort}
          </TooltipSectionDetails>
        </TooltipRow>
      ))}
    </TooltipSection>
  );
};

const NEED_TEXT = {
  employmentNeed: "Unemployed",
};

const NeedsSection: React.FC<{ person: JusticeInvolvedPerson }> = observer(
  function NeedsSection({ person }) {
    const needs = person.supervisionTasks?.needs ?? [];
    if (needs.length === 0) {
      return null;
    }

    return (
      <TooltipSection>
        <TooltipSectionHeader>Needs</TooltipSectionHeader>
        {needs.map((n) => (
          <TooltipSectionDetails key={n.type}>
            {NEED_TEXT[n.type]}
          </TooltipSectionDetails>
        ))}
      </TooltipSection>
    );
  },
);

const PersonSection: React.FC<{ person: JusticeInvolvedPerson }> = ({
  person,
}) => {
  return (
    <TooltipSection>
      <TooltipSectionHeader>{person.displayName}</TooltipSectionHeader>
    </TooltipSection>
  );
};

const TooltipDetails: React.FC<TooltipDetailsProps> = ({ person, tasks }) => {
  return (
    <TooltipContainer>
      <PersonSection person={person} />
      <TasksOpportunitiesSection person={person} />
      <TasksSection tasks={tasks} />
      <NeedsSection person={person} />
    </TooltipContainer>
  );
};

type TaskClientTooltipProps = {
  person: JusticeInvolvedPerson;
  tasks: SupervisionTask<SupervisionTaskType>[];
  children: React.ReactElement;
  displayOnMobile?: boolean;
};

export const TaskListTooltip: React.FC<TaskClientTooltipProps> = observer(
  function TaskListTooltip({
    person,
    tasks,
    children,
    displayOnMobile = false,
  }) {
    useHydrateOpportunities(person);

    const { isMobile } = useIsMobile(true);

    const shouldDisplayTooltip = displayOnMobile || !isMobile;

    return (
      <TooltipTrigger
        contents={
          shouldDisplayTooltip && (
            <TooltipDetails person={person} tasks={tasks} />
          )
        }
      >
        {children}
      </TooltipTrigger>
    );
  },
);
