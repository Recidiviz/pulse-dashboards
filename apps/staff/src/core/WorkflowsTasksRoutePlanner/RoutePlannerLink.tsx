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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components";

import { useRootStore } from "../../components/StoreProvider";
import { workflowsUrl } from "../views";
import { TasksCaption } from "../WorkflowsTasks/styles";

const TasksDescriptionText = styled(TasksCaption)`
  margin-top: ${rem(spacing.sm)};
`;

export function RoutePlannerLink() {
  const { analyticsStore } = useRootStore();

  return (
    <TasksDescriptionText>
      Heading out for contacts?{" "}
      <Link
        to={workflowsUrl("tasksRoutePlanner")}
        onClick={() => {
          analyticsStore.trackTasksNavigateToRoutePlannerLinkClicked();
        }}
      >
        Try using our Home Contact Route Planner →
      </Link>
    </TasksDescriptionText>
  );
}
