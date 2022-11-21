// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { Redirect, Route, RouteProps, useLocation } from "react-router-dom";

import { useRootStore } from "../../components/StoreProvider";
import { isOpportunityType } from "../../WorkflowsStore/Opportunity/types";
import { WORKFLOWS_PATHS, workflowsUrl } from "../views";

// react-router does not seem to export this type directly
type RouterLocation = ReturnType<typeof useLocation>;

function parseLocation(loc: RouterLocation) {
  // slicing off empty string at 0 caused by leading slash,
  // and 1 which should always be "workflows"
  const [page, personId]: Array<string | undefined> = loc.pathname
    .split("/")
    .slice(2);

  return { page, personId };
}

const RouteSync = observer(function RouteSync({ children }) {
  const { workflowsStore, currentTenantId } = useRootStore();
  const loc = useLocation();

  const [notFound, setNotFound] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | undefined>();

  useEffect(() => {
    const { page, personId } = parseLocation(loc);
    setRedirectPath(undefined);

    // sync location data into the store
    workflowsStore.updateSelectedPerson(personId).catch(() => {
      setNotFound(true);
    });
    if (page && isOpportunityType(page)) {
      workflowsStore.updateSelectedOpportunityType(page);
    } else {
      workflowsStore.updateSelectedOpportunityType(undefined);
    }

    if (!page) {
      // we aren't actually mutating any observables here,
      // but we just don't want the access tracked in this effect
      // (it is mixing observable and unobservable dependencies, which could lead
      // to unpredictable or undesirable re-renders)
      runInAction(() => {
        const { hasMultipleOpportunities, opportunityTypes } = workflowsStore;

        if (hasMultipleOpportunities) {
          setRedirectPath(workflowsUrl("home"));
        } else {
          setRedirectPath(
            workflowsUrl("opportunityClients", {
              opportunityType: opportunityTypes[0],
            })
          );
        }
      });
    }
  }, [loc, workflowsStore, currentTenantId]);

  if (notFound) {
    return <Redirect to={WORKFLOWS_PATHS.workflows404} />;
  }

  if (redirectPath) {
    return <Redirect to={redirectPath} />;
  }
  return <>{children}</>;
});

/**
 * Wraps a react-router Route to sync route data to the Workflows datastore.
 */
const WorkflowsRoute: React.FC<RouteProps> = ({ children, ...rest }) => {
  return (
    <Route {...rest}>
      <RouteSync>{children}</RouteSync>
    </Route>
  );
};

export default WorkflowsRoute;
