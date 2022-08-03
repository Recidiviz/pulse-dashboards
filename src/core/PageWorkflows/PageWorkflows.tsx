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

import { palette, typography } from "@recidiviz/design-system";
import React, { useEffect } from "react";
import { Switch } from "react-router-dom";
import styled from "styled-components/macro";

import NotFound from "../../components/NotFound";
import { useRootStore } from "../../components/StoreProvider";
import isIE11 from "../../utils/isIE11";
import { CaseloadView } from "../CaseloadView";
import ModelHydrator from "../ModelHydrator";
import { OpportunityCaseloadSelection } from "../OpportunityCaseloadSelection";
import { WORKFLOWS_PATHS, workflowsRoute } from "../views";
import {
  CompliantReportingClientProfile,
  FullProfile,
} from "../WorkflowsClientProfile";
import WorkflowsCompliantReportingForm from "../WorkflowsCompliantReportingForm/WorkflowsCompliantReportingForm";
import { WorkflowsFormLayout } from "../WorkflowsLayouts";
import WorkflowsRoute from "../WorkflowsRoute";

const SidebarHeading = styled.h1`
  ${typography.Sans18}
  color: ${palette.pine2};
`;

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
  }, []);
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
        <WorkflowsRoute
          exact
          path={workflowsRoute({ name: "compliantReporting", client: false })}
        >
          <WorkflowsFormLayout
            sidebarContents={
              <>
                <SidebarHeading>Compliant Reporting</SidebarHeading>
                <OpportunityCaseloadSelection opportunityType="compliantReporting" />
              </>
            }
            formContents={null}
          />
        </WorkflowsRoute>
        <WorkflowsRoute
          exact
          path={workflowsRoute({ name: "compliantReporting", client: true })}
        >
          <WorkflowsFormLayout
            sidebarContents={<CompliantReportingClientProfile />}
            formContents={<WorkflowsCompliantReportingForm />}
          />
        </WorkflowsRoute>
        <WorkflowsRoute
          exact
          path={workflowsRoute({ name: "earlyTermination", client: false })}
        >
          <WorkflowsFormLayout
            sidebarContents={
              <>
                <SidebarHeading>Early Termination</SidebarHeading>
              </>
            }
            formContents={null}
          />
        </WorkflowsRoute>
        <WorkflowsRoute
          exact
          path={workflowsRoute({ name: "general", client: true })}
        >
          <FullProfile />
        </WorkflowsRoute>
        <WorkflowsRoute
          exact
          path={workflowsRoute({ name: "general", client: false })}
        >
          <CaseloadView />
        </WorkflowsRoute>
        <WorkflowsRoute exact path={WORKFLOWS_PATHS.workflows} />
        <NotFound />
      </Switch>
    </ModelHydrator>
  );
};

export default PageWorkflows;
