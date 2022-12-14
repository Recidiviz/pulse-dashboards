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

import { palette, Sans16, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { Client } from "../../WorkflowsStore";
import { Resident } from "../../WorkflowsStore/Resident";
import { usePersonTracking } from "../hooks/usePersonTracking";
import { ProfileCapsule } from "../PersonCapsules";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import {
  ClientHousing,
  FinesAndFees,
  ResidentHousing,
  SpecialConditions,
} from "./Details";
import { OpportunitiesAccordion } from "./OpportunitiesAccordion";
import { IncarcerationProgress, SupervisionProgress } from "./SentenceProgress";
import {
  ClientProfileProps,
  PersonProfileProps,
  ResidentProfileProps,
} from "./types";

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
  cursor: default;
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

const AdditionalDetails = ({
  person,
}: PersonProfileProps): React.ReactElement => {
  if (person instanceof Client) {
    return <ClientDetails client={person} />;
  }

  if (person instanceof Resident) {
    return <ResidentDetails resident={person} />;
  }

  return <div />;
};

const ClientDetails = ({ client }: ClientProfileProps): React.ReactElement => {
  return (
    <>
      <SectionHeading>Progress toward success</SectionHeading>
      <Divider />
      <SupervisionProgress client={client} />
      <Divider />
      <ClientHousing client={client} />
      <Divider />
      {client.currentBalance !== undefined && (
        <>
          <FinesAndFees client={client} />
          <Divider />
        </>
      )}
      <SpecialConditions client={client} />
    </>
  );
};

const ResidentDetails = ({
  resident,
}: ResidentProfileProps): React.ReactElement => {
  return (
    <>
      <SectionHeading>Progress toward success</SectionHeading>
      <Divider />
      <IncarcerationProgress resident={resident} />
      <Divider />
      <ResidentHousing resident={resident} />
      <Divider />
    </>
  );
};

const ContactDetails = ({
  person,
}: PersonProfileProps): React.ReactElement | null => {
  if (!(person instanceof Client)) return null;

  return (
    <ContactCell>
      <div>
        <ContactLabel>Telephone</ContactLabel>
        <ContactValue className="fs-exclude">
          {person.formattedPhoneNumber}
        </ContactValue>
      </div>
    </ContactCell>
  );
};

export const FullProfile = observer(
  function FullProfile(): React.ReactElement | null {
    const {
      workflowsStore: { selectedPerson: person },
    } = useRootStore();

    usePersonTracking(person, () => {
      person?.trackProfileViewed();
    });

    if (!person) return null;

    return (
      <WorkflowsNavLayout>
        <Wrapper>
          <Header>
            <ProfileCapsule
              avatarSize="lg"
              person={person}
              textSize="lg"
              hideTooltip
              nameHoverState={false}
            />
            <ContactDetails person={person} />
          </Header>
          <div className="ProfileDetails">
            <AdditionalDetails person={person} />
          </div>
          <div>
            <SectionHeading>Opportunities</SectionHeading>
            <OpportunitiesAccordion person={person} />
          </div>
        </Wrapper>
      </WorkflowsNavLayout>
    );
  }
);
