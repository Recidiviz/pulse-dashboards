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

import { Button } from "@recidiviz/design-system";
import {
  useTypedParams,
  useTypedSearchParams,
} from "react-router-typesafe-routes/dom";

import { stateConfigsByUrlSlug } from "../../configs/stateConstants";
import { ReturnToPathFragment, State } from "../../routes/routes";
import { useRootStore } from "../StoreProvider/useRootStore";
import { usePageTitle } from "../usePageTitle/usePageTitle";

export const LandingStateSpecific = () => {
  const { stateSlug } = useTypedParams(State);
  usePageTitle(stateConfigsByUrlSlug[stateSlug]?.displayName);
  const {
    userStore: {
      authManager: { authClient },
    },
  } = useRootStore();
  const [{ returnToPath }] = useTypedSearchParams(ReturnToPathFragment);

  // In many cases this page is just a placeholder that non-staff users are not
  // really expected to encounter. Where there is something more useful to do here,
  // state-specific behavior or content should be substituted as needed
  return (
    <div>
      <h1>{stateConfigsByUrlSlug[stateSlug]?.displayName}</h1>
      {authClient && (
        <p>
          <Button
            kind="secondary"
            onClick={() =>
              authClient.logIn({
                targetPath: returnToPath ?? window.location.pathname,
              })
            }
          >
            Staff login
          </Button>
        </p>
      )}
    </div>
  );
};
