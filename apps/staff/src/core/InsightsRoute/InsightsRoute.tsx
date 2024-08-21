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

import { action } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";

import NotFound from "../../components/NotFound";
import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import { INSIGHTS_PATHS, insightsUrl } from "../views";

const RouteSync = observer(function RouteSync({
  children,
}: {
  children?: React.ReactNode;
}) {
  const routeParams: Record<string, string | undefined> = useParams();
  const {
    supervisorPseudoId,
    officerPseudoId,
    metricId,
    clientPseudoId,
    outcomeDate,
    opportunityTypeUrl,
  } = routeParams;
  const loc = useLocation();

  const {
    insightsStore: { supervisionStore },
    userStore,
  } = useRootStore();
  const { insightsOnboarding } = useFeatureVariants();

  useEffect(() => {
    // entire function cannot be wrapped in action()
    // because it interferes with useEffect dependency tracking
    const syncParams = action("sync insights route params", () => {
      if (
        supervisionStore &&
        loc.pathname.startsWith(INSIGHTS_PATHS.supervision)
      ) {
        supervisionStore.setSupervisorPseudoId(supervisorPseudoId);
        supervisionStore.setOfficerPseudoId(officerPseudoId);
        supervisionStore.setMetricId(metricId);
        supervisionStore.setClientPseudoId(clientPseudoId);
        supervisionStore.setOutcomeDate(outcomeDate);
        supervisionStore.setOpportunityTypeUrl(opportunityTypeUrl);
      }
    });
    syncParams();
  }, [
    supervisionStore,
    loc,
    supervisorPseudoId,
    officerPseudoId,
    metricId,
    clientPseudoId,
    outcomeDate,
    opportunityTypeUrl,
  ]);

  if (
    !supervisionStore?.userCanAccessAllSupervisors &&
    // not allowed to access search page
    (loc.pathname === insightsUrl("supervisionSupervisorsList") ||
      // not allowed to access someone else's supervisor report
      (supervisorPseudoId && supervisorPseudoId !== userStore.userPseudoId))
  ) {
    return <NotFound />;
  }

  if (insightsOnboarding && !supervisionStore?.userHasSeenOnboarding) {
    return <Navigate to={insightsUrl("supervisionOnboarding")} />;
  }

  return <>{children}</>;
});

/**
 * Syncs route data to the insights datastore.
 */
export const InsightsRoute: React.FC = () => {
  return (
    <RouteSync>
      <Outlet />
    </RouteSync>
  );
};
