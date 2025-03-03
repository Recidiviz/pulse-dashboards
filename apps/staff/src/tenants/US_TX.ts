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

import { TenantConfig } from "../core/models/types";
import * as dashboard from "../RootStore/TenantStore/dashboardTenants";
import UsTxAssessmentTask from "../WorkflowsStore/Task/UsTxAssessmentTask";
import UsTxElectronicContactTask from "../WorkflowsStore/Task/UsTxElectronicContactTask";
import UsTxFieldContactTask from "../WorkflowsStore/Task/UsTxFieldContactTask";
import UsTxHomeContactTask from "../WorkflowsStore/Task/UsTxHomeContactTask";

const US_TX_CONFIG: TenantConfig<"US_TX"> = {
  name: "Texas",
  stateCode: "TX",
  domain: "tdcj.texas.gov",
  availableStateCodes: [dashboard.US_TX],
  enableUserRestrictions: false,
  workflowsSupportedSystems: ["SUPERVISION"],
  workflowsSystemConfigs: {
    SUPERVISION: {
      search: [
        {
          searchType: "OFFICER",
          searchField: ["officerId"],
          searchTitle: "officer",
        },
      ],
    },
  },
  workflowsTasksConfig: {
    collection: "usTxSupervisionTasks",
    tasks: {
      usTxHomeContact: {
        constructor: UsTxHomeContactTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxFieldContact: {
        constructor: UsTxFieldContactTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxElectronicContact: {
        constructor: UsTxElectronicContactTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usTxAssessment: {
        constructor: UsTxAssessmentTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
    },
    filters: [
      {
        title: "Supervision Level",
        field: "supervisionLevel",
        options: [
          {
            value: "Minimum",
          },
          {
            value: "Moderate",
          },
          {
            value: "High",
          },
          {
            value: "Maximum",
          },
        ],
      },
    ],
  },
  navigation: {
    workflows: ["home", "tasks", "clients"],
  },
};

export default US_TX_CONFIG;
