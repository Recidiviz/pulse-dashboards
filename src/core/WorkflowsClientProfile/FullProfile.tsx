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
import { toJS } from "mobx";
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
import ClientDetailsInput from "./ClientDetailsInput";
import {
  ClientEmployer,
  ClientHousing,
  FinesAndFees,
  Milestones,
  ResidentHousing,
  SpecialConditions,
} from "./Details";
import { OpportunitiesAccordion } from "./OpportunitiesAccordion";
import { PreferredContact } from "./PreferredContact";
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

const ContactDetailsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
`;

const ContactCell = styled.dl<{ flexBasis?: string }>`
  ${typography.Sans14}
  color: ${palette.slate70};
  margin: 0;
  flex-basis: ${(props) => props.flexBasis || "auto"};
  padding: 0 ${rem(spacing.md)};

  :not(:last-child) {
    border-right: 1px solid ${palette.slate20};
  }
`;

const ContactLabel = styled.dt`
  font-weight: inherit;
`;

const ContactValue = styled.dd<{ alignRight?: boolean }>`
  ${typography.Sans16};
  color: ${palette.pine2};
  margin: 0;
  padding-top: 5px;
  text-align: ${(props) => (props.alignRight ? "right" : "left")};

  :first-child {
    padding-top: 0;
  }
`;

const SectionHeading = styled(Sans16)`
  color: ${palette.pine2};
  margin-bottom: ${rem(spacing.md)};
`;

const Divider = styled.hr`
  border-top: 1px solid ${palette.slate20};
  margin: ${rem(spacing.md)} 0;
`;

export const DETAILS_NOT_AVAILABLE_STRING = "currently not available";

function AdditionalDetails({ person }: PersonProfileProps): React.ReactElement {
  if (person instanceof Client) {
    return <ClientDetails client={person} />;
  }

  if (person instanceof Resident) {
    return <ResidentDetails resident={person} />;
  }

  return <div />;
}

function ClientDetails({ client }: ClientProfileProps): React.ReactElement {
  return (
    <>
      <SectionHeading>Progress toward success</SectionHeading>
      <Divider />
      <SupervisionProgress client={client} />
      <Divider />
      {client.milestones && client.milestones.length > 0 && (
        <>
          <Milestones client={client} />
          <Divider />
        </>
      )}
      <ClientHousing client={client} />
      <Divider />
      {client.currentEmployers && client.currentEmployers.length > 0 && (
        <>
          <ClientEmployer client={client} />
          <Divider />
        </>
      )}
      {client.currentBalance !== undefined && (
        <>
          <FinesAndFees client={client} />
          <Divider />
        </>
      )}
      <SpecialConditions client={client} />
    </>
  );
}

function ResidentDetails({
  resident,
}: ResidentProfileProps): React.ReactElement {
  return (
    <>
      <SectionHeading>Progress toward success</SectionHeading>
      <Divider />
      {
        // MO residents don't have start/end dates or officer IDs in their resident record
        resident.stateCode !== "US_MO" && (
          <>
            <IncarcerationProgress resident={resident} />
            <Divider />
          </>
        )
      }
      <ResidentHousing resident={resident} />
      <Divider />
    </>
  );
}

const PreferredName: React.FC<ClientProfileProps> = observer(
  function PreferredName({ client }): React.ReactElement {
    const name =
      client.preferredName || toJS(client.fullName).givenNames || "Unknown";
    return (
      <ClientDetailsInput
        text={name}
        client={client}
        updateType="preferredName"
      />
    );
  }
);

function ContactDetails({
  person,
}: PersonProfileProps): React.ReactElement | null {
  if (!(person instanceof Client)) return null;

  return (
    <ContactDetailsContainer>
      <ContactCell flexBasis="50%">
        <div>
          <ContactValue className="fs-exclude" alignRight>
            {person.formattedPhoneNumber || "Phone number unavailable"}
          </ContactValue>
          <ContactValue className="fs-exclude" alignRight>
            {person.emailAddress || "Email unavailable"}
          </ContactValue>
        </div>
      </ContactCell>
      <ContactCell flexBasis="25%">
        <ContactLabel>Preferred Name</ContactLabel>
        <ContactValue>
          <PreferredName client={person} />
        </ContactValue>
      </ContactCell>
      <ContactCell flexBasis="25%">
        <ContactLabel>Preferred Contact</ContactLabel>
        <ContactValue>
          <PreferredContact client={person} />
        </ContactValue>
      </ContactCell>
    </ContactDetailsContainer>
  );
}

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
