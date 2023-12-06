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

import React, { useEffect } from "react";
import { Route, Switch } from "react-router-dom";
import styled from "styled-components/macro";

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import isIE11 from "../../utils/isIE11";
import { CaseloadView } from "../CaseloadView";
import ModelHydrator from "../ModelHydrator";
import { OpportunityCaseloadView } from "../OpportunityCaseloadView";
import { WORKFLOWS_PATHS, workflowsRoute } from "../views";
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
      <Switch>
        <Route
          exact
          path={workflowsRoute({ routeName: "home" })}
          render={() => (
            <WorkflowsRoute>
              <WorkflowsHomepage />
            </WorkflowsRoute>
          )}
        />

        <Route
          exact
          path={workflowsRoute({ routeName: "milestones" })}
          render={() => (
            <WorkflowsRoute>
              <WorkflowsMilestones />
            </WorkflowsRoute>
          )}
        />
        <Route
          exact
          path={[
            workflowsRoute({
              routeName: "clientProfile",
            }),
            workflowsRoute({ routeName: "residentProfile" }),
          ]}
          render={() => (
            <WorkflowsRoute>
              <FullProfile />
            </WorkflowsRoute>
          )}
        />
        <Route
          exact
          path={[
            workflowsRoute({
              routeName: "caseloadClients",
            }),
            workflowsRoute({ routeName: "caseloadResidents" }),
          ]}
          render={() => (
            <WorkflowsRoute>
              <CaseloadView />
            </WorkflowsRoute>
          )}
        />
        <Route
          exact
          path={workflowsRoute({
            routeName: "tasks",
          })}
          render={() => (
            <WorkflowsRoute>
              <WorkflowsTasks />
            </WorkflowsRoute>
          )}
        />
        <Route
          exact
          path={workflowsRoute({
            routeName: "opportunityClients",
          })}
          render={() => (
            <WorkflowsRoute>
              <OpportunityCaseloadView />
            </WorkflowsRoute>
          )}
        />
        <Route
          exact
          path={workflowsRoute({
            routeName: "opportunityAction",
          })}
          render={() => (
            <WorkflowsRoute>
              <WorkflowsFormLayout />
            </WorkflowsRoute>
          )}
        />
        <Route
          exact
          path={WORKFLOWS_PATHS.workflows}
          render={() => <WorkflowsRoute />}
        />
        <NotFound />
      </Switch>
    </ModelHydrator>
  );
};

export default PageWorkflows;
