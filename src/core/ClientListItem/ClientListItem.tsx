// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { palette, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { Client } from "../../PracticesStore/Client";
import { ClientAvatar } from "../ClientAvatar";

interface ClientListItemProps {
  client: Client;
}

const CLIENT_LIST_ITEM_AVATAR_SIZE = 40;

const ClientListItemElement = styled.div`
  align-items: center;
  display: grid;
  grid-template-columns: ${rem(CLIENT_LIST_ITEM_AVATAR_SIZE)} 1fr;
  margin-bottom: ${rem(spacing.sm)};
`;

const ClientInfo = styled.div`
  line-height: 1.1;
  margin-left: ${rem(spacing.sm)};
`;

const ClientName = styled.div`
  color: ${palette.pine2};
  font-size: ${rem(14)};
`;

const ClientID = styled.span`
  color: ${palette.slate60};
  font-size: ${rem(12)};
`;

const ClientListItem: React.FC<ClientListItemProps> = ({ client }) => {
  return (
    <ClientListItemElement>
      <ClientAvatar
        name={client.displayName}
        size={CLIENT_LIST_ITEM_AVATAR_SIZE}
      />
      <ClientInfo>
        <ClientName>{client.displayName}</ClientName>
        <ClientID>{client.id}</ClientID>
      </ClientInfo>
    </ClientListItemElement>
  );
};

export default ClientListItem;
