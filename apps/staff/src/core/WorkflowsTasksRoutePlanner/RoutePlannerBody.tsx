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

// @ts-expect-error Types from the extended component library can't be resolved under
// moduleResolution of "node"
import { APILoader } from "@googlemaps/extended-component-library/react";
import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components/macro";

import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import { RoutePlannerClientSelect } from "./RoutePlannerClientSelect";
import { RoutePlannerMap } from "./RoutePlannerMap";
import { RoutePlannerPresenter } from "./RoutePlannerPresenter";

const RoutePlannerContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
`;

const RoutePlannerSelectArea = styled.div`
  flex: none;
  width: ${rem(850)};
  padding-right: ${rem(spacing.lg)};
`;

export const ManagedComponent: FC<{
  presenter: RoutePlannerPresenter;
}> = observer(function RoutePlannerBody({ presenter }) {
  // TODO(#9639): Handle mobile view here
  if (!presenter) {
    return null;
  }

  return (
    <>
      <APILoader apiKey={presenter.mapsApiKey} />
      <RoutePlannerContainer>
        <RoutePlannerSelectArea>
          <RoutePlannerClientSelect presenter={presenter} />
        </RoutePlannerSelectArea>
        <RoutePlannerMap presenter={presenter} />
      </RoutePlannerContainer>
    </>
  );
});

function usePresenter() {
  const { workflowsStore } = useRootStore();

  return new RoutePlannerPresenter(workflowsStore);
}

export const RoutePlannerBody = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
});
