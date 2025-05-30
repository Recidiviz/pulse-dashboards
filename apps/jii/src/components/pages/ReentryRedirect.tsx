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

import { stateConfigsByUrlSlug } from "../../configs/stateConstants";
import { State } from "../../routes/routes";
import { SingleResidentHydrator } from "../SingleResidentHydrator/SingleResidentHydrator";

export function ReentryRedirect() {
  const { stateSlug, personPseudoId } = useTypedParams(State.Resident);
  const stateCode = stateConfigsByUrlSlug[stateSlug]?.stateCode;

  // Redirect to the reentry tool for Idaho and Utah
  if (stateCode === "US_ID" || stateCode === "US_UT") {
    window.location.replace(
      `${import.meta.env["VITE_REENTRY_URL"]}/${personPseudoId}`,
    );
  }

  return <SingleResidentHydrator />;
}
