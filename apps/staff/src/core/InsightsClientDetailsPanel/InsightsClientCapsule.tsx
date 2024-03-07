// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { palette, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { ClientInfo } from "../../InsightsStore/models/ClientInfo";
import { PersonInitialsAvatar } from "../Avatar";
import { Separator } from "../WorkflowsJusticeInvolvedPersonProfile/styles";

const Wrapper = styled.div`
  align-items: center;
  column-gap: ${rem(spacing.sm)};
  display: grid;
  grid-template-columns: auto 1fr;
`;

const ClientDetail = styled.div`
  ${typography.Sans18};
`;

const ClientName = styled.span`
  color: ${palette.pine2};
`;

const ClientId = styled.span`
  color: ${palette.data.teal1};
`;

type InsightsClientCapsuleProps = {
  clientInfo: ClientInfo;
};

export const InsightsClientCapsule = observer(function InsightsClientCapsule({
  clientInfo,
}: InsightsClientCapsuleProps): JSX.Element {
  return (
    <Wrapper>
      <PersonInitialsAvatar name={clientInfo.displayName} />
      <ClientDetail>
        <ClientName>{clientInfo.displayName}</ClientName>
        <Separator> • </Separator>
        <ClientId>{clientInfo.clientId}</ClientId>
      </ClientDetail>
    </Wrapper>
  );
});
