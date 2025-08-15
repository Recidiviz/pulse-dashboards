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

import { sortBy } from "lodash";
import React from "react";

import { formatWorkflowsDate } from "../../../../utils";
import {
  DetailsContent,
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
} from "../../styles";
import { ResidentProfileProps } from "../../types";

const UsMoOffenseHistory: React.FC<ResidentProfileProps> = ({ resident }) => {
  const metadata = resident.metadata;
  if (metadata.stateCode !== "US_MO") return null;

  const priorCycleSentences = sortBy(
    metadata.priorCycleSentences,
    (s) => -(s.offenseDate ?? 0),
  );

  return (
    <DetailsSection>
      <DetailsHeading>Offense History</DetailsHeading>
      <SecureDetailsContent>
        {priorCycleSentences.length === 0 && "None Noted"}
        <DetailsList>
          {priorCycleSentences.map(({ offenseDate, offense }) => (
            <React.Fragment key={`${offense}-${offenseDate}`}>
              <DetailsSubheading>{offense}</DetailsSubheading>
              <DetailsContent>
                {offenseDate
                  ? formatWorkflowsDate(offenseDate)
                  : "Date Unknown"}
              </DetailsContent>
            </React.Fragment>
          ))}
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
};

export default UsMoOffenseHistory;
