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
import { useEffect } from "react";
import { useIdleTimer } from "react-idle-timer";
import { useLocation, useNavigate } from "react-router-dom";

import { isDemoMode } from "~client-env-utils";

import {
  PartiallyTypedRootStore,
  useRootStore,
} from "../components/StoreProvider";

const THREE_HOURS = 3 * 60 * 60 * 1000;
const DEFAULT_TIMEOUT_MINUTES = 30;

const useAuth = () => {
  const { search } = useLocation();
  // TODO(#5636) Eliminate PartiallyTypedRootStore
  const { userStore, tenantStore } = useRootStore() as PartiallyTypedRootStore;
  const stateCodeParam = new URLSearchParams(search).get("stateCode");
  const navigate = useNavigate();

  const tenantId = tenantStore.currentTenantId;
  const sessionTimeoutMinutes = tenantId
    ? tenantStore.tenantConfigs[tenantId].sessionTimeoutMinutes ??
      DEFAULT_TIMEOUT_MINUTES
    : DEFAULT_TIMEOUT_MINUTES;
  const sessionTimeoutMs = sessionTimeoutMinutes * 60 * 1000;

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
            // strip the origin (React Router needs an app-relative location) but
            // preserve the search + hash so query params survive the Auth0 redirect
            navigate(`${url.pathname}${url.search}${url.hash}`, {
              replace: true,
            });
          }),
      ),
    // these references should never really change, so this is essentially
    // calling the effect on mount and cleaning it up on unmount
    [navigate, userStore],
  );

  useIdleTimer({
    onIdle: () => {
      // TODO(#6315): Remove this check
      if (import.meta.env.VITE_DEPLOY_ENV === "production") {
        userStore.logout?.({ returnTo: window.location.origin });
      }
    },
    // State-specific session timeout (configured via sessionTimeoutMinutes in tenant config).
    // MI requires 15 min, CA requires 20 min, all others default to 30 min for CJIS compliance.
    // More details at:
    // https://github.com/Recidiviz/pulse-dashboards/issues/3403#issuecomment-1569096723
    timeout: isDemoMode() ? THREE_HOURS : sessionTimeoutMs,
    crossTab: true,
    syncTimers: 200,
  });

  if (userStore.authError) {
    throw userStore.authError;
  }

  if (userStore.isAuthorized) {
    if (userStore.stateCode?.toLowerCase() === "recidiviz" && stateCodeParam)
      tenantStore.setCurrentTenantId(stateCodeParam);
  }
};

export default useAuth;
