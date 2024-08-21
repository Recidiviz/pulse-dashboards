// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { toTitleCase } from "../../utils";
import { Client } from "../../WorkflowsStore";
import { Resident } from "../../WorkflowsStore/Resident";
import { CaseNoteSearch } from "../CaseNoteSearch";
import { usePersonTracking } from "../hooks/usePersonTracking";
import { ProfileCapsule } from "../PersonCapsules";
import WorkflowsLastSynced from "../WorkflowsLastSynced";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import { PreviewTasks } from "../WorkflowsTasks/PreviewTasks";
import {
  ClientEmployer,
  ClientHousing,
  FinesAndFees,
  Milestones,
  SpecialConditions,
} from "./ClientDetailSidebarComponents";
import ClientDetailsInput from "./ClientDetailsInput";
import { OpportunitiesAccordion } from "./OpportunitiesAccordion";
import { PartialTime } from "./PartialTime";
import { PreferredContact } from "./PreferredContact";
import { ResidentHousing } from "./ResidentDetailSidebarComponents/ResidentHousing";
import { IncarcerationProgress, SupervisionProgress } from "./SentenceProgress";
import { Divider } from "./styles";
import {
  ClientProfileProps,
  PersonProfileProps,
  ResidentProfileProps,
} from "./types";
import { UsArResidentInformation } from "./UsAr/UsArResidentInformation";
import { UsIdResidentInformation } from "./UsId/UsIdResidentInformation";
import { UsMoResidentInformation } from "./UsMo/UsMoResidentInformation";

const COLUMNS = "1fr 1.2fr";

const GUTTER = rem(spacing.sm * 15);
const SMALL_GUTTER = rem(spacing.md);

const Wrapper = styled.div<{
  isMobile: boolean;
}>`
  display: grid;
  column-gap: ${GUTTER};
  padding-bottom: ${rem(spacing.lg)};
  row-gap: ${SMALL_GUTTER};

  ${({ isMobile }) =>
    !isMobile &&
    `div[class*="AccordionWrapper"] {
      margin: 0;
    }`}
`;

const Header = styled.div<{ isMobile: boolean }>`
  border-bottom: 1px solid ${rgba(palette.slate, 0.15)};
  gap: ${({ isMobile }) => (isMobile ? rem(spacing.xl) : SMALL_GUTTER)};
  display: grid;
  grid-template-columns: ${({ isMobile }) => (isMobile ? `100%` : COLUMNS)};
  padding-top: 0;
  padding-bottom: ${rem(spacing.md)};
  cursor: default;
  min-width: ${rem(280)};
`;

const Content = styled.div<{
  isMobile: boolean;
}>`
  display: grid;
  gap: ${SMALL_GUTTER};
  grid-template-columns: ${({ isMobile }) => (isMobile ? `100%` : COLUMNS)};

  & > div {
    :last-child {
      ${({ isMobile }) => isMobile && `order: -1`}
    }
  }

  hr[class*="TaskItemDivider"] {
    margin: 0;
  }
`;

const ContactDetailsContainer = styled.div<{
  isMobile: boolean;
}>`
  display: grid;
  gap: ${rem(spacing.md)};
  grid-template-columns: ${({ isMobile }) =>
    isMobile ? `repeat(auto-fill, minmax(${rem(176)}, 1fr));` : `1fr 1fr 1fr;`};

  ${({ isMobile }) =>
    `max-width: ${isMobile ? "unset" : rem(500)}; justify-self: ${
      isMobile ? "unset" : "end"
    };`}
`;

const ContactCell = styled.dl`
  ${typography.Sans14}
  color: ${palette.slate70};
  margin: 0;
  padding: 0;
`;

const ContactLabel = styled.dt`
  font-weight: inherit;
`;

const ContactValue = styled.dd`
  ${typography.Sans16};
  color: ${palette.pine2};
  margin: 0;
  padding-top: 5px;
  text-align: left;

  :first-child {
    padding-top: 0;
  }
`;

const SectionHeading = styled(Sans16)`
  color: ${palette.slate80};
  margin-bottom: ${rem(spacing.md)};
`;

const CasenoteSearchWrapper = styled.div`
  & ${Divider} {
    display: block;
    margin-bottom: 0;
  }
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

const ClientDetails = observer(function ClientDetails({
  client,
}: ClientProfileProps): React.ReactElement {
  return (
    <>
      <SectionHeading>Progress toward success</SectionHeading>
      <Divider />
      <SupervisionProgress client={client} />
      <Divider />
      <PartialTime person={client} />
      {client.portionServedDates.length > 0 && <Divider />}
      {client.profileMilestones.length > 0 && (
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
});

const ResidentDetails = observer(function ResidentDetails({
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
      <PartialTime person={resident} />
      {resident.portionServedDates.length > 0 && <Divider />}
      <ResidentHousing resident={resident} />
      <StateSpecificResidentInformation resident={resident} />
      <Divider />
    </>
  );
});

function StateSpecificResidentInformation({
  resident,
}: ResidentProfileProps): React.ReactElement | null {
  switch (resident.stateCode) {
    case "US_AR":
      return <UsArResidentInformation resident={resident} />;
    case "US_ID":
      return <UsIdResidentInformation resident={resident} />;
    case "US_MO":
      return <UsMoResidentInformation resident={resident} />;
    default:
      return null;
  }
}

const PreferredName: React.FC<ClientProfileProps> = observer(
  function PreferredName({ client }): React.ReactElement {
    const name =
      client.preferredName || toJS(client.fullName).givenNames || "Unknown";
    return (
      <ClientDetailsInput
        text={toTitleCase(name)}
        client={client}
        updateType="preferredName"
      />
    );
  },
);

type ContactDetailsType = { isMobile: boolean } & PersonProfileProps;

function ContactDetails({
  person,
  isMobile,
}: ContactDetailsType): React.ReactElement | null {
  if (!(person instanceof Client)) return null;

  return (
    <ContactDetailsContainer isMobile={isMobile}>
      <ContactCell>
        <ContactLabel>Contacts</ContactLabel>
        <ContactValue className="fs-exclude">
          {person.phoneNumber || "Phone number unavailable"}
        </ContactValue>
        <ContactValue className="fs-exclude">
          {person.emailAddress || "Email unavailable"}
        </ContactValue>
      </ContactCell>
      <ContactCell>
        <ContactLabel>Preferred Name</ContactLabel>
        <ContactValue>
          <PreferredName client={person} />
        </ContactValue>
      </ContactCell>
      <ContactCell>
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
    const { isTablet, isMobile } = useIsMobile(true);
    const { caseNoteSearch } = useFeatureVariants();

    usePersonTracking(person, () => {
      person?.trackProfileViewed();
    });

    if (!person) return null;

    return (
      <WorkflowsNavLayout>
        <Wrapper isMobile={isMobile}>
          <Header isMobile={isTablet}>
            <ProfileCapsule
              avatarSize="lg"
              person={person}
              textSize="sm"
              nameHoverState={false}
            />
            <ContactDetails person={person} isMobile={isTablet} />
          </Header>
          {caseNoteSearch && (
            <CasenoteSearchWrapper>
              <CaseNoteSearch />
              <Divider />
            </CasenoteSearchWrapper>
          )}
          <Content isMobile={isTablet}>
            <div className="ProfileDetails">
              <AdditionalDetails person={person} />
            </div>
            <div>
              <SectionHeading>Opportunities</SectionHeading>
              <OpportunitiesAccordion person={person} formLinkButton />
              <PreviewTasks person={person} showSnoozeDropdown={false} />
            </div>
          </Content>
        </Wrapper>
        <WorkflowsLastSynced date={person.lastDataFromState} />
      </WorkflowsNavLayout>
    );
  },
);
