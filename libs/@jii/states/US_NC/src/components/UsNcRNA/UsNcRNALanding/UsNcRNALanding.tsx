// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { useTypedParams } from "react-router-typesafe-routes/dom";

import { Card, GoButton, usePageTitle } from "~@jii/common-ui";
import { State } from "~@jii/paths";

import { RNADescription, RNAHeading } from "../styles";
import { useRNAFormContext } from "../UsNcRNAFormContext/UsNcRNAFormContextProvider";
import { UsNcRNAResumeForm } from "./UsNcRNAResumeForm";
import { UsNcRNASuccessfulSubmission } from "./UsNcRNASuccessfulSubmission";

/**
 * Landing page for Risks and Needs Assessment, showing an informative message if the
 * form hasn't been enabled, a link to start or continue the form if it's been enabled,
 * and a record of survey completion if it's been completed.
 */
export function UsNcRNALanding() {
  usePageTitle("Self-Report");
  const { form } = useRNAFormContext();
  const routeParams = useTypedParams(State.Resident);

  // TODO(#10889): show message if form is not enabled

  if (form.completed) {
    return <UsNcRNASuccessfulSubmission />;
  }

  if (form.pageToResumeAt > 1) {
    return <UsNcRNAResumeForm />;
  }

  return (
    <Card>
      <RNAHeading>Time for your Self-Report</RNAHeading>
      <RNADescription>
        This helps NCDAC assign you to the programs, classes, or jobs that will
        be most helpful to you. These questions should take around 15 minutes to
        finish.
      </RNADescription>
      <GoButton
        to={State.Resident.UsNcRNA.ConfirmIdentity.buildPath(routeParams)}
      >
        Start
      </GoButton>
    </Card>
  );
}
