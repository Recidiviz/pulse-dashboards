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

import { parseISO } from "date-fns";
import { FC } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { State } from "~@jii/paths";
import { ProgramCatalog } from "~@jii/program-catalog";

export const UsArProgramCatalog: FC = () => {
  const pathParams = useTypedParams(State.Resident);
  return (
    <ProgramCatalog
      stateCode="US_AR"
      showCredits={false}
      showStars={true}
      dataLoadBaselineDate={parseISO("2026-02-02")}
      backHref={State.Resident.buildPath(pathParams)}
      learnMoreHref={State.Resident.UsArMoreInformation.ImportantDates.buildPath(
        pathParams,
        { backTarget: "programs" },
      )}
    />
  );
};
