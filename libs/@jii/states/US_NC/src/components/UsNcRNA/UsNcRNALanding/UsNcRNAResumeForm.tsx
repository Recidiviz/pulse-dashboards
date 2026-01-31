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

import { useTypedParams } from "react-router-typesafe-routes/dom";

import { Card, GoButton } from "~@jii/common-ui";
import { fullRNASpec } from "~@jii/configs";
import { State } from "~@jii/paths";

import { RNADescription, RNAHeading } from "../styles";
import { useRNAFormContext } from "../UsNcRNAFormContext/UsNcRNAFormContextProvider";

/**
 * Landing page to continue the form if the user has already started it.
 */
export function UsNcRNAResumeForm() {
  const { form } = useRNAFormContext();
  const routeParams = useTypedParams(State.Resident);

  const numCompletedSections = form.pageToResumeAt - 1;
  const totalSections = fullRNASpec.length;

  return (
    <Card>
      <RNAHeading>Pick up where you left off</RNAHeading>
      <RNADescription>
        You have finished {numCompletedSections} of {totalSections} sections.
      </RNADescription>
      <GoButton
        to={State.Resident.UsNcRNA.FormPage.buildPath({
          ...routeParams,
          pageNum: form.pageToResumeAt,
        })}
      >
        Continue Assessment
      </GoButton>
    </Card>
  );
}
