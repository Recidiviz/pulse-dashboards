// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
import styled from "styled-components";

import { Button, Modal, palette, spacing } from "~design-system";
import { withPresenterManager } from "~hydration-utils";
import useIsMobile from "~utils/react/useIsMobile";

import { useRootStore } from "../../../components/StoreProvider/StoreProvider";
import { Heading } from "../../sharedComponents";
import { useRoutePlannerClientStore } from "../ClientStore/ClientStoreProvider";
import { RoutePlannerTable } from "./RoutePlannerClientsTable";
import { RoutePlannerTablePresenter } from "./RoutePlannerTablePresenter";

const AddMoreClientsHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 10px;
`;

const OfficersList = styled.div`
  padding: 0 5px;
  color: ${palette.slate50};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const Footer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background: white;
  width: 100%;
  padding: ${spacing.sm}px;
  border-top: ${spacing.xxs}px solid ${palette.slate10};
  font-weight: 600;
  flex: 0.1;
`;

const AddMoreClientsButton = styled.button<{ $isDisabled: boolean }>`
  color: ${palette.white};
  background: ${({ $isDisabled }) =>
    $isDisabled ? `${palette.slate30}` : `${palette.pine3}`};
  cursor: ${({ $isDisabled }) => ($isDisabled ? "not-allowed" : "pointer")};
  outline: none;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  display: flex;
  padding: 10px 18px;
`;

const ModalHeader = styled.div<{ $isTablet: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 0.01;

  ${({ $isTablet }) =>
    $isTablet &&
    `
    max-width: 80%;
    text-wrap: wrap;
  `}
`;

const CancelButton = styled.button`
  color: ${palette.slate70};
  background: none;
  outline: none;
  border: none;
  font-weight: 600;
  display: flex;
  flex-direction: row;
  border-radius: 8px;
  display: flex;
  padding: 10px 18px;

  &:active {
    outline: none;
  }
`;

const CloseButton = styled(Button)<{ $isTablet: boolean }>`
  display: flex;
  align-self: flex-end;
  position: absolute;

  ${({ $isTablet }) =>
    $isTablet &&
    `
      right: 0;
    `}
`;

const ClientScrollWrapper = styled.div`
  display: flex;
  height: 100%;
  overflow: scroll;
  flex: 2;
`;

const AddMoreModal = styled(Modal)`
  .ReactModal__Content {
    height: 100%;
    width: fit-content;
    display: flex;
    flex-direction: column;
  }

  .ReactModal__Overlay {
    background-color: rgba(0, 0, 0, 0.25);
  }
`;

export const ManagedComponent = observer(function RoutePlannerAddMoreClients({
  presenter,
}: {
  presenter: RoutePlannerTablePresenter;
}) {
  const {
    workflowsStore: {
      searchStore: { selectedSearchables },
    },
  } = useRootStore();

  const addMoreDisabled = presenter.potentialPeople.length === 0;
  const { isTablet } = useIsMobile(true);
  // display table according to selected officers
  return (
    <AddMoreModal isOpen={true} onRequestClose={presenter.onCancel}>
      <ModalHeader $isTablet={isTablet}>
        <CloseButton
          kind="borderless"
          icon="Close"
          iconSize={12}
          onClick={presenter.onCancel}
          aria-label="Close"
          $isTablet={isTablet}
        />
        <Heading>Add more clients to route</Heading>
        <AddMoreClientsHeader>
          {selectedSearchables.map((searchable) => (
            <OfficersList key={searchable.searchId}>
              {searchable.searchLabel}
            </OfficersList>
          ))}
          <OfficersList>
            {presenter.clientsInSelectedSearchesCount()} Clients
          </OfficersList>
        </AddMoreClientsHeader>
      </ModalHeader>
      <ClientScrollWrapper>
        <RoutePlannerTable presenter={presenter} />
      </ClientScrollWrapper>
      <Footer>
        {addMoreDisabled
          ? "None Selected"
          : `${presenter.potentialPeople.length} selected`}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <CancelButton
            onClick={() => {
              presenter.onCancel();
            }}
          >
            Cancel
          </CancelButton>
          <AddMoreClientsButton
            $isDisabled={addMoreDisabled}
            disabled={addMoreDisabled}
            onClick={() => {
              presenter.onClickAdd();
            }}
          >
            {addMoreDisabled
              ? "Add clients to route"
              : `Add ${presenter.potentialPeople.length} client(s) to route`}
          </AddMoreClientsButton>
        </div>
      </Footer>
    </AddMoreModal>
  );
});

function usePresenter() {
  const rootStore = useRootStore();

  const routePlannerClientStore = useRoutePlannerClientStore();

  return new RoutePlannerTablePresenter(rootStore, routePlannerClientStore);
}

export const RoutePlannerAddMoreClients = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
});
