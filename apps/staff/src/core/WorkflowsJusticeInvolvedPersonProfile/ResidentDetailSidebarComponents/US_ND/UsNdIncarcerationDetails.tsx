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

import { fieldToDate } from "~datatypes";

import { formatWorkflowsDate } from "../../../../utils";
import { optionalFieldToDate } from "../../../../WorkflowsStore/utils";
import { DetailsSubheading, SecureDetailsContent } from "../../styles";
import { ResidentProfileProps } from "../../types";

export function UsNdIncarcerationDetails({
  resident,
}: ResidentProfileProps): React.ReactElement | null {
  const { metadata } = resident;
  if (metadata.stateCode !== "US_ND") return null;

  const { paroleDate, paroleReviewDate } = metadata;

  return (
    <>
      <DetailsSubheading>Parole Start Date</DetailsSubheading>
      <SecureDetailsContent>
        {paroleDate
          ? formatWorkflowsDate(optionalFieldToDate(paroleDate))
          : "N/A"}
      </SecureDetailsContent>

      <DetailsSubheading>Parole Review Date</DetailsSubheading>
      <SecureDetailsContent>
        {formatWorkflowsDate(fieldToDate(paroleReviewDate))}
      </SecureDetailsContent>
    </>
  );
}
