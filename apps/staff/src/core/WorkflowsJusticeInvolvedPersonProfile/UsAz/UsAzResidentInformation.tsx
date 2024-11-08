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

import { CaseNotes } from "../OpportunityDetailSidebarComponents";
import { UsAzDates } from "../ResidentDetailSidebarComponents/US_AZ/UsAzDates";
import { Divider } from "../styles";
import { ResidentProfileProps } from "../types";

export function UsAzResidentInformation({
  resident,
}: ResidentProfileProps): React.ReactElement | null {
  const { stateCode } = resident;

  if (stateCode !== "US_AZ") return null;

  // In Arizona, case notes are used to display the resident's home plan for
  // transition program release opportunities
  const opportunitiesWithCaseNotes = resident.flattenedOpportunities.filter(
    (opp) =>
      [
        "usAzOverdueForACISDTP",
        "usAzOverdueForACISTPR",
        "usAzReleaseToDTP",
        "usAzReleaseToTPR",
      ].includes(opp.type),
  );

  return (
    <>
      <Divider />
      <UsAzDates resident={resident} />
      {opportunitiesWithCaseNotes.length > 0 && (
        <>
          <Divider />
          <CaseNotes opportunity={opportunitiesWithCaseNotes[0]} />
        </>
      )}
    </>
  );
}
