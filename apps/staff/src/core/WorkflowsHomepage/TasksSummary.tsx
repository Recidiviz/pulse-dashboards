// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { uniq } from "lodash";
import { observer } from "mobx-react-lite";
import simplur from "simplur";

import { SupervisionTask } from "../../WorkflowsStore";
import { workflowsUrl } from "../views";
import { WorkflowsHomepageSummary } from "./WorkflowsHomepageSummary";

export const TasksSummary = observer(function TasksSummary({
  tasks,
}: {
  tasks: SupervisionTask[];
}) {
  const numTasks = tasks.length;
  const people = uniq(tasks.map((task) => task.person));
  const headerText = simplur`${people.length} [client has|clients have] tasks with overdue or upcoming due dates`;

  const numOverdue = tasks.filter((task) => task.isOverdue).length;
  const reviewStatusCounts = {
    "Overdue Tasks": numOverdue,
    "Upcoming Tasks": numTasks - numOverdue,
  };

  return (
    <WorkflowsHomepageSummary
      key={"supervision-tasks"}
      url={workflowsUrl("tasks")}
      headerText={headerText}
      totalCount={numTasks}
      people={people}
      reviewStatusCounts={reviewStatusCounts}
      showZeroGrantsPill={false}
    />
  );
});
