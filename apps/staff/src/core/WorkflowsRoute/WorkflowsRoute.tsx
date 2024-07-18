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

import { autorun, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import NotFound from "../../components/NotFound";
import {
  useOpportunityConfigurations,
  useRootStore,
} from "../../components/StoreProvider";
import { WorkflowsRouteParams } from "../../WorkflowsStore";
import { getSystemIdFromPage } from "../../WorkflowsStore/utils";
import { SystemId } from "../models/types";
import { WorkflowsPage, workflowsUrl } from "../views";

// react-router does not seem to export this type directly
type RouterLocation = ReturnType<typeof useLocation>;

function parseLocation(loc: RouterLocation): WorkflowsRouteParams {
  // slicing off empty string at 0 caused by leading slash,
  // and 1 which should always be "workflows"
  const [page, personId]: Array<string | undefined> = loc.pathname
    .split("/")
    .slice(2);

  return { page, personId };
}

const RouteSync = observer(function RouteSync({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { workflowsStore, currentTenantId } = useRootStore();
  const loc = useLocation();

  const [notFound, setNotFound] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | undefined>();

  const [previousLocContainedPersonId, setPreviousLocContainedPersonId] =
    useState(false);

  const OPPORTUNITY_CONFIGS = useOpportunityConfigurations();
  useEffect(
    () =>
      autorun(() => {
        const { page, personId } = parseLocation(loc);
        const { workflowsSupportedSystems, homepage } = workflowsStore;
        setRedirectPath(undefined);
        workflowsStore.setActivePage({ page, personId });

        const opportunityType =
          page && workflowsStore.getOpportunityTypeFromUrl(page);

        /* 1. Update activeSystem and selectedOpportunityType */
        if (opportunityType) {
          workflowsStore.updateActiveSystem(
            OPPORTUNITY_CONFIGS[opportunityType].systemType,
          );
          workflowsStore.updateSelectedOpportunityType(opportunityType);
        } else {
          // Select active system from the page type or take the first supported system available
          const activeSystem: SystemId | undefined =
            !!workflowsSupportedSystems && workflowsSupportedSystems?.length > 1
              ? getSystemIdFromPage(page as WorkflowsPage)
              : workflowsSupportedSystems?.[0];

          if (activeSystem) workflowsStore.updateActiveSystem(activeSystem);
          workflowsStore.updateSelectedOpportunityType(undefined);
        }

        /* 2. Update selectedPerson if there is a personId */
        // updateSelectedPerson relies on the active system, so set it after the above
        if (personId || previousLocContainedPersonId) {
          workflowsStore.updateSelectedPerson(personId).catch(() => {
            if (opportunityType) {
              // Redirect home if person is no long eligible for opportunity
              setRedirectPath(workflowsUrl(homepage));
            } else {
              setNotFound(true);
            }
          });
        }

        setPreviousLocContainedPersonId(!!personId);

        /* 3. Redirect to first available opportunity page if only 1 opportunity or homepage for multiple */
        if (!page) {
          // we aren't actually mutating any observables here,
          // but we just don't want the access tracked in this effect
          // (it is mixing observable and unobservable dependencies, which could lead
          // to unpredictable or undesirable re-renders)
          runInAction(() => {
            const { opportunityTypes } = workflowsStore;
            if (opportunityTypes.length === 1) {
              const { urlSection } = OPPORTUNITY_CONFIGS[opportunityTypes[0]];
              setRedirectPath(
                workflowsUrl("opportunityClients", {
                  urlSection,
                }),
              );
            } else {
              setRedirectPath(workflowsUrl(homepage));
            }
          });
        }
      }),
    [
      OPPORTUNITY_CONFIGS,
      loc,
      workflowsStore,
      currentTenantId,
      previousLocContainedPersonId,
    ],
  );

  if (notFound) {
    return <NotFound />;
  }
  if (redirectPath) {
    return <Navigate replace to={redirectPath} />;
  }
  return <>{children}</>;
});

/**
 * Wraps a react-router Route to sync route data to the Workflows datastore.
 */
const WorkflowsRoute: React.FC = () => {
  return (
    <RouteSync>
      <Outlet />
    </RouteSync>
  );
};

export default WorkflowsRoute;
