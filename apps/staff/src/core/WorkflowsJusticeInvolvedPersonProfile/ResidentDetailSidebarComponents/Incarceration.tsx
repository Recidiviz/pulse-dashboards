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

import React from "react";

import { useRootStore } from "../../../components/StoreProvider";
import { formatWorkflowsDate } from "../../../utils";
import WorkflowsOfficerName from "../../WorkflowsOfficerName";
import { PartialTime } from "../PartialTime";
import {
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
} from "../styles";
import {
  ResidentProfileProps,
  ResidentWithOptionalOpportunityProps,
} from "../types";
import { UsMiMinMaxReleaseDates } from "./US_MI/UsMiMinMaxReleaseDates";
import { UsNdIncarcerationDetails } from "./US_ND/UsNdIncarcerationDetails";
import { UsTnFacilityAdmissionDateSubsection } from "./US_TN/UsTnFacilityAdmissionDateSubsection";

function ReleaseDate({
  resident,
  opportunity,
}: ResidentWithOptionalOpportunityProps): React.ReactElement {
  const {
    tenantStore: { releaseDateCopy },
  } = useRootStore();
  if (
    opportunity &&
    [
      "usMiSecurityClassificationCommitteeReview",
      "usMiAddInPersonSecurityClassificationCommitteeReview",
      "usMiWardenInPersonSecurityClassificationCommitteeReview",
    ].includes(opportunity.type)
  ) {
    return <UsMiMinMaxReleaseDates opportunity={opportunity} />;
  }

  return (
    <>
      <DetailsSubheading>{releaseDateCopy}</DetailsSubheading>
      <SecureDetailsContent>
        {resident.onLifeSentence
          ? "Life sentence"
          : formatWorkflowsDate(resident.releaseDate)}
      </SecureDetailsContent>
    </>
  );
}

export function Incarceration({
  resident,
  opportunity,
}: ResidentWithOptionalOpportunityProps): React.ReactElement {
  return (
    <DetailsSection>
      <DetailsHeading>Incarceration</DetailsHeading>
      <SecureDetailsContent>
        <DetailsList>
          <DetailsSubheading>Start</DetailsSubheading>
          <SecureDetailsContent>
            {formatWorkflowsDate(resident.admissionDate)}
          </SecureDetailsContent>
          <PartialTime person={resident} />
          <ReleaseDate resident={resident} opportunity={opportunity} />
          <StateSpecificIncarcerationDetails resident={resident} />

          {resident.assignedStaffId && (
            <>
              <DetailsSubheading>Case Manager</DetailsSubheading>
              <SecureDetailsContent>
                <WorkflowsOfficerName officerId={resident.assignedStaffId} />
              </SecureDetailsContent>
            </>
          )}
          <DetailsSubheading>Facility</DetailsSubheading>
          <SecureDetailsContent>{resident.facilityId}</SecureDetailsContent>
          <DetailsSubheading>Unit</DetailsSubheading>
          <SecureDetailsContent>{resident.unitId}</SecureDetailsContent>
          <UsTnFacilityAdmissionDateSubsection resident={resident} />
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
}

function StateSpecificIncarcerationDetails({
  resident,
}: ResidentProfileProps): React.ReactElement | null {
  switch (resident.stateCode) {
    case "US_ND":
      return <UsNdIncarcerationDetails resident={resident} />;
    default:
      return null;
  }
}
