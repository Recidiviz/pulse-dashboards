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

import { APILoader } from "@googlemaps/extended-component-library/react";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components";

import { Button, palette, spacing } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { RoutePlannerAddMoreClients } from "./AddMoreClients/RoutePlannerAddMoreClients";
import { useRoutePlannerClientStore } from "./ClientStore/ClientStoreProvider";
import { RoutePlannerClientSelect } from "./RoutePlannerClientSelect";
import { RoutePlannerMap } from "./RoutePlannerMap";
import { RoutePlannerPresenter } from "./RoutePlannerPresenter";

const RoutePlannerContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
`;

const RoutePlannerConditionalView = styled.div<{
  $isVisible: boolean;
}>`
  height: 100%;

  display: ${({ $isVisible }) => ($isVisible ? "block" : "none")};
`;

const RoutePlannerSelectArea = styled.div<{
  $isMobile: boolean;
}>`
  flex: none;
  ${({ $isMobile }) => !$isMobile && `width: 55vw;`}
  height: 100%;

  padding-right: ${({ $isMobile }) =>
    $isMobile ? rem(spacing.xs) : rem(spacing.lg)};
`;

const AddMoreLinkStyles = styled(Button)`
  position: absolute;
  bottom: 2em;
  color: ${palette.signal.links};
  font-weight: 600;
  &:focus-visible,
  &:hover {
    outline: none;
    text-decoration: none;
  }
  &:active {
    ${palette.signal.links};
  }
`;

const AddMoreSection = observer(function AddMoreSection({
  presenter,
}: {
  presenter: RoutePlannerPresenter;
}) {
  if (!presenter.showAddMoreButton) return null;

  return (
    <>
      <AddMoreLinkStyles
        kind="link"
        onClick={() => presenter.updateShowWindow()}
      >
        Add more clients to route →
      </AddMoreLinkStyles>
      {presenter.showWindow && <RoutePlannerAddMoreClients />}
    </>
  );
});

const MobileRoutePlannerMain = observer(function RoutePlannerMain({
  presenter,
}: {
  presenter: RoutePlannerPresenter;
}) {
  // We want to retain the state of the route planner on mobile
  // as we switch between map and route planner due to the
  // nature of the Place Picker API that does not take a default
  // prop for it's inputs - meaning we would have to manually set it
  // with the value from the presenter layer with a mutationobserver
  return (
    <>
      <RoutePlannerConditionalView $isVisible={presenter.isMapView}>
        <RoutePlannerMap presenter={presenter} isMobile={true} />
      </RoutePlannerConditionalView>
      <RoutePlannerConditionalView $isVisible={!presenter.isMapView}>
        <RoutePlannerSelectArea $isMobile={true}>
          <RoutePlannerClientSelect presenter={presenter} isMobile={true} />
        </RoutePlannerSelectArea>
        <AddMoreSection presenter={presenter} />
      </RoutePlannerConditionalView>
    </>
  );
});

export const ManagedComponent: FC<{
  presenter: RoutePlannerPresenter;
}> = observer(function RoutePlannerBody({ presenter }) {
  // This constant is weirdly named; when it's true, the screen width is at an iPad
  // in landscape mode or smaller. We choose this breakpoint in order to handle
  // phones with a tall screen in landscape mode
  const { isLaptop } = useIsMobile(true);

  if (!presenter) {
    return null;
  }

  return (
    <>
      <APILoader apiKey={presenter.mapsApiKey} />
      {isLaptop ? (
        <MobileRoutePlannerMain presenter={presenter} />
      ) : (
        <RoutePlannerContainer>
          <RoutePlannerSelectArea $isMobile={false}>
            <RoutePlannerClientSelect presenter={presenter} isMobile={false} />
          </RoutePlannerSelectArea>
          <RoutePlannerMap presenter={presenter} isMobile={false} />
          <AddMoreSection presenter={presenter} />
        </RoutePlannerContainer>
      )}
    </>
  );
});

function usePresenter() {
  const { workflowsStore } = useRootStore();

  const routePlannerClientStore = useRoutePlannerClientStore();

  return new RoutePlannerPresenter(workflowsStore, routePlannerClientStore);
}

export const RoutePlannerBody = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
});
