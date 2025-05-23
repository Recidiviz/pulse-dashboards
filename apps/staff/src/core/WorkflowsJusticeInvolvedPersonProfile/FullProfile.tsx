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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import React from "react";
import styled from "styled-components/macro";
import superjson from "superjson";

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { Client } from "../../WorkflowsStore";
import { Resident } from "../../WorkflowsStore/Resident";
import { CaseNoteSearch } from "../CaseNoteSearch";
import { trpc } from "../CaseNoteSearch/trpc";
import { usePersonTracking } from "../hooks/usePersonTracking";
import { ProfileCapsule } from "../PersonCapsules";
import { CaseloadTasksHydrator } from "../TasksHydrator/TasksHydrator";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import { PreviewTasks } from "../WorkflowsTasks/PreviewTasks";
import {
  ClientEmployer,
  ClientHousing,
  FinesAndFees,
  Milestones,
  SpecialConditions,
} from "./ClientDetailSidebarComponents";
import { UsUtDates } from "./ClientDetailSidebarComponents/UsUtDates";
import ClientDetailsInput from "./ClientDetailsInput";
import { OpportunitiesAccordion } from "./OpportunitiesAccordion";
import { UsIaActionPlansAndNotes } from "./OpportunityDetailSidebarComponents/US_IA";
import { OpportunitySidePanelProvider } from "./OpportunitySidePanelContext";
import { PartialTime } from "./PartialTime";
import { PreferredContact } from "./PreferredContact";
import { ResidentHousing } from "./ResidentDetailSidebarComponents/ResidentHousing";
import { SentenceProgress } from "./SentenceProgress";
import { Divider, PhoneNumber } from "./styles";
import {
  ClientProfileProps,
  PersonProfileProps,
  ResidentProfileProps,
} from "./types";
import { UsArResidentInformation } from "./UsAr/UsArResidentInformation";
import { UsAzResidentInformation } from "./UsAz/UsAzResidentInformation";
import { UsIdResidentInformation } from "./UsId/UsIdResidentInformation";
import { UsMoResidentInformation } from "./UsMo/UsMoResidentInformation";
import { UsNdResidentInformation } from "./UsNd/UsNdResidentInformation";

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

const TimelineHeading = styled(Sans16)`
  color: ${palette.slate80};
`;

const CasenoteSearchWrapper = styled.div`
  & ${Divider} {
    display: block;
    margin-bottom: 0;
  }
`;

const ProfileDetailsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
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
      {client.stateCode === "US_UT" ? (
        <UsUtDates client={client} />
      ) : (
        <>
          <PartialTime person={client} />
          {client.portionServedDates.length > 0 && <Divider />}
        </>
      )}
      {client.profileMilestones.length > 0 && (
        <>
          <Milestones client={client} />
          <Divider />
        </>
      )}
      {client.address && (
        <>
          <ClientHousing client={client} /> <Divider />
        </>
      )}
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
      {client.opportunities.usIaEarlyDischarge?.length && (
        <UsIaActionPlansAndNotes
          opportunity={client.opportunities.usIaEarlyDischarge[0]}
        />
      )}
    </>
  );
});

const ResidentDetails = observer(function ResidentDetails({
  resident,
}: ResidentProfileProps): React.ReactElement {
  return (
    <>
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
    case "US_AZ":
      return <UsAzResidentInformation resident={resident} />;
    case "US_ID":
      return <UsIdResidentInformation resident={resident} />;
    case "US_MO":
      return <UsMoResidentInformation resident={resident} />;
    case "US_ND":
      return <UsNdResidentInformation resident={resident} />;
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
        text={name}
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
          {person.phoneNumber ? (
            <PhoneNumber href={`tel:${person.rawPhoneNumber}`}>
              {person.phoneNumber}
            </PhoneNumber>
          ) : (
            "Phone number unavailable"
          )}
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
      userStore,
    } = useRootStore();
    const { isTablet, isMobile } = useIsMobile(true);
    const { caseNoteSearch } = useFeatureVariants();

    usePersonTracking(person, () => {
      person?.trackProfileViewed();
    });

    if (!person) return null;

    // MO residents don't have start/end dates or officer IDs in their resident record,
    // so we do not show the sidebar timeline for MO residents
    const isMoResident =
      person instanceof Resident && person.stateCode === "US_MO";
    const showFullWidthTimeline = !isMoResident;
    const sidebarHeadingText = showFullWidthTimeline
      ? "Additional information"
      : "Progress toward success";

    const queryClient = new QueryClient();

    const trpcClient = trpc.createClient({
      links: [
        httpBatchLink({
          url: import.meta.env["VITE_CASE_NOTES_API_URL"],
          async headers() {
            const token = userStore.getToken ? await userStore.getToken() : "";
            const stateCode = person.stateCode;

            return {
              Authorization: `Bearer ${token}`,
              StateCode: `${stateCode}`,
            };
          },
        }),
      ],
      // Required to get Date objects to serialize correctly.
      transformer: superjson,
    });

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
              <trpc.Provider client={trpcClient} queryClient={queryClient}>
                <QueryClientProvider client={queryClient}>
                  <CaseNoteSearch />
                </QueryClientProvider>
              </trpc.Provider>
              <Divider />
            </CasenoteSearchWrapper>
          )}

          {showFullWidthTimeline && (
            <>
              <TimelineHeading>Progress toward success</TimelineHeading>
              <SentenceProgress person={person} />
              <Divider />
            </>
          )}
          <Content isMobile={isTablet}>
            <ProfileDetailsWrapper>
              {person.supervisionTasks?.orderedTasks && (
                <div>
                  <SectionHeading>Tasks</SectionHeading>
                  <Divider />
                  <CaseloadTasksHydrator
                    hydrated={
                      <PreviewTasks
                        person={person}
                        showSnoozeDropdown={false}
                      />
                    }
                  />
                </div>
              )}
              <div>
                <SectionHeading>{sidebarHeadingText}</SectionHeading>
                <Divider />
                <AdditionalDetails person={person} />
              </div>
            </ProfileDetailsWrapper>
            <div>
              <SectionHeading>Opportunities</SectionHeading>
              <OpportunitySidePanelProvider>
                <OpportunitiesAccordion person={person} formLinkButton />
              </OpportunitySidePanelProvider>
            </div>
          </Content>
        </Wrapper>
      </WorkflowsNavLayout>
    );
  },
);
