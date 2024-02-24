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

import { toTitleCase } from "@artsy/to-title-case";
import { startCase } from "lodash";

import { UsMoMostRecentHearingCommentsMetadata } from "../../../../WorkflowsStore/Opportunity/UsMo/common";
import {
  DetailsHeading,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
  SecureDetailsList,
} from "../../styles";

// =============================================================================

export function UsMoMostRecentHearingComments(props: {
  mostRecentHearingComments: UsMoMostRecentHearingCommentsMetadata;
}): React.ReactElement {
  const { mostRecentHearingComments } = props;

  return (
    <DetailsSection>
      <DetailsHeading>Previous Hearing Comments</DetailsHeading>
      <SecureDetailsContent>
        {mostRecentHearingComments &&
        typeof mostRecentHearingComments === "object" ? (
          <SecureDetailsList>
            {Object.entries(mostRecentHearingComments).map(([key, value]) => (
              <div key={key}>
                <DetailsSubheading>
                  {toTitleCase(startCase(key).toLowerCase())}
                </DetailsSubheading>
                <SecureDetailsContent>
                  {!value || value === "" ? "None" : value}
                </SecureDetailsContent>
              </div>
            ))}
          </SecureDetailsList>
        ) : (
          mostRecentHearingComments ?? "None"
        )}
      </SecureDetailsContent>
    </DetailsSection>
  );
}
