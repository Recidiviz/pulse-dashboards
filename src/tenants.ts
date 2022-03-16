// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
  METRIC_TYPE_LABELS,
  METRIC_TYPES,
  PracticesMetric,
} from "./core/PagePractices/types";
import { TableColumns } from "./core/types/charts";
import { Navigation } from "./core/types/navigation";
import enabledTableColumns from "./core/utils/enabledTableColumns";
import {
  PATHWAYS_PAGES,
  PATHWAYS_SECTIONS,
  PATHWAYS_VIEWS,
} from "./core/views";
import * as lantern from "./RootStore/TenantStore/lanternTenants";
import * as pathways from "./RootStore/TenantStore/pathwaysTenants";
import { TenantId } from "./RootStore/types";

export const RECIDIVIZ_TENANT = "RECIDIVIZ";
export const LANTERN = "LANTERN";

type Tenants = {
  [key in TenantId]: {
    name: string;
    stateCode: string;
    domain?: string;
    availableStateCodes: string[];
    enableUserRestrictions: boolean;
    enablePracticesCaseloadButton: boolean;
    navigation?: Navigation;
    betaNavigation?: Navigation;
    practicesMetrics?: PracticesMetric[];
    pagesWithRestrictions?: string[];
    tableColumns?: TableColumns;
  };
};

const TENANTS: Tenants = {
  [pathways.US_ID]: {
    name: "Idaho",
    stateCode: "ID",
    domain: "idoc.idaho.gov",
    availableStateCodes: [pathways.US_ID],
    enableUserRestrictions: false,
    enablePracticesCaseloadButton: true,
    navigation: {
      operations: [],
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
        PATHWAYS_SECTIONS.countByPriorLengthOfIncarceration,
        PATHWAYS_SECTIONS.countByGender,
        PATHWAYS_SECTIONS.countByAgeGroup,
        PATHWAYS_SECTIONS.countByRace,
      ],
      prison: [
        PATHWAYS_SECTIONS.projectedCountOverTime,
        PATHWAYS_SECTIONS.countByLocation,
        PATHWAYS_SECTIONS.personLevelDetail,
      ],
      prisonToSupervision: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countByLocation,
        PATHWAYS_SECTIONS.countByAgeGroup,
        PATHWAYS_SECTIONS.personLevelDetail,
      ],
      supervision: [
        PATHWAYS_SECTIONS.projectedCountOverTime,
        PATHWAYS_SECTIONS.countBySupervisionLevel,
      ],
      supervisionToPrison: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countByLengthOfStay,
        PATHWAYS_SECTIONS.countByLocation,
        PATHWAYS_SECTIONS.countBySupervisionLevel,
        PATHWAYS_SECTIONS.countByGender,
        PATHWAYS_SECTIONS.countByRace,
      ],
      supervisionToLiberty: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countByLocation,
        PATHWAYS_SECTIONS.countByRace,
        PATHWAYS_SECTIONS.countByGender,
        PATHWAYS_SECTIONS.countByAgeGroup,
      ],
      "id-methodology": ["system", "operations"],
    },
    pagesWithRestrictions: [
      "operations",
      "libertyToPrison",
      "prison",
      "prisonToSupervision",
      "supervision",
      "supervisionToPrison",
      "supervisionToLiberty",
    ],
    tableColumns: enabledTableColumns[pathways.US_ID],
    practicesMetrics: [
      {
        name: METRIC_TYPE_LABELS.OVERALL,
        id: METRIC_TYPES.OVERALL,
        description: "Average timeliness across all metrics",
        accessor: "overall",
      },
      {
        name: METRIC_TYPE_LABELS.RISK_ASSESSMENT,
        id: METRIC_TYPES.RISK_ASSESSMENT,
        description: `of clients have an up-to-date risk assessment, according to IDOC policy.`,
        accessor: "timelyRiskAssessment",
      },
      {
        name: METRIC_TYPE_LABELS.F2F_CONTACT,
        id: METRIC_TYPES.CONTACT,
        description: `of clients have an up-to-date face-to-face contact, according to IDOC policy`,
        accessor: "timelyContact",
      },
      {
        name: METRIC_TYPE_LABELS.DOWNGRADE,
        id: METRIC_TYPES.DOWNGRADE,
        description: `of clients are at a supervision level that is the same or below their risk level.`,
        accessor: "timelyDowngrade",
      },
    ],
  },
  [pathways.US_TN]: {
    name: "Tennessee",
    stateCode: "TN",
    availableStateCodes: [pathways.US_TN],
    enableUserRestrictions: false,
    enablePracticesCaseloadButton: false,
    navigation: {
      practices: [],
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
        PATHWAYS_SECTIONS.personLevelDetail,
      ],
      supervision: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countByLocation,
        PATHWAYS_SECTIONS.countBySupervisionLevel,
      ],
      prisonToSupervision: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countByLocation,
        PATHWAYS_SECTIONS.countByAgeGroup,
        PATHWAYS_SECTIONS.personLevelDetail,
      ],
      supervisionToPrison: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countByLengthOfStay,
        PATHWAYS_SECTIONS.countByLocation,
        // PATHWAYS_SECTIONS.countBySupervisionLevel,
        PATHWAYS_SECTIONS.countByGender,
        PATHWAYS_SECTIONS.countByRace,
      ],
      supervisionToLiberty: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countByLengthOfStay,
        PATHWAYS_SECTIONS.countByLocation,
        PATHWAYS_SECTIONS.countByRace,
        PATHWAYS_SECTIONS.countByGender,
        PATHWAYS_SECTIONS.countByAgeGroup,
      ],
      "id-methodology": [PATHWAYS_VIEWS.system],
    },
    pagesWithRestrictions: ["practices", "prison"],
    tableColumns: enabledTableColumns[pathways.US_TN],
  },
  [pathways.US_ME]: {
    name: "Maine",
    stateCode: "ME",
    availableStateCodes: [pathways.US_ME],
    enableUserRestrictions: false,
    enablePracticesCaseloadButton: false,
    navigation: {
      system: [PATHWAYS_PAGES.prison],
      libertyToPrison: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countByLocation,
      ],
      prison: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countByLocation,
        PATHWAYS_SECTIONS.personLevelDetail,
      ],
      prisonToSupervision: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countByAgeGroup,
        PATHWAYS_SECTIONS.countByLocation,
        PATHWAYS_SECTIONS.personLevelDetail,
      ],
      supervision: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countByLocation,
        PATHWAYS_SECTIONS.countBySupervisionLevel,
      ],
      supervisionToPrison: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countByLengthOfStay,
        PATHWAYS_SECTIONS.countByMostSevereViolation,
        PATHWAYS_SECTIONS.countByNumberOfViolations,
        PATHWAYS_SECTIONS.countByLocation,
      ],
      "id-methodology": ["system"],
    },
    pagesWithRestrictions: ["prison"],
    tableColumns: enabledTableColumns[pathways.US_ME],
  },
  [lantern.US_MO]: {
    name: "Missouri",
    stateCode: "MO",
    availableStateCodes: [lantern.US_MO],
    enableUserRestrictions: true,
    enablePracticesCaseloadButton: false,
  },
  [pathways.US_MI]: {
    name: "Michigan",
    stateCode: "MI",
    availableStateCodes: [pathways.US_MI],
    enableUserRestrictions: false,
    enablePracticesCaseloadButton: false,
    navigation: {
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
        PATHWAYS_SECTIONS.personLevelDetail,
      ],
      prisonToSupervision: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countByLocation,
        PATHWAYS_SECTIONS.countByAgeGroup,
        PATHWAYS_SECTIONS.personLevelDetail,
      ],
      supervisionToPrison: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countByLengthOfStay,
        PATHWAYS_SECTIONS.countByLocation,
        PATHWAYS_SECTIONS.countByOfficer,
        PATHWAYS_SECTIONS.countByGender,
        PATHWAYS_SECTIONS.countByRace,
      ],
      supervision: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countBySupervisionLevel,
      ],
      supervisionToLiberty: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countByLengthOfStay,
        PATHWAYS_SECTIONS.countByLocation,
        PATHWAYS_SECTIONS.countByRace,
        PATHWAYS_SECTIONS.countByGender,
        PATHWAYS_SECTIONS.countByAgeGroup,
      ],
      "id-methodology": ["system"],
    },
    pagesWithRestrictions: [
      "libertyToPrison",
      "prison",
      "prisonToSupervision",
      "supervisionToPrison",
      "supervisionToLiberty",
      "supervision",
    ],
    tableColumns: enabledTableColumns[pathways.US_MI],
  },
  [pathways.US_ND]: {
    name: "North Dakota",
    stateCode: "ND",
    domain: "nd.gov",
    availableStateCodes: [pathways.US_ND],
    enableUserRestrictions: false,
    enablePracticesCaseloadButton: true,
    navigation: {
      operations: [],
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
        PATHWAYS_SECTIONS.personLevelDetail,
      ],
      prisonToSupervision: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countByLocation,
        PATHWAYS_SECTIONS.countByAgeGroup,
        PATHWAYS_SECTIONS.personLevelDetail,
      ],
      supervisionToPrison: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countByLengthOfStay,
        PATHWAYS_SECTIONS.countByLocation,
        // PATHWAYS_SECTIONS.countByOfficer,
        // PATHWAYS_SECTIONS.countBySupervisionLevel,
        PATHWAYS_SECTIONS.countByGender,
        PATHWAYS_SECTIONS.countByRace,
      ],
      supervision: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countBySupervisionLevel,
      ],
      supervisionToLiberty: [
        PATHWAYS_SECTIONS.countOverTime,
        // PATHWAYS_SECTIONS.countByLengthOfStay,
        PATHWAYS_SECTIONS.countByLocation,
        PATHWAYS_SECTIONS.countByRace,
        PATHWAYS_SECTIONS.countByGender,
        PATHWAYS_SECTIONS.countByAgeGroup,
      ],

      goals: [],
      community: ["explore", "practices"],
      methodology: ["practices"],
      facilities: ["explore"],
      "id-methodology": ["system", "operations"],
    },
    pagesWithRestrictions: [
      "operations",
      "libertyToPrison",
      "prison",
      "prisonToSupervision",
      "supervisionToPrison",
      "supervisionToLiberty",
      "supervision",
      "practices",
    ],
    tableColumns: enabledTableColumns[pathways.US_ND],
    practicesMetrics: [
      {
        name: METRIC_TYPE_LABELS.OVERALL,
        id: METRIC_TYPES.OVERALL,
        description: "Average timeliness across all metrics",
        accessor: "overall",
      },
      {
        name: METRIC_TYPE_LABELS.DISCHARGE,
        id: METRIC_TYPES.DISCHARGE,
        description: `of clients were discharged at their earliest projected regular
        supervision discharge date`,
        accessor: "timelyDischarge",
      },
      {
        name: METRIC_TYPE_LABELS.CONTACT,
        id: METRIC_TYPES.CONTACT,
        description: `of clients received initial contact within 30 days of
        starting supervision and a F2F contact every subsequent 3 months,
        2 months, or 1 month for minimum, medium, and maximum supervision
        levels respectively`,
        accessor: "timelyContact",
      },
      {
        name: METRIC_TYPE_LABELS.RISK_ASSESSMENT,
        id: METRIC_TYPES.RISK_ASSESSMENT,
        description: `of clients have had an initial assessment within 30 days and 
        reassessment within 212 days`,
        accessor: "timelyRiskAssessment",
      },
    ],
  },
  [lantern.US_PA]: {
    name: "Pennsylvania",
    stateCode: "PA",
    availableStateCodes: [lantern.US_PA],
    enableUserRestrictions: false,
    enablePracticesCaseloadButton: false,
  },
  RECIDIVIZ: {
    name: "Recidiviz",
    stateCode: "Recidiviz",
    availableStateCodes: pathways.PATHWAYS_TENANTS.concat(
      lantern.LANTERN_TENANTS
    ),
    enableUserRestrictions: true,
    enablePracticesCaseloadButton: true,
  },
  LANTERN: {
    name: "Lantern",
    stateCode: "Lantern",
    availableStateCodes: lantern.LANTERN_TENANTS,
    enableUserRestrictions: false,
    enablePracticesCaseloadButton: false,
  },
};

export default TENANTS;
