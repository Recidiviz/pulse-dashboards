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

import { differenceInDays } from "date-fns";
import React from "react";

import { formatWorkflowsDate } from "../../../../utils";
import { UsMoOverdueRestrictiveHousingBase } from "../../../../WorkflowsStore/Opportunity/UsMo/UsMoOverdueRestrictiveHousingOpportunityBase/UsMoOverdueRestrictiveHousingOpportunityBase";
import { BaseUsMoOverdueRestrictiveHousingReferralRecord } from "../../../../WorkflowsStore/Opportunity/UsMo/UsMoOverdueRestrictiveHousingOpportunityBase/UsMoOverdueRestrictiveHousingReferralRecord";
import { Resident } from "../../../../WorkflowsStore/Resident";
import {
  CaseNoteDate,
  DetailsHeading,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
  SecureDetailsList,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";
import { UsMoClasses } from "./UsMoClasses";
import { UsMoConductViolations } from "./UsMoConductViolations";
import { UsMoMostRecentHearingComments } from "./UsMoMostRecentHearingComments";
import { UsMoSanctions } from "./UsMoSanctions";
import { UsMoSolitary } from "./UsMoSolitary";
import { UsMoUnwaivedEnemies } from "./UsMoUnwaivedEnemies";

export function UsMoRestrictiveHousing({
  opportunity,
}: OpportunityProfileProps): React.ReactElement | null {
  if (!(opportunity instanceof UsMoOverdueRestrictiveHousingBase)) {
    return null;
  }
  const opportunityRecord =
    opportunity.record as BaseUsMoOverdueRestrictiveHousingReferralRecord;
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
                  restrictiveHousingStartDate,
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
                  mostRecentHearingDate,
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
          </SecureDetailsList>
        </SecureDetailsContent>
      </DetailsSection>

      <UsMoUnwaivedEnemies unwaivedEnemies={unwaivedEnemies} />

      <UsMoSanctions sanctions={allSanctions} />
      <UsMoSolitary person={opportunity.person as Resident} />

      <UsMoConductViolations
        majorCdvs={majorCdvs}
        cdvsSinceLastHearing={cdvsSinceLastHearing}
        numMinorCdvsBeforeLastHearing={numMinorCdvsBeforeLastHearing}
      />

      <UsMoClasses
        classes={(classesRecent || [])
          .sort(
            (a, b) =>
              new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
          )
          .slice(0, 10)}
      />

      <UsMoMostRecentHearingComments
        mostRecentHearingComments={mostRecentHearingComments}
      />
    </>
  );
}
