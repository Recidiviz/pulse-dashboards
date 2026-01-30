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

const UsUtProgramParticipation: React.FC<ResidentProfileProps> = ({
  resident,
}) => {
  const metadata = resident.metadata;
  if (metadata.stateCode !== "US_UT") return null;

  const allPrograms = sortBy(
    metadata.programs,
    (p) => -(p.completionDate ?? 0),
  );

  return (
    <DetailsSection>
      <DetailsHeading>Program Participation</DetailsHeading>
      <SecureDetailsContent>
        {allPrograms.length === 0 && "None Noted"}
        <DetailsList>
          {allPrograms.map(({ completionDate, program, status }) => (
            <React.Fragment>
              {/* No key because we can't guarantee uniqueness */}
              <DetailsSubheading>{program}</DetailsSubheading>
              <DetailsContent>
                {status === "SUCCESSFUL COMPLETION"
                  ? `Completed on ${formatWorkflowsDate(completionDate)}`
                  : status}
              </DetailsContent>
            </React.Fragment>
          ))}
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
};

export default UsUtProgramParticipation;
