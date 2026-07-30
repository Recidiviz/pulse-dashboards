// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { palette } from "~design-system";

import { statusStyles } from "../../BadgePill/BadgePill";
import { SectionCard } from "../../SectionCard";
import { PaddedSectionCardBody } from "./PaddedSectionCardBody";
import {
  calculateAge,
  FactGrid,
  FactLabel,
  FactValue,
  formatDate,
  Hr,
  parseIsoDate,
  SectionStack,
  SubsectionTitle,
} from "./shared";

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin: 0 0 1rem;
`;

const NameHeading = styled.div`
  ${typography.Serif24}
  color: ${palette.pine2};
  margin-bottom: 0.5rem;
`;

const IdentityMeta = styled.div`
  color: ${palette.slate70};
  display: flex;
  gap: ${rem(spacing.lg)};
`;

const HearingBadge = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(4)};
  background: ${statusStyles.BLUE.backgroundColor};
  color: ${statusStyles.BLUE.color};
  border: 1px solid ${statusStyles.BLUE.borderColor};
  border-radius: ${rem(6)};
  padding: ${rem(spacing.sm)} ${rem(spacing.md)};
  white-space: nowrap;
`;

const HearingBadgeHeading = styled.div`
  ${typography.Sans12}
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${statusStyles.BLUE.color};
`;

const HearingBadgeDate = styled.div`
  font-weight: 600;
`;

const HearingBadgeTime = styled.div`
  color: ${statusStyles.BLUE.color};
  font-size: 13px;
  font-weight: 400;
`;

const formatHearingDate = (dateString: string) =>
  parseIsoDate(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export function IdentityHeaderSection({
  name,
  docId,
  dob,
  hearingDate,
  hearingTime,
  currentFacility,
  custodyLevel,
  caseManagerName,
  sentenceStartDate,
  paroleEligibilityDate,
  mandatoryReleaseDate,
}: {
  name: string;
  docId: string;
  dob: string;
  hearingDate: string | undefined;
  hearingTime: string | undefined;
  currentFacility: string;
  custodyLevel: string;
  caseManagerName: string;
  sentenceStartDate: string;
  paroleEligibilityDate: string;
  mandatoryReleaseDate: string;
}) {
  return (
    <SectionCard>
      <PaddedSectionCardBody>
        <HeaderRow>
          <div>
            <NameHeading>{name}</NameHeading>
            <IdentityMeta>
              <span>{docId}</span>
              <span>
                Date of Birth: {formatDate(dob)} (Age {calculateAge(dob)})
              </span>
            </IdentityMeta>
          </div>
          {hearingDate && (
            <HearingBadge>
              <HearingBadgeHeading>Hearing Scheduled</HearingBadgeHeading>
              <HearingBadgeDate>
                {formatHearingDate(hearingDate)}
              </HearingBadgeDate>
              {hearingTime && (
                <HearingBadgeTime>{hearingTime}</HearingBadgeTime>
              )}
            </HearingBadge>
          )}
        </HeaderRow>

        <SectionStack>
          <FactGrid>
            <div>
              <FactLabel>Hearing Date</FactLabel>
              <FactValue>
                {hearingDate ? formatHearingDate(hearingDate) : "Not scheduled"}
              </FactValue>
            </div>
            <div>
              <FactLabel>Current Facility</FactLabel>
              <FactValue>{currentFacility}</FactValue>
            </div>
            <div>
              <FactLabel>Case Manager</FactLabel>
              <FactValue>{caseManagerName}</FactValue>
            </div>
            <div>
              <FactLabel>Custody Level</FactLabel>
              <FactValue>{custodyLevel}</FactValue>
            </div>
          </FactGrid>

          <Hr />

          <div>
            <SubsectionTitle>Sentence Information</SubsectionTitle>
            <FactGrid>
              <div>
                <FactLabel>Sentence Start Date</FactLabel>
                <FactValue>{formatDate(sentenceStartDate)}</FactValue>
              </div>
              <div>
                <FactLabel>Parole Eligibility Date (PED)</FactLabel>
                <FactValue>{formatDate(paroleEligibilityDate)}</FactValue>
              </div>
              <div>
                <FactLabel>Mandatory Release Date (MRD)</FactLabel>
                <FactValue>{formatDate(mandatoryReleaseDate)}</FactValue>
              </div>
            </FactGrid>
          </div>
        </SectionStack>
      </PaddedSectionCardBody>
    </SectionCard>
  );
}
