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

import styled from "styled-components/macro";

import { CaseloadSelect } from "../CaseloadSelect";
import ModelHydrator from "../ModelHydrator";
import { Heading } from "../sharedComponents";
import { TasksDescription } from "../WorkflowsTasks/TasksDescription";
import { RoutePlannerClients } from "./RoutePlannerClients";
import { RoutePlannerPresenter } from "./RoutePlannerPresenter";

const RoutePlannerSelectContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export const RoutePlannerClientSelect = ({
  presenter,
}: {
  presenter: RoutePlannerPresenter;
}) => {
  return (
    <RoutePlannerSelectContainer>
      <CaseloadSelect />
      <Heading>Home contact route planner</Heading>
      <TasksDescription>
        To plan your home visit trips, select people below.
      </TasksDescription>
      <ModelHydrator hydratable={presenter.clientsPresenter}>
        <RoutePlannerClients presenter={presenter.clientsPresenter} />
      </ModelHydrator>
    </RoutePlannerSelectContainer>
  );
};
