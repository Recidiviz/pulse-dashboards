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
import { rem, rgba } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { ClientAvatar } from "../Avatar";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import { FinesAndFees, Housing, SpecialConditions } from "./Details";
import { UiSans14, UiSans16, UiSans18, UiSans24 } from "./styles";
import { SupervisionProgress } from "./SupervisionProgress";

const COLUMNS = "1fr 1.2fr";

const GUTTER = rem(spacing.sm * 15);

const Wrapper = styled.div`
  display: grid;
  column-gap: ${GUTTER};
  grid-template-areas:
    "header header"
    ". .";
  grid-template-columns: ${COLUMNS};
  grid-template-rows: ${rem(96)} auto;
  row-gap: ${rem(spacing.lg)};
`;

const Header = styled.div`
  border-bottom: 1px solid ${rgba(palette.slate, 0.15)};
  column-gap: ${GUTTER};
  display: grid;
  grid-area: header;
  grid-template-columns: ${COLUMNS};
  padding: ${rem(spacing.lg)} 0 ${rem(spacing.md)};
`;

const IdentityCell = styled(UiSans14)`
  color: ${palette.slate70};
  column-gap: ${rem(spacing.md)};
  display: grid;
  grid-template-columns: min-content 1fr;
`;

const Name = styled(UiSans24)`
  color: ${palette.pine2};
  line-height: ${rem(32)};
`;

const ContactCell = styled(UiSans14).attrs({ as: "dl" })`
  color: ${palette.slate70};
  margin: 0;
`;

const ContactLabel = styled.dt`
  font-weight: inherit;
`;

const ContactValue = styled(UiSans16).attrs({ as: "dd" })`
  color: ${palette.signal.links};
  margin: 0;
`;

const SectionHeading = styled(UiSans18)`
  color: ${palette.pine2};
  margin-bottom: ${rem(spacing.sm)};
`;

const Divider = styled.hr`
  border-top: 1px solid ${palette.slate20};
  margin: ${rem(spacing.md)} 0;
`;

export const FullProfile = observer((): React.ReactElement | null => {
  const {
    practicesStore: { selectedClient: client },
  } = useRootStore();

  if (!client) return null;

  return (
    <WorkflowsNavLayout>
      <Wrapper>
        <Header>
          <IdentityCell>
            <ClientAvatar name={client.displayName} size={56} />
            <div>
              <Name>{client.displayName}</Name>
              <div>
                {client.supervisionType}, {client.supervisionLevel}, {client.id}
              </div>
            </div>
          </IdentityCell>
          <ContactCell>
            <div>
              <ContactLabel>Telephone</ContactLabel>
              <ContactValue>{client.formattedPhoneNumber}</ContactValue>
            </div>
          </ContactCell>
        </Header>
        <div>
          <SectionHeading>Progress toward success</SectionHeading>
          <Divider />
          <SupervisionProgress client={client} />
          <Divider />
          <Housing client={client} />
          <Divider />
          <FinesAndFees client={client} />
          <Divider />
          <SpecialConditions client={client} />
        </div>
      </Wrapper>
    </WorkflowsNavLayout>
  );
});
