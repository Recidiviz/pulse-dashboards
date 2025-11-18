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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { Button, spacing } from "~design-system";

import { CaseloadSelect } from "../CaseloadSelect";
import ModelHydrator from "../ModelHydrator";
import { NAV_BAR_HEIGHT } from "../NavigationLayout";
import { Heading } from "../sharedComponents";
import { TasksDescription } from "../WorkflowsTasks/TasksDescription";
import { RoutePlannerClients } from "./RoutePlannerClients";
import { RoutePlannerPlacePicker } from "./RoutePlannerPlacePicker";
import { RoutePlannerPresenter } from "./RoutePlannerPresenter";

const RoutePlannerSelectContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const ScrollableWrapper = styled.div`
  height: 100%;
  min-height: 30vh;
  overflow-y: auto;
`;

const SwitchToMapViewButtonContainer = styled.div`
  position: fixed;
  width: 100%;
  padding-right: ${rem(spacing.xl)};
  bottom: ${rem(NAV_BAR_HEIGHT + spacing.md)};
`;

const SwitchToMapViewButton = styled(Button)`
  width: 80%;
  margin: auto;
`;

export const RoutePlannerClientSelect = observer(
  function RoutePlannerClientSelect({
    presenter,
    isMobile,
  }: {
    presenter: RoutePlannerPresenter;
    isMobile: boolean;
  }) {
    const numSelectedClients =
      presenter.clientsPresenter.selectedClients.length;

    const showMapViewButton = isMobile && numSelectedClients > 0;

    return (
      <RoutePlannerSelectContainer>
        <CaseloadSelect />

        <Heading isMobile={isMobile}>Home contact route planner</Heading>
        <TasksDescription>
          You can pre-plan your driving route for home contacts before you head
          out. Search across one or more caseloads to find clients who have home
          contacts due for the month, select and re-order clients to optimize
          your route, and track your estimated driving time & distance.
        </TasksDescription>
        <RoutePlannerPlacePicker presenter={presenter} />

        <ScrollableWrapper>
          <ModelHydrator hydratable={presenter.clientsPresenter}>
            <RoutePlannerClients
              presenter={presenter.clientsPresenter}
              isMobile={isMobile}
            />
          </ModelHydrator>
        </ScrollableWrapper>

        {showMapViewButton && (
          <SwitchToMapViewButtonContainer>
            <SwitchToMapViewButton
              onClick={() => {
                presenter.isMapView = true;
              }}
            >
              See map view ({numSelectedClients} selected)
            </SwitchToMapViewButton>
          </SwitchToMapViewButtonContainer>
        )}
      </RoutePlannerSelectContainer>
    );
  },
);
