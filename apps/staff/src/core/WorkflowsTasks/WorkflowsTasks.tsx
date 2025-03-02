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

import {
  palette,
  Pill,
  Sans14,
  Serif34,
  spacing,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import simplur from "simplur";
import styled, { FlattenSimpleInterpolation } from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { pluralizeWord } from "../../utils";
import { SupervisionNeedType } from "../../WorkflowsStore";
import { CaseloadTasksPresenter } from "../../WorkflowsStore/presenters/CaseloadTasksPresenter";
import { CaseloadSelect } from "../CaseloadSelect";
import { CaseloadTasksHydrator } from "../TasksHydrator/TasksHydrator";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import WorkflowsResults from "../WorkflowsResults";
import { AllTasksView } from "./AllTasksView";
import { TASK_SELECTOR_LABELS } from "./fixtures";
import { NeedListItem } from "./ListItem";
import { TaskFilterDropdown } from "./TaskFilterDropdown";
import { TaskPreviewModal } from "./TaskPreviewModal";
import { TasksCalendarView } from "./TasksCalendarView";

const TasksHeader = styled(Serif34)`
  color: ${palette.pine2};
  margin-bottom: ${rem(spacing.md)};
`;

const Caption = styled(Sans14)`
  color: ${palette.slate70};
`;

const TasksDescription = styled(Caption)`
  margin-bottom: ${rem(spacing.lg)};
`;

const TaskCategoryPill = styled(Pill).attrs({
  color: palette.slate10,
})`
  cursor: pointer;
  color: ${palette.slate85};
`;

const TaskCategories = styled.div`
  display: flex;
  flex-wrap: wrap;
  row-gap: ${rem(spacing.sm)};
`;

const TaskAggregateCount = styled.span`
  color: ${palette.signal.links};
`;

const Divider = styled.hr`
  margin: ${rem(spacing.md)} 0;
  height: 1px;
  border: none;
  background-color: ${palette.slate20};
`;

export const TaskDueDate = styled.div<{
  overdue: boolean;
  font: FlattenSimpleInterpolation;
  marginLeft?: string;
  isMobile?: boolean;
}>`
  ${({ font }) => font}
  color: ${({ overdue }) => (overdue ? palette.signal.error : palette.slate70)};
  margin-left: ${({ marginLeft = "auto" }) => marginLeft};
  ${({ isMobile }) => isMobile && `font-size: ${rem(12)} !important;`}
`;

type NeedsViewProps = {
  type: SupervisionNeedType;
};

// This component is not currently in use since we aren't showing any needs,
// but I do not want to delete it since we may add new ones
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AllNeedsView: React.FC<NeedsViewProps> = observer(
  function AllNeedsViewComponent({ type }) {
    const {
      workflowsStore: { workflowsTasksStore: store },
    } = useRootStore();

    return (
      <>
        <Divider />
        {store.orderedPersonsByNeed[type].map((person) => (
          <NeedListItem person={person} key={person.recordId} />
        ))}
      </>
    );
  },
);

function getViewElement(presenter: CaseloadTasksPresenter) {
  switch (presenter.selectedTaskCategory) {
    case "employmentNeed":
      return null;
    case "DUE_THIS_MONTH":
      return <AllTasksView presenter={presenter} />;
    default:
      return <TasksCalendarView presenter={presenter} />;
  }
}

const WorkflowsTasksWithPresenter = observer(
  function WorkflowsTasksWithPresenter({
    presenter,
  }: {
    presenter: CaseloadTasksPresenter;
  }) {
    const {
      workflowsStore: {
        justiceInvolvedPersonTitle,
        selectedSearchIds,
        workflowsSearchFieldTitle,
      },
    } = useRootStore();

    const empty = (
      <WorkflowsResults
        callToActionText={simplur`None of the ${justiceInvolvedPersonTitle}s on the selected ${[
          selectedSearchIds.length,
        ]} ${pluralizeWord(
          workflowsSearchFieldTitle,
          selectedSearchIds.length,
        )}['s|'] caseloads have any tasks. Search for another ${workflowsSearchFieldTitle}.`}
      />
    );

    const initial = (
      <WorkflowsResults
        headerText="Tasks"
        callToActionText="Search for officers above to review clients who have upcoming or overdue tasks."
      />
    );

    return (
      <WorkflowsNavLayout>
        <CaseloadSelect />
        <CaseloadTasksHydrator
          initial={initial}
          empty={empty}
          hydrated={
            <>
              <TasksHeader>Tasks</TasksHeader>
              <TasksDescription>
                The clients below might have upcoming requirements this month.
                <TaskFilterDropdown presenter={presenter} />
              </TasksDescription>

              <TaskCategories>
                {presenter.displayedTaskCategories.map((category) => {
                  return (
                    <TaskCategoryPill
                      key={category}
                      filled={category === presenter.selectedTaskCategory}
                      onClick={() =>
                        presenter.toggleSelectedTaskCategory(category)
                      }
                    >
                      <Caption>
                        {TASK_SELECTOR_LABELS[category]}{" "}
                        <TaskAggregateCount>
                          {presenter.countForCategory(category)}
                        </TaskAggregateCount>
                      </Caption>
                    </TaskCategoryPill>
                  );
                })}
              </TaskCategories>

              {getViewElement(presenter)}
              <TaskPreviewModal />
            </>
          }
        />
      </WorkflowsNavLayout>
    );
  },
);

const WorkflowsTasks = React.memo(function WorkflowsTasks() {
  const { workflowsStore, analyticsStore, tenantStore } = useRootStore();

  return (
    <WorkflowsTasksWithPresenter
      presenter={
        new CaseloadTasksPresenter(workflowsStore, tenantStore, analyticsStore)
      }
    />
  );
});

export { WorkflowsTasks };
