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

import { Loading } from "@recidiviz/design-system";
import { useEffect } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { EdovoLandingPage } from "../../routes/routes";
import { useRootStore } from "../StoreProvider/useRootStore";

export const PageEdovoLanding = () => {
  const { token } = useTypedParams(EdovoLandingPage);
  const { apiClient } = useRootStore();

  // proof of concept
  useEffect(() => {
    // eslint-disable-next-line no-console
    apiClient.validateEdovoToken(token).then((r) => console.log(r));
  });

  return <Loading />;
};
