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

import { differenceInDays } from "date-fns";
import React from "react";

import { formatWorkflowsDate } from "../../../../utils";
import { UsMoRestrictiveHousingStatusHearingReferralRecord } from "../../../../WorkflowsStore/Opportunity/UsMo/UsMoRestrictiveHousingStatusHearingOpportunity/UsMoRestrictiveHousingStatusHearingReferralRecord";
import {
  CaseNoteDate,
  CaseNoteTitle,
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
  SecureDetailsList,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";
import { UsMoClassesList } from "./UsMoClassesList";
import { UsMoConductViolationsList } from "./UsMoConductViolationsList";
import { UsMoSanctionsList } from "./UsMoSanctionsList";

export function UsMoRestrictiveHousing({
  opportunity,
}: OpportunityProfileProps): React.ReactElement | null {
  const opportunityRecord =
    opportunity.record as UsMoRestrictiveHousingStatusHearingReferralRecord;
  if (!opportunityRecord) return null;

  const {
    housingUseCode,
    restrictiveHousingStartDate,
    buildingNumber,
    complexNumber,
    roomNumber,
    bedNumber,
    mostRecentHearingDate,
    mostRecentHearingFacility,
    aicScore,
    unwaivedEnemies,
    majorCdvs,
    cdvsSinceLastHearing,
    numMinorCdvsBeforeLastHearing,
    classesRecent,
    mentalHealthAssessmentScore,
    mostRecentHearingComments,
    allSanctions,
  } = opportunityRecord.metadata;

  return (
    <>
      <DetailsSection>
        <DetailsHeading>Current Restrictive Housing Placement</DetailsHeading>
        <SecureDetailsContent>
          <SecureDetailsList>
            <DetailsSubheading>Type</DetailsSubheading>
            <SecureDetailsContent>{housingUseCode}</SecureDetailsContent>

            <DetailsSubheading>Length of Stay</DetailsSubheading>
            <SecureDetailsContent>
              {formatWorkflowsDate(restrictiveHousingStartDate)} to{" "}
              {formatWorkflowsDate(new Date())}
              <CaseNoteDate>
                {" "}
                – {differenceInDays(
                  new Date(),
                  restrictiveHousingStartDate
                )}{" "}
                days
              </CaseNoteDate>
            </SecureDetailsContent>

            <DetailsSubheading>Current Location</DetailsSubheading>
            <SecureDetailsContent>
              Building {buildingNumber}, Complex {complexNumber}, Room{" "}
              {roomNumber}, Bed {bedNumber}
            </SecureDetailsContent>

            <DetailsSubheading>
              Last Restrictive Housing Status Hearing
            </DetailsSubheading>

            <SecureDetailsContent>
              {mostRecentHearingDate
                ? `${formatWorkflowsDate(mostRecentHearingDate)} 
                (${differenceInDays(
                  new Date(),
                  mostRecentHearingDate
                )} days ago)`
                : "None"}
            </SecureDetailsContent>

            <DetailsSubheading>Last Hearing Facility</DetailsSubheading>
            <SecureDetailsContent>
              {mostRecentHearingFacility || "None"}
            </SecureDetailsContent>
            <DetailsSubheading>Adult in Custody (AIC) Score</DetailsSubheading>
            <SecureDetailsContent>{aicScore}</SecureDetailsContent>
            <DetailsSubheading>
              Mental Health Assessment Score
            </DetailsSubheading>
            <SecureDetailsContent>
              {mentalHealthAssessmentScore}
            </SecureDetailsContent>
            <DetailsSubheading>Unwaived Enemies</DetailsSubheading>
            <SecureDetailsContent>
              {unwaivedEnemies && unwaivedEnemies.length > 0
                ? unwaivedEnemies.map(
                    ({
                      enemyExternalId,
                      enemyHousingUseCode,
                      enemyBuildingNumber,
                      enemyComplexNumber,
                      enemyRoomNumber,
                      enemyBedNumber,
                    }) => (
                      <span className="fs-exclude" key={`${enemyExternalId}`}>
                        <CaseNoteTitle>[ID# {enemyExternalId}] </CaseNoteTitle>
                        Housing Use Code: <b>{enemyHousingUseCode}</b>
                        <br />
                        Building {enemyBuildingNumber}, Complex{" "}
                        {enemyComplexNumber}, Room {enemyRoomNumber}, Bed{" "}
                        {enemyBedNumber}
                      </span>
                    )
                  )
                : "None"}
            </SecureDetailsContent>
          </SecureDetailsList>
        </SecureDetailsContent>
      </DetailsSection>

      <UsMoSanctionsList sanctions={allSanctions} />

      <DetailsSection>
        <DetailsHeading>Conduct Violations (CDVs)</DetailsHeading>
        <SecureDetailsList>
          <DetailsSubheading>
            Major Conduct Violations, Past 12 Months
          </DetailsSubheading>
          <UsMoConductViolationsList cdvs={majorCdvs} />
          <DetailsSubheading>
            Conduct Violations, Since Last Hearing
          </DetailsSubheading>
          <UsMoConductViolationsList cdvs={cdvsSinceLastHearing} />
          <DetailsSubheading>
            Minor Conduct Violations, Past 6 Months
          </DetailsSubheading>
          {numMinorCdvsBeforeLastHearing || (
            <SecureDetailsContent>None</SecureDetailsContent>
          )}
        </SecureDetailsList>
      </DetailsSection>

      <DetailsSection>
        <DetailsHeading>Most Recent 10 Classes</DetailsHeading>
        <SecureDetailsContent>
          <UsMoClassesList
            classes={(classesRecent || [])
              .sort(
                (a, b) =>
                  new Date(b.startDate).getTime() -
                  new Date(a.startDate).getTime()
              )
              .slice(0, 10)}
          />
        </SecureDetailsContent>
      </DetailsSection>

      <DetailsSection>
        <DetailsHeading>Previous Hearing Comments</DetailsHeading>
        <SecureDetailsContent>
          <DetailsList>
            <SecureDetailsContent>
              {mostRecentHearingComments}
            </SecureDetailsContent>
          </DetailsList>
        </SecureDetailsContent>
      </DetailsSection>
    </>
  );
}
