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
import { TableColumn } from "./core/types/charts";
import { Navigation } from "./core/types/navigation";
import { PATHWAYS_PAGES, PATHWAYS_SECTIONS } from "./core/views";
import * as core from "./RootStore/TenantStore/coreTenants";
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
    practicesMetrics?: PracticesMetric[];
    pagesWithRestrictions?: string[];
    tableColumns?: TableColumn[];
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
        PATHWAYS_PAGES.prison,
        PATHWAYS_PAGES.supervision,
        PATHWAYS_PAGES.supervisionToPrison,
        PATHWAYS_PAGES.supervisionToLiberty,
      ],
      prison: [PATHWAYS_SECTIONS.countOverTime],
      supervision: [PATHWAYS_SECTIONS.countOverTime],
      supervisionToPrison: [PATHWAYS_SECTIONS.countOverTime],
      supervisionToLiberty: [PATHWAYS_SECTIONS.countOverTime],
      "id-methodology": ["system", "operations"],
    },
    pagesWithRestrictions: [
      "operations",
      "prison",
      "supervision",
      "supervisionToPrison",
      "supervisionToLiberty",
    ],
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
      system: [PATHWAYS_PAGES.prison, PATHWAYS_PAGES.supervisionToPrison],
      prison: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countByLocation,
        PATHWAYS_SECTIONS.personLevelDetail,
      ],
      supervisionToPrison: [
        PATHWAYS_SECTIONS.countOverTime,
        PATHWAYS_SECTIONS.countByLocation,
      ],
      "id-methodology": ["system"],
    },
    pagesWithRestrictions: ["prison"],
    tableColumns: [
      {
        Header: "Name",
        accessor: "fullName",
        titleCase: true,
        width: 150,
      },
      {
        Header: "DOC ID",
        accessor: "stateId",
        titleCase: false,
        width: 100,
      },
      {
        Header: "Gender",
        accessor: "gender",
        titleCase: true,
        width: 80,
      },
      {
        Header: "Age",
        accessor: "age",
        titleCase: false,
        width: 80,
      },
      {
        Header: "Facility",
        accessor: "facility",
        titleCase: false,
        width: 80,
      },
      {
        Header: "Admission Reason",
        accessor: "legalStatus",
        titleCase: true,
      },
    ],
  },
  [lantern.US_MO]: {
    name: "Missouri",
    stateCode: "MO",
    availableStateCodes: [lantern.US_MO],
    enableUserRestrictions: true,
    enablePracticesCaseloadButton: false,
  },
  [core.US_ND]: {
    name: "North Dakota",
    stateCode: "ND",
    domain: "nd.gov",
    availableStateCodes: [core.US_ND],
    enableUserRestrictions: false,
    enablePracticesCaseloadButton: false,
    navigation: {
      goals: [],
      community: ["explore", "practices"],
      methodology: ["practices"],
      facilities: ["explore"],
    },
    pagesWithRestrictions: ["practices"],
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
    ).concat(core.CORE_TENANTS),
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
