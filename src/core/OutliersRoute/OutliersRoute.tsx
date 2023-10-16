// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { Location } from "history";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import { Route, RouteProps, useLocation, useParams } from "react-router-dom";

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import { OUTLIERS_PATHS, outliersUrl } from "../views";

const RouteSync = observer(function RouteSync({ children }) {
  const routeParams: Record<string, string | undefined> = useParams();
  const { supervisorId, officerId, metricId } = routeParams;
  const loc: Location = useLocation();

  const {
    outliersStore: { supervisionStore },
  } = useRootStore();

  useEffect(() => {
    // entire function cannot be wrapped in action()
    // because it interferes with useEffect dependency tracking
    const syncParams = action("sync Outliers route params", () => {
      if (
        supervisionStore &&
        loc.pathname.startsWith(OUTLIERS_PATHS.supervision)
      ) {
        supervisionStore.setSupervisorId(supervisorId);
        supervisionStore.setOfficerId(officerId);
        supervisionStore.setMetricId(metricId);
      }
    });
    syncParams();
  }, [supervisionStore, loc, supervisorId, officerId, metricId]);

  // access controls that may short-circuit rendering
  if (supervisionStore?.currentSupervisorUser) {
    if (
      // not allowed to access search page
      loc.pathname === outliersUrl("supervisionSupervisorSearch") ||
      // not allowed to access someone else's supervisor report
      (supervisorId &&
        supervisorId !== supervisionStore.currentSupervisorUser.externalId)
      // note that we can't do a similar check for the staff page because we may not know
      // who supervises them yet; we rely on the backend access controls to catch this
    ) {
      return <NotFound />;
    }
  }

  return <>{children}</>;
});

/**
 * Wraps a react-router Route to sync route data to the Outliers datastore.
 */
export const OutliersRoute: React.FC<Omit<RouteProps, "component">> = ({
  children,
  ...rest
}) => {
  return (
    <Route {...rest}>
      <RouteSync>{children}</RouteSync>
    </Route>
  );
};
