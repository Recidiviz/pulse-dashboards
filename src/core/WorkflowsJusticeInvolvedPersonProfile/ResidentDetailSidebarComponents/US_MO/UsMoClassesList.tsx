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
  CaseNoteTitle,
  DetailsList,
  SecureDetailsContent,
} from "../../styles";

export function UsMoClassesList({
  classes,
}: {
  classes: UsMoClassInfo[];
}): React.ReactElement {
  return (
    <>
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
                <SecureDetailsContent key={`${classTitle}-${startDate}`}>
                  <CaseNoteTitle>
                    {classTitle || "CLASS TITLE UNAVAILABLE"}
                  </CaseNoteTitle>
                  <br />
                  <CaseNoteDate>
                    {formatWorkflowsDate(startDate)} -{" "}
                    {endDate ? formatWorkflowsDate(endDate) : "current"}
                  </CaseNoteDate>
                  <br />
                  Exit Reason: {classExitReason || "N/A"}
                </SecureDetailsContent>
              );
            }
          )}
        </DetailsList>
      ) : (
        "None"
      )}
    </>
  );
}
