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
import styled from "styled-components/macro";

import {
  EmptyStateText,
  EmptyStateWrapper,
} from "../OpportunityCaseloadView/HydratedOpportunityPersonList";
import { RoutePlannerClientsPresenter } from "./RoutePlannerClientsPresenter";

const ClientsWrapper = styled.div`
  display: flex;
  height: 100%;
`;

export const RoutePlannerClients = observer(function RoutePlannerClients({
  presenter,
}: {
  presenter: RoutePlannerClientsPresenter;
}) {
  return (
    <ClientsWrapper>
      {presenter.selectedOfficers.length === 0 ? (
        <EmptyStateWrapper>
          <EmptyStateText>Select a caseload to show results.</EmptyStateText>
        </EmptyStateWrapper>
      ) : (
        presenter.selectedOfficers.map((officer) => {
          return <div key={officer.searchId}>{officer.searchLabel}</div>;
        })
      )}
    </ClientsWrapper>
  );
});
