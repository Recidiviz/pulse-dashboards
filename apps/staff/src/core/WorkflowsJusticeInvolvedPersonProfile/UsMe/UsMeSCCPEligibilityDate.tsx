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

import { observer } from "mobx-react-lite";

import { formatWorkflowsDate } from "../../../utils";
import { Resident } from "../../../WorkflowsStore/Resident";
import { DetailsSubheading, SecureDetailsContent } from "../styles";

// TODO: Some of the Residents do not have their SCCPEligibilityDates, this should not be the case. Fix on data side.
export const UsMeSCCPEligibilityDate = observer(
  function UsMeSCCPEligibilityDate({ person }: { person: Resident }) {
    const sccpDate = person.sccpEligibilityDate;

    // TODO(#5206): Remove once sccpDate is fixed for medium-trustee candidates
    // @ts-expect-error
    if (isNaN(sccpDate)) return;

    return !sccpDate ? null : (
      <>
        <DetailsSubheading>SCCP Eligibility Date</DetailsSubheading>
        <SecureDetailsContent>
          {formatWorkflowsDate(new Date(sccpDate))}
        </SecureDetailsContent>
      </>
    );
  },
);
