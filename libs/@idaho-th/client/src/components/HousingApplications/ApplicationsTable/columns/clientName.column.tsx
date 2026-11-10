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

import { CellContext, ColumnDef } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import React from "react";

import { USER_ROLE } from "~@idaho-th/shared";

import { useIdahoTHStore } from "../../../../datastores/IdahoTHStoreContext";
import { HousingApplication } from "../../../../interfaces/common";
import HomePlanIcon from "../../../assets/home-plan-badge.svg?react";
import * as Styled from "../ApplicationsTable.styles";
import { getAvatarInitials } from "../utils";

const StaffClientNameCell: React.FC<{ clientName: string }> = ({
  clientName,
}) => (
  <Styled.ClientNameContent>
    <Styled.ClientAvatar>{getAvatarInitials(clientName)}</Styled.ClientAvatar>
    <Styled.ClientNameText>{clientName}</Styled.ClientNameText>
  </Styled.ClientNameContent>
);

const ProviderClientNameCell: React.FC<{
  clientName: string;
  isSelectedProvider: boolean;
}> = ({ clientName, isSelectedProvider }) => {
  const initials = getAvatarInitials(clientName);

  if (!isSelectedProvider) {
    return (
      <Styled.ClientNameContent>
        <Styled.UnselectedProviderAvatar>
          {initials}
        </Styled.UnselectedProviderAvatar>
        <Styled.ClientNameText>{clientName}</Styled.ClientNameText>
      </Styled.ClientNameContent>
    );
  }

  return (
    <Styled.ClientNameContent>
      <Styled.AvatarWrapper>
        <Styled.ClientAvatar>{initials}</Styled.ClientAvatar>
        <Styled.HomePlanBadge>
          <HomePlanIcon />
        </Styled.HomePlanBadge>
      </Styled.AvatarWrapper>
      <Styled.ClientNameTextGroup>
        <Styled.ClientNameText>{clientName}</Styled.ClientNameText>
        <Styled.HomePlanCaptionText>Home Plan</Styled.HomePlanCaptionText>
      </Styled.ClientNameTextGroup>
    </Styled.ClientNameContent>
  );
};

const ClientNameCell = observer(function ClientNameCell({
  row,
}: CellContext<HousingApplication, unknown>) {
  const idahoTHStore = useIdahoTHStore();
  const userRole = idahoTHStore.rootStore.userStore.user?.role;

  return (
    <Styled.ClientNameCell>
      <Styled.CellSlot>
        {userRole === USER_ROLE.PROVIDER ? (
          <ProviderClientNameCell
            clientName={row.original.clientName}
            isSelectedProvider={row.original.isSelectedProvider ?? false}
          />
        ) : (
          <StaffClientNameCell clientName={row.original.clientName} />
        )}
      </Styled.CellSlot>
    </Styled.ClientNameCell>
  );
});

export const clientNameColumn: ColumnDef<HousingApplication> = {
  id: "clientName",
  accessorKey: "clientName",
  enableSorting: true,
  header: "Client name",
  cell: ClientNameCell,
};
