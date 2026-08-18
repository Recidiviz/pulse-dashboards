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
import { Fragment } from "react";
import styled from "styled-components";

import { Icon, IconSVG, palette } from "~design-system";

import { formatDocId } from "../../../ParoleStore/utils";
import { NAV_BAR_HEIGHT } from "../../NavigationLayout";
import { PaddedSectionCardBody } from "./PaddedSectionCardBody";
import {
  PAROLE_SECTION_LABELS,
  ParoleSectionName,
} from "./ParoleSectionComponents";
import {
  AlertBanner,
  calculateAge,
  FactLabel,
  FactStack,
  formatDate,
  Hr,
  PAROLE_SECTION_IDS,
  scrollToSection,
  SectionCard,
  SectionStack,
  SubsectionTitle,
} from "./shared";

const PAROLE_RETURN_COLOR = palette.signal.notification;
const PAROLE_RETURN_BACKGROUND_COLOR = "rgba(35, 124, 175, 0.08)";

const NameHeading = styled.div`
  ${typography.Serif24}
  color: ${palette.pine2};
  margin-bottom: 0.5rem;
`;

const DocId = styled.div`
  margin-bottom: 1rem;
`;

const FactRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto auto;
  grid-auto-flow: column;
  column-gap: 1rem;
  row-gap: 0.25em;
`;

const FactRowStack = styled(FactStack)`
  display: contents;
`;

const FullWidthHr = styled(Hr)`
  width: auto;
  margin: 0 -1rem;
`;

const FullWidthAlertBanner = styled(AlertBanner)`
  margin-left: -1rem;
  margin-right: -1rem;
`;

const InfoCard = styled(SectionCard)`
  border-bottom: none;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
`;

const SectionNavCard = styled(SectionCard)`
  position: sticky;
  top: ${rem(NAV_BAR_HEIGHT + spacing.lg)};
  border-top-left-radius: 0;
  border-top-right-radius: 0;
`;

const NavCardBody = styled.div`
  padding: 1rem 0;
`;

const SectionNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SectionNavButton = styled.button`
  ${typography.Sans14}
  display: block;
  width: 100%;
  padding: 0 1rem;
  border: none;
  background: none;
  color: ${palette.pine1};
  text-align: left;
  cursor: pointer;

  &:hover {
    color: ${palette.signal.links};
  }
`;

export function CaseProfileSidebar({
  name,
  docId,
  custodyLevel,
  gender,
  dob,
  hearingDate,
  currentFacility,
  caseManagerName,
  sentenceStartDate,
  paroleEligibilityDate,
  mandatoryReleaseDate,
  isParoleReturn,
  sections,
}: {
  name: string;
  docId: string;
  custodyLevel: string;
  gender: string;
  dob: string;
  hearingDate: string | undefined;
  currentFacility: string;
  caseManagerName: string;
  sentenceStartDate: string;
  paroleEligibilityDate: string;
  mandatoryReleaseDate: string;
  isParoleReturn: boolean | undefined;
  sections: ParoleSectionName[];
}) {
  return (
    <>
      <InfoCard>
        <PaddedSectionCardBody>
          <SectionStack>
            {isParoleReturn && (
              <FullWidthAlertBanner
                $color={PAROLE_RETURN_COLOR}
                $backgroundColor={PAROLE_RETURN_BACKGROUND_COLOR}
                $textColor={PAROLE_RETURN_COLOR}
                $fontWeight="600"
                $alignItems="center"
                $marginBottom="0"
              >
                <Icon
                  kind={IconSVG.Info}
                  width={16}
                  color={PAROLE_RETURN_COLOR}
                  aria-hidden="true"
                />
                Parole Return
              </FullWidthAlertBanner>
            )}
            <div>
              <NameHeading>{name}</NameHeading>
              <DocId>{formatDocId(docId)}</DocId>
              <FactLabel>Incarcerated | {custodyLevel}</FactLabel>
            </div>

            <FullWidthHr />

            <div>
              <SubsectionTitle>Personal Details</SubsectionTitle>
              <FactRow>
                <FactRowStack>
                  <div>Gender</div>
                  <FactLabel>{gender}</FactLabel>
                </FactRowStack>
                <FactRowStack>
                  <div>Age</div>
                  <FactLabel>{calculateAge(dob)}</FactLabel>
                </FactRowStack>
                <FactRowStack>
                  <div>DOB</div>
                  <FactLabel>{formatDate(dob)}</FactLabel>
                </FactRowStack>
              </FactRow>
            </div>

            <Hr />

            <div>
              <SubsectionTitle>Hearing Info</SubsectionTitle>
              <FactRow>
                <FactRowStack>
                  <div>Hearing Date</div>
                  <FactLabel>
                    {hearingDate ? formatDate(hearingDate) : "Not scheduled"}
                  </FactLabel>
                </FactRowStack>
                <FactRowStack>
                  <div>Facility</div>
                  <FactLabel>{currentFacility}</FactLabel>
                </FactRowStack>
                <FactRowStack>
                  <div>Case Manager</div>
                  <FactLabel>{caseManagerName}</FactLabel>
                </FactRowStack>
              </FactRow>
            </div>

            <Hr />

            <div>
              <SubsectionTitle>Sentence Info</SubsectionTitle>
              <FactRow>
                <FactRowStack>
                  <div>Sentence Start Date</div>
                  <FactLabel>{formatDate(sentenceStartDate)}</FactLabel>
                </FactRowStack>
                <FactRowStack>
                  <div>Parole Eligibility Date (PED)</div>
                  <FactLabel>{formatDate(paroleEligibilityDate)}</FactLabel>
                </FactRowStack>
                <FactRowStack>
                  <div>Mandatory Release Date (MRD)</div>
                  <FactLabel>{formatDate(mandatoryReleaseDate)}</FactLabel>
                </FactRowStack>
              </FactRow>
            </div>
          </SectionStack>
        </PaddedSectionCardBody>
      </InfoCard>

      <SectionNavCard>
        <NavCardBody>
          <SectionNav>
            {sections.map((sectionName, index) => (
              <Fragment key={sectionName}>
                {index > 0 && <Hr />}
                <SectionNavButton
                  type="button"
                  onClick={() =>
                    scrollToSection(PAROLE_SECTION_IDS[sectionName])
                  }
                >
                  {PAROLE_SECTION_LABELS[sectionName]}
                </SectionNavButton>
              </Fragment>
            ))}
          </SectionNav>
        </NavCardBody>
      </SectionNavCard>
    </>
  );
}
