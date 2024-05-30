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

import { formatWorkflowsDate } from "../../../../utils";
import { DetailsSubheading, SecureDetailsContent } from "../../styles";
import { OpportunityProfileProps } from "../../types";

export function UsMiMinMaxReleaseDates({
  opportunity,
}: OpportunityProfileProps): React.ReactElement | null {
  return (
    <>
      <DetailsSubheading>Min Release Date</DetailsSubheading>
      <SecureDetailsContent>
        {formatWorkflowsDate(
          opportunity.record?.formInformation.minReleaseDate,
        )}
      </SecureDetailsContent>
      <DetailsSubheading>Max Release Date</DetailsSubheading>
      <SecureDetailsContent>
        {formatWorkflowsDate(
          opportunity.record?.formInformation.maxReleaseDate,
        )}
      </SecureDetailsContent>
    </>
  );
}
