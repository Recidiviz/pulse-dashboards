// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import "./AuthWall.scss";

import { Loading } from "@recidiviz/design-system";
import { when } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import { useIdleTimer } from "react-idle-timer";
import { useHistory, useLocation } from "react-router-dom";

import NotFound from "../components/NotFound";
import { useRootStore } from "../components/StoreProvider";

/**
 * Verifies authorization before rendering its children.
 */
const AuthWall: React.FC = ({ children }) => {
  const { pathname, search } = useLocation();
  const currentView = pathname.split("/")[1];
  const { userStore, currentTenantId, tenantStore } = useRootStore();
  const stateCodeParam = new URLSearchParams(search).get("stateCode");
  const history = useHistory();

  useEffect(
    () =>
      // return when's disposer so it is cleaned up if it never runs
      when(
        () => !userStore.isAuthorized,
        // handler keeps React Router in sync with URL changes
        // that may happen in `authorize` after redirect
        () =>
          userStore.authorize((targetUrl: string) => {
            const url = new URL(targetUrl);
            history.replace(url.pathname);
          })
      ),
    // these references should never really change, so this is essentially
    // calling the effect on mount and cleaning it up on unmount
    [history, userStore]
  );

  useIdleTimer({
    onIdle: () => userStore.logout?.({ returnTo: window.location.origin }),
    // 900 seconds = 15 minutes. Certain state policies require that users reauthenticate after 15
    // minutes of inactivity. More details at:
    // https://github.com/Recidiviz/pulse-dashboards/issues/3403#issuecomment-1569096723
    // TODO(#4205): Change back to 900_000
    timeout: 10_800_000,
    crossTab: true,
    syncTimers: 200,
  });

  if (userStore.authError) {
    throw userStore.authError;
  }

  if (userStore.userIsLoading) {
    return (
      <div className="Loading__container">
        <Loading />
      </div>
    );
  }
  if (userStore.isAuthorized) {
    if (userStore.stateCode?.toLowerCase() === "recidiviz" && stateCodeParam)
      tenantStore.setCurrentTenantId(stateCodeParam);

    const authorizedChildren = React.Children.map(children, (child: any) => {
      const { tenantIds, views } = child.props;

      return tenantIds.includes(currentTenantId) && views.includes(currentView)
        ? child
        : null;
    });
    return authorizedChildren && authorizedChildren.length > 0 ? (
      <>{authorizedChildren}</>
    ) : (
      <NotFound />
    );
  }

  return null;
};

export default observer(AuthWall);
