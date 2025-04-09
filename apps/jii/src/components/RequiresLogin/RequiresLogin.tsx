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

import { observer } from "mobx-react-lite";
import { FC, ReactNode } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { RedirectIfLoggedOut } from "~auth";

import { isAuthorizedState } from "../../apis/auth/types";
import { State } from "../../routes/routes";
import { useRootStore } from "../StoreProvider/useRootStore";

export const RequiresLogin: FC<{ children: ReactNode }> = observer(
  function RequiresLogin({ children }) {
    const {
      userStore: {
        authManager: { authClient, authState },
      },
    } = useRootStore();
    const { stateSlug } = useTypedParams(State);

    // if they are using an auth0 client, we can hand over control to a dedicated component
    if (authClient) {
      return (
        <RedirectIfLoggedOut
          authClient={authClient}
          to={State.buildPath(
            { stateSlug },
            { returnToPath: window.location.pathname },
          )}
        >
          {children}
        </RedirectIfLoggedOut>
      );
    }

    // if we've gotten this far without auth, we expect it's because
    // the user has somehow deviated from the proper token auth pathway
    if (!isAuthorizedState(authState)) {
      throw new Error("You are not currently authorized to view this page");
    }

    return children;
  },
);
