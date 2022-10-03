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
  spacing,
  typography,
} from "@recidiviz/design-system";
import { values } from "mobx";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { ProfileCapsule } from "../ClientCapsule";
import { useClientTracking } from "../hooks/useClientTracking";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import { FinesAndFees, Housing, SpecialConditions } from "./Details";
import { OpportunityModule } from "./OpportunityModule";
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
  grid-template-rows: minmax(${rem(96)}, auto) auto;
  padding-bottom: ${rem(spacing.lg)};
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

const ContactCell = styled.dl`
  ${typography.Sans14}
  color: ${palette.slate70};
  margin: 0;
`;

const ContactLabel = styled.dt`
  font-weight: inherit;
`;

const ContactValue = styled.dd`
  ${typography.Sans16}
  color: ${palette.signal.links};
  margin: 0;
`;

const SectionHeading = styled(Sans16)`
  color: ${palette.pine2};
  margin-bottom: ${rem(spacing.md)};
`;

const Divider = styled.hr`
  border-top: 1px solid ${palette.slate20};
  margin: ${rem(spacing.md)} 0;
`;

const NoOpportunities = styled.div`
  align-items: center;
  background: ${rgba(palette.slate, 0.05)};
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(4)};
  color: ${palette.slate70};
  display: flex;
  flex-direction: column;
  height: ${rem(250)};
  justify-content: center;
  padding: ${rem(spacing.md)};

  ${Sans16} {
    color: ${palette.pine2};
  }
`;

export const FullProfile = observer((): React.ReactElement | null => {
  const {
    workflowsStore: { selectedClient: client },
  } = useRootStore();

  useClientTracking(client, () => client?.trackProfileViewed());

  if (!client) return null;

  const opportunity = values(client.opportunities).find(
    (opp) => opp !== undefined
  );

  return (
    <WorkflowsNavLayout>
      <Wrapper>
        <Header>
          <ProfileCapsule avatarSize="lg" client={client} textSize="lg" />
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
          {client.currentBalance !== undefined && (
            <>
              <FinesAndFees client={client} />
              <Divider />
            </>
          )}
          <SpecialConditions client={client} />
        </div>
        <div>
          <SectionHeading>Opportunities</SectionHeading>
          {opportunity ? (
            <OpportunityModule
              opportunity={opportunity}
              formLinkButton={!!opportunity.navigateToFormText}
            />
          ) : (
            <NoOpportunities>
              <Sans16>None for now</Sans16>
              <Sans14>New opportunities will appear here.</Sans14>
            </NoOpportunities>
          )}
        </div>
      </Wrapper>
    </WorkflowsNavLayout>
  );
});
