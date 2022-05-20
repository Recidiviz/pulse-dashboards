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

import {
  UiSans12,
  UiSans14,
  UiSans18,
  UiSans24,
} from "../../components/typography";
import { Client } from "../../PracticesStore/Client";
import { ClientAvatar } from "../Avatar";

export type ClientCapsuleProps = {
  avatarSize: "sm" | "lg";
  client: Client;
  status: React.ReactNode;
  textSize: "sm" | "lg";
};

const ClientName = styled.span`
  color: ${palette.pine2};
`;

const Separator = styled.span`
  color: ${palette.slate30};
`;

const ClientId = styled.span`
  color: ${palette.data.teal1};
`;

const Wrapper = styled.div`
  align-items: center;
  column-gap: ${rem(spacing.sm)};
  display: grid;
  grid-template-columns: auto 1fr;
  margin-bottom: ${rem(spacing.sm)};
`;

const ClientInfo = styled.div``;

const clientStatusStyles = `
  color: ${palette.slate60};
  line-height: 1.1;`;

const ClientStatusSm = styled(UiSans12)`
  ${clientStatusStyles}
`;

const ClientStatusLg = styled(UiSans14)`
  ${clientStatusStyles}
`;

const SIZES = {
  avatar: {
    sm: 40,
    lg: 56,
  },
  name: {
    sm: UiSans18,
    lg: UiSans24,
  },
  status: {
    sm: ClientStatusSm,
    lg: ClientStatusLg,
  },
};

const ClientCapsule: React.FC<ClientCapsuleProps> = ({
  avatarSize,
  client,
  status,
  textSize,
}) => {
  const NameEl = SIZES.name[textSize];
  const StatusEl = SIZES.status[textSize];

  return (
    <Wrapper>
      <ClientAvatar name={client.displayName} size={SIZES.avatar[avatarSize]} />
      <ClientInfo>
        <NameEl>
          <ClientName>{client.displayName}</ClientName>
          <Separator> • </Separator>
          <ClientId>{client.id}</ClientId>
        </NameEl>
        <StatusEl>{status}</StatusEl>
      </ClientInfo>
    </Wrapper>
  );
};

export default ClientCapsule;
