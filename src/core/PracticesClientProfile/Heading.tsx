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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { ClientAvatar } from "../Avatar";
import { ClientProfileProps } from "./types";

const HeadingWrapper = styled.div`
  display: grid;
  grid-template-columns: ${rem(56)} 1fr;
  margin-bottom: ${rem(spacing.md)};
`;

const ClientName = styled.h1`
  color: ${palette.pine2};
  font-size: ${rem(18)};
  letter-spacing: -0.02em;
  line-height: 1.3;
  margin: 0;
`;

const ClientDetails = styled.div`
  color: ${palette.slate70};
  font-size: ${rem(14)};
  line-height: 1.7;
`;

export const Heading = observer(({ client }: ClientProfileProps) => {
  return (
    <HeadingWrapper>
      <div>
        <ClientAvatar name={client.displayName} />
      </div>
      <div>
        <ClientName>{client.displayName}</ClientName>
        <ClientDetails>
          {client.supervisionType}, {client.supervisionLevel}, {client.id}
        </ClientDetails>
      </div>
    </HeadingWrapper>
  );
});
