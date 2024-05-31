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

import { action } from "mobx";
import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import styled from "styled-components/macro";

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import isIE11 from "../../utils/isIE11";
import { CaseloadView } from "../CaseloadView";
import ModelHydrator from "../ModelHydrator";
import { OpportunityCaseloadView } from "../OpportunityCaseloadView";
import { workflowsRoute } from "../views";
import WorkflowsHomepage from "../WorkflowsHomepage";
import { FullProfile } from "../WorkflowsJusticeInvolvedPersonProfile";
import { WorkflowsFormLayout } from "../WorkflowsLayouts";
import WorkflowsMilestones from "../WorkflowsMilestones/WorkflowsMilestones";
import WorkflowsRoute from "../WorkflowsRoute/WorkflowsRoute";
import { WorkflowsTasks } from "../WorkflowsTasks";

const IE11Warning = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-content: center;
  text-align: center;
  height: auto;
  width: 100%;
  margin: auto;
`;

const PageWorkflows: React.FC = () => {
  useEffect(() => {
    window.scrollTo({
      top: 0,
    });
  });
  const { workflowsStore } = useRootStore();
  useEffect(() => {
    // Ensure user data remains active and hydrated while we're in the Workflows UI area
    // (this prevents it from automatically unsubscribing and resubscribing to Firestore
    // if it happens to become unobserved by the application for some reason)
    workflowsStore.keepUserObserved();

    return action("unmounting PageWorkflows", () => {
      // because we are leaving the Workflows UI area, remove the observer
      // on Workflows user data to avoid a memory leak
      workflowsStore.stopKeepingUserObserved();
    });
  }, [workflowsStore]);

  if (isIE11()) {
    return (
      <IE11Warning>
        <h1>This page is not supported in Internet Explorer 11.</h1>
        <h3>
          Please switch to Chrome, Firefox, Edge, or another modern browser and
          try again.
        </h3>
      </IE11Warning>
    );
  }

  return (
    <ModelHydrator model={workflowsStore}>
      <Routes>
        <Route element={<WorkflowsRoute />}>
          <Route
            path={workflowsRoute({ routeName: "home" })}
            element={<WorkflowsHomepage />}
          />

          <Route
            path={workflowsRoute({ routeName: "milestones" })}
            element={<WorkflowsMilestones />}
          />
          {[
            workflowsRoute({
              routeName: "clientProfile",
            }),
            workflowsRoute({ routeName: "residentProfile" }),
          ].map((path) => {
            return <Route key={path} path={path} element={<FullProfile />} />;
          })}
          {[
            workflowsRoute({
              routeName: "clients",
            }),
            workflowsRoute({ routeName: "residents" }),
          ].map((path) => {
            return <Route key={path} path={path} element={<CaseloadView />} />;
          })}

          <Route
            path={workflowsRoute({
              routeName: "tasks",
            })}
            element={<WorkflowsTasks />}
          />
          <Route
            path={workflowsRoute({
              routeName: "opportunityClients",
            })}
            element={<OpportunityCaseloadView />}
          />
          <Route
            path={workflowsRoute({
              routeName: "opportunityAction",
            })}
            element={<WorkflowsFormLayout />}
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ModelHydrator>
  );
};

export default PageWorkflows;
