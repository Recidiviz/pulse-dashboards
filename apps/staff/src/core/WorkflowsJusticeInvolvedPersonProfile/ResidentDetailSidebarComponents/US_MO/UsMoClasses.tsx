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
import { UsMoClassInfo } from "../../../../WorkflowsStore/Opportunity/UsMo";
import {
  CaseNoteDate,
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
} from "../../styles";

export function UsMoClasses({
  classes,
}: {
  classes: UsMoClassInfo[];
}): React.ReactElement {
  return (
    <DetailsSection>
      <DetailsHeading>Up to 10 Most Recent Classes</DetailsHeading>
      <SecureDetailsContent>
        {classes && classes.length > 0 ? (
          <DetailsList>
            {classes.map(
              ({
                startDate,
                endDate,
                classTitle,
                classExitReason,
              }: UsMoClassInfo) => {
                return (
                  <div key={`${classTitle}-${startDate}`}>
                    <DetailsSubheading>
                      {classTitle || "CLASS TITLE UNAVAILABLE"}
                    </DetailsSubheading>
                    <SecureDetailsContent>
                      <CaseNoteDate>
                        {formatWorkflowsDate(startDate)} -{" "}
                        {endDate ? formatWorkflowsDate(endDate) : "present"}
                      </CaseNoteDate>
                      <br />
                      Exit Reason: {classExitReason || "N/A"}
                    </SecureDetailsContent>
                  </div>
                );
              },
            )}
          </DetailsList>
        ) : (
          "None"
        )}
      </SecureDetailsContent>
    </DetailsSection>
  );
}
