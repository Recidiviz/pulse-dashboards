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

import { when } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

import { useRootStore } from "../StoreProvider/useRootStore";

/**
 * Triggers a one-time side effect, when an authorized user is detected, that identifies
 * the user to third-party tracking services (e.g. Segment). NOTE that this component
 * should only be rendered in auth-protected contexts because it requires some Auth0 metadata,
 * which may cause errors if it is accessed for unauthenticated users.
 */
export const IdentityTracker = observer(function IdentityTracker() {
  const { userStore } = useRootStore();
  useEffect(
    () =>
      when(
        () => userStore.authManager.isAuthorized,
        () => {
          userStore.identifyToTrackers();
        },
      ),
    [userStore],
  );

  return null;
});
