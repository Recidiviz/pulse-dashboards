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
import enabledTableColumns from "../core/utils/enabledTableColumns";
import { PATHWAYS_PAGES, PATHWAYS_SECTIONS } from "../core/views";
import * as pathways from "../RootStore/TenantStore/pathwaysTenants";
import UsMoEmploymentVerificationTask from "../WorkflowsStore/Task/US_MO/UsMoEmploymentVerificationTask";
import UsMoInPersonContactTask from "../WorkflowsStore/Task/US_MO/UsMoInPersonContactTask";
import UsMoPositiveHomeVisitTask from "../WorkflowsStore/Task/US_MO/UsMoPositiveHomeVisitTask";

const US_MO_CONFIG = {
  name: "Missouri",
  stateCode: "MO",
  domain: "doc.mo.gov",
  availableStateCodes: [pathways.US_MO],
  enableUserRestrictions: true,
  workflowsSupportedSystems: ["SUPERVISION", "INCARCERATION"],
  workflowsMethodologyUrl:
    "https://docs.google.com/document/d/e/2PACX-1vToMOcOU3qmUUF9J86R4MaqjcZIogwq5FwuqWqWLFiY2cPCsgq98E_HgbQ5PPJWexRT-n7pWqcqY5Xz/pub",
  workflowsTasksConfig: {
    collection: "usMoSupervisionTasks",
    tasks: {
      usMoEmploymentVerification: {
        constructor: UsMoEmploymentVerificationTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usMoPositiveHomeVisit: {
        constructor: UsMoPositiveHomeVisitTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
      usMoInPersonContact: {
        constructor: UsMoInPersonContactTask,
        snoozeForOptionsInDays: [7, 30, 90],
      },
    },
  },
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
    INCARCERATION: {
      search: [
        {
          searchType: "FACILITY",
          searchField: ["facilityId"],
          searchTitle: "institution",
        },
        {
          searchType: "FACILITY_UNIT",
          searchField: ["facilityUnitId"],
          searchTitle: "unit",
          restrictedToFeatureVariant: "usMoSearchByUnit",
        },
      ],
    },
  },
  navigation: {
    workflows: ["home", "tasks", "clients", "residents"],
    system: [
      PATHWAYS_PAGES.libertyToPrison,
      PATHWAYS_PAGES.prison,
      PATHWAYS_PAGES.prisonToSupervision,
      PATHWAYS_PAGES.supervision,
      PATHWAYS_PAGES.supervisionToPrison,
      PATHWAYS_PAGES.supervisionToLiberty,
    ],
    libertyToPrison: [
      PATHWAYS_SECTIONS.countOverTime,
      PATHWAYS_SECTIONS.countByLocation,
      PATHWAYS_SECTIONS.countByPriorLengthOfIncarceration,
      PATHWAYS_SECTIONS.countByGender,
      PATHWAYS_SECTIONS.countByAgeGroup,
      PATHWAYS_SECTIONS.countByRace,
    ],
    prison: [
      PATHWAYS_SECTIONS.countOverTime,
      PATHWAYS_SECTIONS.countByLocation,
      PATHWAYS_SECTIONS.countByRace,
      PATHWAYS_SECTIONS.personLevelDetail,
    ],
    prisonToSupervision: [
      PATHWAYS_SECTIONS.countOverTime,
      PATHWAYS_SECTIONS.countByLocation,
      PATHWAYS_SECTIONS.countByAgeGroup,
      PATHWAYS_SECTIONS.countByRace,
      PATHWAYS_SECTIONS.personLevelDetail,
    ],
    supervisionToPrison: [
      PATHWAYS_SECTIONS.countOverTime,
      PATHWAYS_SECTIONS.countByLengthOfStay,
      PATHWAYS_SECTIONS.countByLocation,
      PATHWAYS_SECTIONS.countByOfficer,
      PATHWAYS_SECTIONS.countBySupervisionLevel,
      PATHWAYS_SECTIONS.countByGender,
      PATHWAYS_SECTIONS.countByRace,
    ],
    supervision: [
      PATHWAYS_SECTIONS.countOverTime,
      PATHWAYS_SECTIONS.countByLocation,
      PATHWAYS_SECTIONS.countBySupervisionLevel,
      PATHWAYS_SECTIONS.countByRace,
    ],
    supervisionToLiberty: [
      PATHWAYS_SECTIONS.countOverTime,
      PATHWAYS_SECTIONS.countByLengthOfStay,
      PATHWAYS_SECTIONS.countByLocation,
      PATHWAYS_SECTIONS.countByGender,
      PATHWAYS_SECTIONS.countByAgeGroup,
      PATHWAYS_SECTIONS.countByRace,
    ],
    revocations: [],
    sar: [],
    methodology: ["system"],
  },
  tableColumns: enabledTableColumns[pathways.US_MO],
} satisfies TenantConfig<"US_MO">;

export default US_MO_CONFIG;
