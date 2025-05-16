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

import * as routes from "../../routes/routes";
import { useRootStore } from "../StoreProvider/useRootStore";

export const PageOrijinSSO = observer(function PageOrijinSSO() {
  const {
    userStore: {
      authManager: { authClient },
    },
  } = useRootStore();

  // if they are using an auth0 client, we can hand over control to a dedicated component
  if (authClient) {
    authClient.logIn({
      targetPath: routes.AfterLogin.path,
      connection: import.meta.env["VITE_ORIJIN_CONNECTION_NAME"],
    });
  }
  return <p>Logging in...</p>;
});
