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

import React from "react";

import { formatWorkflowsDate } from "../../../../utils";
import { UsMoSanctionInfo } from "../../../../WorkflowsStore/Opportunity/UsMo";
import {
  DetailsHeading,
  SecureDetailsContent,
  SecureDetailsList,
} from "../../styles";

export function UsMoSanctions({
  sanctions,
}: {
  sanctions: UsMoSanctionInfo[] | undefined;
}): React.ReactElement {
  const D1_SANCTION_DATE_COPY = (
    sanctionStartDate: UsMoSanctionInfo["sanctionStartDate"],
    sanctionExpirationDate: UsMoSanctionInfo["sanctionExpirationDate"]
  ) => {
    const startDateText = sanctionStartDate
      ? formatWorkflowsDate(sanctionStartDate)
      : "START DATE UNAVAILABLE";
    const endDateText = sanctionExpirationDate
      ? formatWorkflowsDate(sanctionExpirationDate)
      : "END DATE UNAVAILABLE";
    return `${startDateText} - ${endDateText}`;
  };

  return (
    <SecureDetailsList>
      <DetailsHeading> D1 Sanctions in Past Year</DetailsHeading>
      {sanctions && sanctions.length > 0 ? (
        sanctions.map(
          ({
            sanctionCode,
            sanctionExpirationDate,
            sanctionId,
            sanctionStartDate,
          }: UsMoSanctionInfo) => {
            return (
              <SecureDetailsContent key={`${sanctionId}`}>
                {D1_SANCTION_DATE_COPY(
                  sanctionStartDate,
                  sanctionExpirationDate
                )}
              </SecureDetailsContent>
            );
          }
        )
      ) : (
        <SecureDetailsContent>None</SecureDetailsContent>
      )}
    </SecureDetailsList>
  );
}
