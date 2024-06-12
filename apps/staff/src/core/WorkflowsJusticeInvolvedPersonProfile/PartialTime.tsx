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

import { observer } from "mobx-react-lite";
import React from "react";

import { formatWorkflowsDate } from "../../utils";
import { Client } from "../../WorkflowsStore";
import { Resident } from "../../WorkflowsStore/Resident";
import { DetailsSubheading, SecureDetailsContent } from "./styles";
import { UsMeSCCPEligibilityDate } from "./UsMe/UsMeSCCPEligibilityDate";

export const PartialTime = observer(function PartialTime({
  person,
}: {
  person: Resident | Client;
}) {
  const dates = person.portionServedDates;
  return (
    <>
      {person instanceof Resident && (
        <UsMeSCCPEligibilityDate person={person} />
      )}
      {dates.map(({ heading, date }) => (
        <React.Fragment key={heading}>
          <DetailsSubheading>{heading}</DetailsSubheading>
          <SecureDetailsContent>
            {formatWorkflowsDate(date)}
          </SecureDetailsContent>
        </React.Fragment>
      ))}
    </>
  );
});
