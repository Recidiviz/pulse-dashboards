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
import useIsMobile from "../../hooks/useIsMobile";
import { toTitleCase } from "../../utils";
import { Client } from "../../WorkflowsStore";
import { Resident } from "../../WorkflowsStore/Resident";
import { usePersonTracking } from "../hooks/usePersonTracking";
import { ProfileCapsule } from "../PersonCapsules";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import { PreviewTasks } from "../WorkflowsTasks/PreviewTasks";
import ClientDetailsInput from "./ClientDetailsInput";
import { Divider } from "./common";
import {
  ClientEmployer,
  ClientHousing,
  FinesAndFees,
  HalfTime,
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
  ResponsiveRevamp,
} from "./types";

const COLUMNS = "1fr 1.2fr";

const GUTTER = rem(spacing.sm * 15);
const SMALL_GUTTER = rem(spacing.md);

const Wrapper = styled.div<{
  responsiveRevamp: boolean;
  isMobile: boolean;
}>`
  display: grid;
  column-gap: ${GUTTER};
  padding-bottom: ${rem(spacing.lg)};
  row-gap: ${({ responsiveRevamp }) =>
    responsiveRevamp ? SMALL_GUTTER : rem(spacing.lg)};

  ${({ responsiveRevamp, isMobile }) =>
    responsiveRevamp &&
    !isMobile &&
    `div[class*="AccordionWrapper"] {
      margin: 0;
    }`}
`;

const Header = styled.div<{ responsiveRevamp: boolean; isMobile: boolean }>`
  border-bottom: 1px solid ${rgba(palette.slate, 0.15)};
  gap: ${({ isMobile }) => (isMobile ? rem(spacing.xl) : SMALL_GUTTER)};
  display: grid;
  grid-template-columns: ${({ isMobile }) => (isMobile ? `100%` : COLUMNS)};
  padding-top: ${({ responsiveRevamp }) =>
    responsiveRevamp ? 0 : rem(spacing.lg)};
  padding-bottom: ${rem(spacing.md)};
  cursor: default;
  min-width: ${rem(280)};
`;

const Content = styled.div<{
  responsiveRevamp: boolean;
  isMobile: boolean;
}>`
  display: grid;
  gap: ${({ responsiveRevamp }) => (responsiveRevamp ? SMALL_GUTTER : GUTTER)};
  grid-template-columns: ${({ isMobile }) => (isMobile ? `100%` : COLUMNS)};

  & > div {
    :last-child {
      ${({ isMobile }) => isMobile && `order: -1`}
    }
  }

  ${({ responsiveRevamp }) =>
    responsiveRevamp &&
    `hr[class*="TaskItemDivider"] {
      margin: 0;
    }`}
`;

const ContactDetailsContainer = styled.div<{
  responsiveRevamp: boolean;
  isMobile: boolean;
}>`
  display: grid;
  gap: ${({ responsiveRevamp }) => (responsiveRevamp ? rem(spacing.md) : 0)};
  grid-template-columns: ${({ responsiveRevamp, isMobile }) =>
    isMobile
      ? `repeat(auto-fill, minmax(${rem(176)}, 1fr));`
      : `${responsiveRevamp ? "1fr" : "2fr"} 1fr 1fr;`};

  ${({ responsiveRevamp, isMobile }) =>
    responsiveRevamp &&
    `max-width: ${isMobile ? "unset" : rem(500)}; justify-self: ${
      isMobile ? "unset" : "end"
    };`}
`;

const ContactCell = styled.dl<{ responsiveRevamp: boolean }>`
  ${typography.Sans14}
  color: ${palette.slate70};
  margin: 0;
  padding: ${({ responsiveRevamp }) =>
    responsiveRevamp ? 0 : `0 ${rem(spacing.md)}`};

  :not(:last-child) {
    ${({ responsiveRevamp }) =>
      !responsiveRevamp && `border-right: 1px solid ${palette.slate20};`}
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

const SectionHeading = styled(Sans16)<{ responsiveRevamp: boolean }>`
  color: ${({ responsiveRevamp }) =>
    responsiveRevamp ? palette.slate80 : palette.pine2};
  margin-bottom: ${rem(spacing.md)};
`;

export const DETAILS_NOT_AVAILABLE_STRING = "currently not available";

function AdditionalDetails({
  person,
  responsiveRevamp,
}: PersonProfileProps & ResponsiveRevamp): React.ReactElement {
  if (person instanceof Client) {
    return (
      <ClientDetails responsiveRevamp={responsiveRevamp} client={person} />
    );
  }

  if (person instanceof Resident) {
    return (
      <ResidentDetails responsiveRevamp={responsiveRevamp} resident={person} />
    );
  }

  return <div />;
}

function ClientDetails({
  client,
  responsiveRevamp,
}: ClientProfileProps & ResponsiveRevamp): React.ReactElement {
  return (
    <>
      <SectionHeading responsiveRevamp={responsiveRevamp}>
        Progress toward success
      </SectionHeading>
      <Divider />
      <SupervisionProgress client={client} />
      <Divider />
      {client.stateCode === "US_ME" &&
        client.supervisionStartDate &&
        client.expirationDate && (
          <>
            <HalfTime person={client} />
            <Divider />
          </>
        )}
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
  responsiveRevamp,
}: ResidentProfileProps & ResponsiveRevamp): React.ReactElement {
  return (
    <>
      <SectionHeading responsiveRevamp={responsiveRevamp}>
        Progress toward success
      </SectionHeading>
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
      {resident.stateCode === "US_ME" &&
        resident.admissionDate &&
        resident.releaseDate && (
          <>
            <HalfTime person={resident} />
            <Divider />
          </>
        )}
      <ResidentHousing resident={resident} />
      <Divider />
    </>
  );
}

const PreferredName: React.FC<ClientProfileProps & ResponsiveRevamp> = observer(
  function PreferredName({ client, responsiveRevamp }): React.ReactElement {
    const name =
      client.preferredName || toJS(client.fullName).givenNames || "Unknown";
    return (
      <ClientDetailsInput
        text={responsiveRevamp ? toTitleCase(name) : name}
        client={client}
        updateType="preferredName"
      />
    );
  }
);

type ContactDetailsType = { isMobile: boolean } & PersonProfileProps &
  ResponsiveRevamp;

function ContactDetails({
  person,
  responsiveRevamp,
  isMobile,
}: ContactDetailsType): React.ReactElement | null {
  if (!(person instanceof Client)) return null;

  return (
    <ContactDetailsContainer
      responsiveRevamp={responsiveRevamp}
      isMobile={responsiveRevamp && isMobile}
    >
      <ContactCell responsiveRevamp={responsiveRevamp}>
        {responsiveRevamp && <ContactLabel>Contacts</ContactLabel>}
        <ContactValue className="fs-exclude" alignRight={!responsiveRevamp}>
          {person.formattedPhoneNumber || "Phone number unavailable"}
        </ContactValue>
        <ContactValue className="fs-exclude" alignRight={!responsiveRevamp}>
          {person.emailAddress || "Email unavailable"}
        </ContactValue>
      </ContactCell>
      <ContactCell responsiveRevamp={responsiveRevamp}>
        <ContactLabel>Preferred Name</ContactLabel>
        <ContactValue>
          <PreferredName responsiveRevamp={responsiveRevamp} client={person} />
        </ContactValue>
      </ContactCell>
      <ContactCell responsiveRevamp={responsiveRevamp}>
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
      workflowsStore: { selectedPerson: person, featureVariants },
    } = useRootStore();
    const { isTablet, isMobile } = useIsMobile(true);

    usePersonTracking(person, () => {
      person?.trackProfileViewed();
    });

    if (!person) return null;

    return (
      <WorkflowsNavLayout>
        <Wrapper
          isMobile={isMobile}
          responsiveRevamp={!!featureVariants.responsiveRevamp}
        >
          <Header
            isMobile={!!featureVariants.responsiveRevamp && isTablet}
            responsiveRevamp={!!featureVariants.responsiveRevamp}
          >
            <ProfileCapsule
              avatarSize="lg"
              person={person}
              textSize={featureVariants.responsiveRevamp ? "sm" : "lg"}
              hideTooltip
              nameHoverState={false}
            />
            <ContactDetails
              person={person}
              responsiveRevamp={!!featureVariants.responsiveRevamp}
              isMobile={!!featureVariants.responsiveRevamp && isTablet}
            />
          </Header>
          <Content
            isMobile={!!featureVariants.responsiveRevamp && isTablet}
            responsiveRevamp={!!featureVariants.responsiveRevamp}
          >
            <div className="ProfileDetails">
              <AdditionalDetails
                responsiveRevamp={!!featureVariants.responsiveRevamp}
                person={person}
              />
            </div>
            <div>
              <SectionHeading
                responsiveRevamp={!!featureVariants.responsiveRevamp}
              >
                Opportunities
              </SectionHeading>
              <OpportunitiesAccordion person={person} formLinkButton />
              <PreviewTasks person={person} showSnoozeDropdown={false} />
            </div>
          </Content>
        </Wrapper>
      </WorkflowsNavLayout>
    );
  }
);
