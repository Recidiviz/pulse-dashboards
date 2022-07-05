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
import {
  palette,
  Sans14,
  Sans16,
  Sans18,
  Sans24,
  spacing,
} from "@recidiviz/design-system";
import { rem } from "polished";
import React from "react";
import styled, { css } from "styled-components/macro";

import { Client } from "../../PracticesStore/Client";
import { ClientAvatar } from "../Avatar";

export type ClientCapsuleProps = {
  avatarSize: "md" | "lg";
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
`;

const ClientInfo = styled.div``;

const clientStatusStyles = css`
  color: ${palette.slate60};
`;

const ClientStatusSm = styled(Sans14)`
  ${clientStatusStyles}
`;

const ClientStatusLg = styled(Sans16)`
  ${clientStatusStyles}
`;

const SIZES = {
  avatar: {
    md: 40,
    lg: 56,
  },
  identity: {
    sm: Sans18,
    lg: Sans24,
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
  const IdentityEl = SIZES.identity[textSize];
  const StatusEl = SIZES.status[textSize];

  return (
    <Wrapper>
      <ClientAvatar name={client.displayName} size={SIZES.avatar[avatarSize]} />
      <ClientInfo>
        <IdentityEl>
          <ClientName>{client.displayName}</ClientName>
          <Separator> • </Separator>
          <ClientId>{client.id}</ClientId>
        </IdentityEl>
        <StatusEl>{status}</StatusEl>
      </ClientInfo>
    </Wrapper>
  );
};

export default ClientCapsule;
