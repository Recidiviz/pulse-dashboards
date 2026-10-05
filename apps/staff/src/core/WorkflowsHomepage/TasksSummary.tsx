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

import { isThisMonth } from "date-fns";
import { uniq } from "lodash";
import { observer } from "mobx-react-lite";
import simplur from "simplur";

import { useRootStore } from "../../components/StoreProvider";
import { SupervisionTask } from "../../WorkflowsStore";
import { workflowsUrl } from "../views";
import { WorkflowsHomepageSummary } from "./WorkflowsHomepageSummary";

export const TasksSummary = observer(function TasksSummary({
  tasks,
  countsUnavailable = false,
}: {
  tasks: SupervisionTask[];
  /**
   * Render the card with no numbers on it. Set under the Typesense homepage
   * gate, where the caseload this counts from is empty by design. The link
   * still has to work, so only the count goes.
   *
   * TODO(OBT-52494): the whole prop is temporary — it exists only while tasks
   * still derive from a caseload the homepage no longer fetches.
   */
  countsUnavailable?: boolean;
}) {
  const {
    tenantStore: { currentTenantId },
  } = useRootStore();
  const numTasks = tasks.length;
  const people = uniq(tasks.map((task) => task.person));
  const headerText = countsUnavailable
    ? "Clients with tasks due"
    : simplur`${people.length} [client has|clients have] tasks with overdue or upcoming due dates`;

  const numOverdue = tasks.filter((task) => task.isOverdue).length;
  const numDueThisMonth = tasks.filter(
    (t) => !t.isOverdue && isThisMonth(t.dueDate),
  ).length;

  // Each entry renders only above zero, so an empty map removes the row with no
  // change to WorkflowsHomepageSummary.
  function buildReviewStatusCounts(): Record<string, number> {
    // TODO(OBT-52494): drops every per-status row under the gate.
    if (countsUnavailable) return {};
    if (currentTenantId === "US_NE") {
      return {
        "Overdue Tasks": numOverdue,
        "Tasks Due This Month": numDueThisMonth,
      };
    }
    return {
      "Overdue Tasks": numOverdue,
      "Upcoming Tasks": numTasks - numOverdue,
    };
  }
  const reviewStatusCounts = buildReviewStatusCounts();

  return (
    <WorkflowsHomepageSummary
      key={"supervision-tasks"}
      url={workflowsUrl("tasks")}
      headerText={headerText}
      // TODO(OBT-52494): zero and empty suppress the count and the avatars.
      // They are not real values — the caseload behind them was never fetched.
      totalCount={countsUnavailable ? 0 : people.length}
      people={countsUnavailable ? [] : people}
      reviewStatusCounts={reviewStatusCounts}
      showZeroGrantsPill={false}
    />
  );
});
