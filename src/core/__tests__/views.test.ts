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

import {
  getRelativePath,
  OUTLIERS_PATHS,
  OutliersPage,
  WORKFLOWS_PATHS,
  WorkflowsPage,
} from "../views";

describe("getRelativePath", () => {
  const WORKFLOWS_RELATIVE_PATHS = {
    opportunityClients: `/:opportunityTypeUrl`,
    opportunityAction: `/:opportunityTypeUrl/:justiceInvolvedPersonId`,
    home: `/home`,
    tasks: `/tasks`,
    workflows: "",
    milestones: `/milestones`,
    caseloadClients: `/clients`,
    caseloadResidents: `/residents`,
    clientProfile: `/clients/:justiceInvolvedPersonId`,
    residentProfile: `/residents/:justiceInvolvedPersonId`,
  };

  test.each([...Object.keys(WORKFLOWS_PATHS)])(
    "it returns the relative path for workflows",
    (routeName) => {
      expect(
        getRelativePath(WORKFLOWS_PATHS[routeName as WorkflowsPage])
      ).toEqual(WORKFLOWS_RELATIVE_PATHS[routeName as WorkflowsPage]);
    }
  );

  const OUTLIERS_RELATIVE_PATHS = {
    supervision: `/supervision`,
    supervisionSupervisorsList: `/supervision/supervisors-list`,
    supervisionSupervisor: `/supervision/supervisor/:supervisorPseudoId`,
    supervisionStaff: `/supervision/staff/:officerPseudoId`,
    supervisionStaffMetric: `/supervision/staff/:officerPseudoId/adverse-outcome/:metricId`,
    supervisionClientDetail: `/supervision/staff/:officerPseudoId/adverse-outcome/:metricId/client/:clientPseudoId/:outcomeDate`,
  };

  test.each([...Object.keys(OUTLIERS_PATHS)])(
    "it returns the relative path for outliers",
    (routeName) => {
      expect(
        getRelativePath(OUTLIERS_PATHS[routeName as OutliersPage])
      ).toEqual(OUTLIERS_RELATIVE_PATHS[routeName as OutliersPage]);
    }
  );
});