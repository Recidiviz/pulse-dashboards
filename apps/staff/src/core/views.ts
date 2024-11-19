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

import { psiRootPath } from "~sentencing-client";

import { MetricId, SystemId } from "./models/types";

export const UNRESTRICTED_PAGES = ["profile", "methodology", ""];

export type DashboardView = keyof typeof DASHBOARD_VIEWS;
/**
 * Maps from view names to root paths
 */
export const DASHBOARD_VIEWS = {
  system: "system",
  operations: "operations",
  methodology: "methodology",
  profile: "profile",
  workflows: "workflows",
  insights: "insights",
  psi: psiRootPath,
  revocations: "revocations", // lantern
} as const;
export type DashboardViewRootPath = (typeof DASHBOARD_VIEWS)[DashboardView];

export const isValidDashboardRootPath = (str: string): boolean => {
  return Object.values(DASHBOARD_VIEWS).includes(str as DashboardViewRootPath);
};

export type ViewRootPath = DashboardViewRootPath;

export const DASHBOARD_PATHS: Record<string, string> = {
  system: `/${DASHBOARD_VIEWS.system}/:pageId/:sectionId?`,
  operations: `/${DASHBOARD_VIEWS.operations}/:entityId?`,
  methodology: `/${DASHBOARD_VIEWS.methodology}/:dashboard`,
  methodologySystem: `/${DASHBOARD_VIEWS.methodology}/system`,
  methodologyOperations: `/${DASHBOARD_VIEWS.methodology}/operations`,
  insights: `/${DASHBOARD_VIEWS.insights}`,
  workflows: `/${DASHBOARD_VIEWS.workflows}`,
  psi: `/${DASHBOARD_VIEWS.psi}`,
};

export type PathwaysPage = keyof typeof PATHWAYS_PAGES;
export const PATHWAYS_PAGES = {
  libertyToPrison: "libertyToPrison",
  prison: "prison",
  prisonToSupervision: "prisonToSupervision",
  supervision: "supervision",
  supervisionToLiberty: "supervisionToLiberty",
  supervisionToPrison: "supervisionToPrison",
} as const;
export const PathwaysPageIdList = Object.keys(PATHWAYS_PAGES);
export type PathwaysPageRootPath = (typeof PATHWAYS_PAGES)[PathwaysPage];

export type PathwaysSection = keyof typeof PATHWAYS_SECTIONS;
export const PATHWAYS_SECTIONS: Record<string, string> = {
  countOverTime: "countOverTime",
  projectedCountOverTime: "projectedCountOverTime",
  countByLocation: "countByLocation",
  personLevelDetail: "personLevelDetail",
  countByMostSevereViolation: "countByMostSevereViolation",
  countByNumberOfViolations: "countByNumberOfViolations",
  countByLengthOfStay: "countByLengthOfStay",
  countByAgeGroup: "countByAgeGroup",
  countBySupervisionLevel: "countBySupervisionLevel",
  countByPriorLengthOfIncarceration: "countByPriorLengthOfIncarceration",
  countByGender: "countByGender",
  countByRace: "countByRace",
  countByOfficer: "countByOfficer",
};

export const DEFAULT_PATHWAYS_PAGE = PATHWAYS_PAGES.prison;
export const DEFAULT_PATHWAYS_SECTION_BY_PAGE: Record<string, string> = {
  [PATHWAYS_PAGES.libertyToPrison]: PATHWAYS_SECTIONS.countOverTime,
  [PATHWAYS_PAGES.prison]: PATHWAYS_SECTIONS.countOverTime,
  [PATHWAYS_PAGES.prisonToSupervision]: PATHWAYS_SECTIONS.countOverTime,
  [PATHWAYS_PAGES.supervision]: PATHWAYS_SECTIONS.countOverTime,
  [PATHWAYS_PAGES.supervisionToPrison]: PATHWAYS_SECTIONS.countOverTime,
  [PATHWAYS_PAGES.supervisionToLiberty]: PATHWAYS_SECTIONS.countOverTime,
};

export function getDefaultPathwaysSectionByPage(pageId: string): string {
  return DEFAULT_PATHWAYS_SECTION_BY_PAGE[pageId];
}

const PATHWAYS_METRIC_IDS_BY_PAGE: Record<PathwaysPage, MetricId[]> = {
  [PATHWAYS_PAGES.libertyToPrison]: [
    "libertyToPrisonPopulationOverTime",
    "libertyToPrisonPopulationByDistrict",
    "libertyToPrisonPopulationByGender",
    "libertyToPrisonPopulationByAgeGroup",
    "libertyToPrisonPopulationByRace",
    "libertyToPrisonPopulationByPriorLengthOfIncarceration",
  ],
  [PATHWAYS_PAGES.prison]: [
    "projectedPrisonPopulationOverTime",
    "prisonPopulationOverTime",
    "prisonFacilityPopulation",
    "prisonPopulationByRace",
    "prisonPopulationPersonLevel",
  ],
  [PATHWAYS_PAGES.prisonToSupervision]: [
    "prisonToSupervisionPopulationOverTime",
    "prisonToSupervisionPopulationByAge",
    "prisonToSupervisionPopulationByRace",
    "prisonToSupervisionPopulationByFacility",
    "prisonToSupervisionPopulationPersonLevel",
  ],
  [PATHWAYS_PAGES.supervision]: [
    "projectedSupervisionPopulationOverTime",
    "supervisionPopulationOverTime",
    "supervisionPopulationByDistrict",
    "supervisionPopulationByRace",
    "supervisionPopulationBySupervisionLevel",
  ],
  [PATHWAYS_PAGES.supervisionToPrison]: [
    "supervisionToPrisonOverTime",
    "supervisionToPrisonPopulationByDistrict",
    "supervisionToPrisonPopulationByMostSevereViolation",
    "supervisionToPrisonPopulationByNumberOfViolations",
    "supervisionToPrisonPopulationByLengthOfStay",
    "supervisionToPrisonPopulationBySupervisionLevel",
    "supervisionToPrisonPopulationByGender",
    "supervisionToPrisonPopulationByRace",
    "supervisionToPrisonPopulationByOfficer",
  ],
  [PATHWAYS_PAGES.supervisionToLiberty]: [
    "supervisionToLibertyOverTime",
    "supervisionToLibertyPopulationByLengthOfStay",
    "supervisionToLibertyPopulationByLocation",
    "supervisionToLibertyPopulationByGender",
    "supervisionToLibertyPopulationByAgeGroup",
    "supervisionToLibertyPopulationByRace",
  ],
};

export function getMetricIdsForPage(page: PathwaysPage): MetricId[] {
  return PATHWAYS_METRIC_IDS_BY_PAGE[page];
}

export const PATHWAYS_SECTION_BY_METRIC_ID: Record<MetricId, PathwaysSection> =
  {
    libertyToPrisonPopulationOverTime: PATHWAYS_SECTIONS.countOverTime,
    libertyToPrisonPopulationByDistrict: PATHWAYS_SECTIONS.countByLocation,
    libertyToPrisonPopulationByGender: PATHWAYS_SECTIONS.countByGender,
    libertyToPrisonPopulationByAgeGroup: PATHWAYS_SECTIONS.countByAgeGroup,
    libertyToPrisonPopulationByRace: PATHWAYS_SECTIONS.countByRace,
    libertyToPrisonPopulationByPriorLengthOfIncarceration:
      PATHWAYS_SECTIONS.countByPriorLengthOfIncarceration,
    prisonPopulationPersonLevel: PATHWAYS_SECTIONS.personLevelDetail,
    prisonFacilityPopulation: PATHWAYS_SECTIONS.countByLocation,
    prisonPopulationByRace: PATHWAYS_SECTIONS.countByRace,
    prisonPopulationOverTime: PATHWAYS_SECTIONS.countOverTime,
    projectedPrisonPopulationOverTime: PATHWAYS_SECTIONS.projectedCountOverTime,
    projectedSupervisionPopulationOverTime:
      PATHWAYS_SECTIONS.projectedCountOverTime,
    prisonToSupervisionPopulationOverTime: PATHWAYS_SECTIONS.countOverTime,
    prisonToSupervisionPopulationByAge: PATHWAYS_SECTIONS.countByAgeGroup,
    prisonToSupervisionPopulationByFacility: PATHWAYS_SECTIONS.countByLocation,
    prisonToSupervisionPopulationByRace: PATHWAYS_SECTIONS.countByRace,
    prisonToSupervisionPopulationPersonLevel:
      PATHWAYS_SECTIONS.personLevelDetail,
    supervisionPopulationOverTime: PATHWAYS_SECTIONS.countOverTime,
    supervisionPopulationByDistrict: PATHWAYS_SECTIONS.countByLocation,
    supervisionPopulationByRace: PATHWAYS_SECTIONS.countByRace,
    supervisionPopulationBySupervisionLevel:
      PATHWAYS_SECTIONS.countBySupervisionLevel,
    supervisionToPrisonOverTime: PATHWAYS_SECTIONS.countOverTime,
    supervisionToPrisonPopulationByDistrict: PATHWAYS_SECTIONS.countByLocation,
    supervisionToPrisonPopulationByMostSevereViolation:
      PATHWAYS_SECTIONS.countByMostSevereViolation,
    supervisionToPrisonPopulationByNumberOfViolations:
      PATHWAYS_SECTIONS.countByNumberOfViolations,
    supervisionToPrisonPopulationByLengthOfStay:
      PATHWAYS_SECTIONS.countByLengthOfStay,
    supervisionToPrisonPopulationBySupervisionLevel:
      PATHWAYS_SECTIONS.countBySupervisionLevel,
    supervisionToPrisonPopulationByGender: PATHWAYS_SECTIONS.countByGender,
    supervisionToPrisonPopulationByRace: PATHWAYS_SECTIONS.countByRace,
    supervisionToPrisonPopulationByOfficer: PATHWAYS_SECTIONS.countByOfficer,
    supervisionToLibertyOverTime: PATHWAYS_SECTIONS.countOverTime,
    supervisionToLibertyPopulationByLengthOfStay:
      PATHWAYS_SECTIONS.countByLengthOfStay,
    supervisionToLibertyPopulationByLocation: PATHWAYS_SECTIONS.countByLocation,
    supervisionToLibertyPopulationByGender: PATHWAYS_SECTIONS.countByGender,
    supervisionToLibertyPopulationByAgeGroup: PATHWAYS_SECTIONS.countByAgeGroup,
    supervisionToLibertyPopulationByRace: PATHWAYS_SECTIONS.countByRace,
  };

export function getSectionIdForMetric(metric: MetricId): PathwaysSection {
  return PATHWAYS_SECTION_BY_METRIC_ID[metric];
}

export const WORKFLOWS_PATHS = {
  opportunityClients: `/${DASHBOARD_VIEWS.workflows}/:opportunityTypeUrl`,
  opportunityAction: `/${DASHBOARD_VIEWS.workflows}/:opportunityTypeUrl/:justiceInvolvedPersonId/:opportunityPseudoId`,
  workflows: `/${DASHBOARD_VIEWS.workflows}`,
  home: `/${DASHBOARD_VIEWS.workflows}/home`,
  tasks: `/${DASHBOARD_VIEWS.workflows}/tasks`,
  milestones: `/${DASHBOARD_VIEWS.workflows}/milestones`,
  clients: `/${DASHBOARD_VIEWS.workflows}/clients`,
  residents: `/${DASHBOARD_VIEWS.workflows}/residents`,
  clientProfile: `/${DASHBOARD_VIEWS.workflows}/clients/:justiceInvolvedPersonId`,
  residentProfile: `/${DASHBOARD_VIEWS.workflows}/residents/:justiceInvolvedPersonId`,
};

// Routes not associated with an opportunity or task that should have an
// active system selected.
export const WORKFLOWS_SYSTEM_ID_TO_PAGE: Record<SystemId, string[]> = {
  INCARCERATION: ["residents"],
  SUPERVISION: ["clients", "tasks", "milestones"],
  ALL: ["home"],
};

export const WorkflowsPageIdList = [
  "clients",
  "residents",
  "clientProfile",
  "residentProfile",
  "home",
  "opportunityClients",
  "opportunityAction",
  "tasks",
  "milestones",
] as const;

export type WorkflowsPage = (typeof WorkflowsPageIdList)[number];

export const WORKFLOWS_PAGES: Record<WorkflowsPage, string> = {
  home: "home",
  clients: "clients",
  clientProfile: "clientProfile",
  residents: "residents",
  residentProfile: "residentProfile",
  opportunityClients: "opportunityClients",
  opportunityAction: "opportunityAction",
  tasks: "tasks",
  milestones: "milestones",
};

/**
 * @returns the relative route template string for a Workflows page
 */
export function workflowsRoute({
  routeName,
}: {
  routeName: WorkflowsPage;
}): string {
  return getRelativePath(WORKFLOWS_PATHS[routeName]);
}

type WorkflowsRouteParams = {
  opportunityPseudoId?: string;
  justiceInvolvedPersonId?: string;
  urlSection?: string;
};

/**
 * @returns an absolute path for the specified route + params (where applicable)
 */
export function workflowsUrl(
  routeName: WorkflowsPage,
  params?: WorkflowsRouteParams,
): string {
  if (params) {
    const transformedParams = {
      ...params,
      ...(params.urlSection && {
        opportunityTypeUrl: params.urlSection,
      }),
    };
    return Object.keys(transformedParams).reduce((path, param) => {
      const value = transformedParams[param as keyof typeof params];
      return value ? path.replace(new RegExp(`:${param}(?=$|/)`), value) : path;
    }, WORKFLOWS_PATHS[routeName]);
  }
  return WORKFLOWS_PATHS[routeName];
}

export const INSIGHTS_PATHS: Record<InsightsPage, string> = {
  supervision: `/${DASHBOARD_VIEWS.insights}/supervision`,
  supervisionOnboarding: `/${DASHBOARD_VIEWS.insights}/supervision/onboarding`,
  supervisionSupervisorsList: `/${DASHBOARD_VIEWS.insights}/supervision/supervisors-list`,
  supervisionSupervisor: `/${DASHBOARD_VIEWS.insights}/supervision/supervisor/:supervisorPseudoId`,
  supervisionStaff: `/${DASHBOARD_VIEWS.insights}/supervision/staff/:officerPseudoId`,
  supervisionStaffMetric: `/${DASHBOARD_VIEWS.insights}/supervision/staff/:officerPseudoId/outcome/:metricId`,
  supervisionClientDetail: `/${DASHBOARD_VIEWS.insights}/supervision/staff/:officerPseudoId/outcome/:metricId/client/:clientPseudoId/:outcomeDate`,
  supervisionOpportunity: `/${DASHBOARD_VIEWS.insights}/supervision/staff/:officerPseudoId/opportunity/:opportunityTypeUrl`,
  supervisionOpportunityForm: `/${DASHBOARD_VIEWS.insights}/supervision/staff/:officerPseudoId/opportunity/:opportunityTypeUrl/:clientPseudoId/:opportunityPseudoId`,
};

export type InsightsPage = keyof typeof INSIGHTS_PAGES;

export const INSIGHTS_PAGES = {
  supervision: "supervision",
  supervisionOnboarding: "supervisionOnboarding",
  supervisionSupervisor: "supervisionSupervisor",
  supervisionSupervisorsList: "supervisionSupervisorsList",
  supervisionStaff: "supervisionStaff",
  supervisionStaffMetric: "supervisionStaffMetric",
  supervisionClientDetail: "supervisionClientDetail",
  supervisionOpportunity: "supervisionOpportunity",
  supervisionOpportunityForm: "supervisionOpportunityForm",
} as const;

type InsightsRouteParams = {
  [k: string]: string;
};

/**
 * @returns the relative route template string for a Insights page
 */
export function insightsRoute({
  routeName,
}: {
  routeName: InsightsPage;
}): string {
  return getRelativePath(INSIGHTS_PATHS[routeName]);
}

export function insightsUrl(routeName: "supervision"): string;
export function insightsUrl(routeName: "supervisionOnboarding"): string;
export function insightsUrl(routeName: "supervisionSupervisorsList"): string;
export function insightsUrl(
  routeName: "supervisionSupervisor",
  params: { supervisorPseudoId: string },
): string;
export function insightsUrl(
  routeName: "supervisionStaff",
  params: { officerPseudoId: string },
): string;
export function insightsUrl(
  routeName: "supervisionClientDetail",
  params: {
    officerPseudoId: string;
    metricId: string;
    clientPseudoId: string;
    outcomeDate: string;
  },
): string;
export function insightsUrl(
  routeName: "supervisionStaffMetric",
  params: { officerPseudoId: string; metricId: string },
): string;
export function insightsUrl(
  routeName: "supervisionOpportunity",
  params: { officerPseudoId: string; opportunityTypeUrl: string },
): string;
export function insightsUrl(
  routeName: "supervisionOpportunityForm",
  params: {
    officerPseudoId: string;
    opportunityTypeUrl: string;
    clientPseudoId: string;
    opportunityPseudoId: string;
  },
): string;

export function insightsUrl(
  routeName: InsightsPage,
  params?: InsightsRouteParams,
): string {
  if (params) {
    let path = INSIGHTS_PATHS[routeName];
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, value);
    });
    return path;
  }
  return INSIGHTS_PATHS[routeName];
}

export function getRelativePath(absolutePath: string): string {
  const matchingRootPath = Object.values(DASHBOARD_PATHS).find((rootPath) =>
    absolutePath.startsWith(rootPath),
  );

  if (!matchingRootPath) return absolutePath;

  return absolutePath.replace(matchingRootPath, "");
}
