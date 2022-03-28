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

import { OpportunityType } from "../firestore";
import { US_ID } from "../RootStore/TenantStore/pathwaysTenants";
import { MetricId, SimulationCompartment, TenantId } from "./models/types";

export type CoreView = keyof typeof CORE_VIEWS;
/**
 * Maps from view names to root paths
 */
export const CORE_VIEWS = {
  community: "community",
  facilities: "facilities",
  goals: "goals",
  methodology: "methodology",
} as const;
export const CoreViewIdList = Object.keys(CORE_VIEWS);
export type CoreViewRootPath = typeof CORE_VIEWS[CoreView];

export const isValidCoreRootPath = (str: string): boolean => {
  return Object.values(CORE_VIEWS).includes(str as CoreViewRootPath);
};

export type PathwaysView = keyof typeof PATHWAYS_VIEWS;
/**
 * Maps from view names to root paths
 */
export const PATHWAYS_VIEWS = {
  system: "system",
  operations: "operations",
  methodology: "id-methodology",
  profile: "profile",
  practices: "workflows",
} as const;
type PathwaysViewRootPath = typeof PATHWAYS_VIEWS[PathwaysView];

export const isValidPathwaysRootPath = (str: string): boolean => {
  return Object.values(PATHWAYS_VIEWS).includes(str as PathwaysViewRootPath);
};

export type ViewRootPath = CoreViewRootPath | PathwaysViewRootPath;

export const CORE_PATHS: Record<string, string> = {
  goals: `/${CORE_VIEWS.goals}`,
  communityExplore: `/${CORE_VIEWS.community}/explore`,
  communityProjections: `/${CORE_VIEWS.community}/projections`,
  communityPractices: `/${CORE_VIEWS.community}/practices/:entityId?`,
  facilitiesExplore: `/${CORE_VIEWS.facilities}/explore`,
  facilitiesProjections: `/${CORE_VIEWS.facilities}/projections`,
  methodology: `/${CORE_VIEWS.methodology}/:dashboard`,
  methodologyPractices: `/${CORE_VIEWS.methodology}/practices`,
  methodologyProjections: `/${CORE_VIEWS.methodology}/projections`,
};

export const PATHWAYS_PATHS: Record<string, string> = {
  system: `/${PATHWAYS_VIEWS.system}/:pageId/:sectionId?`,
  operations: `/${PATHWAYS_VIEWS.operations}/:entityId?`,
  methodology: `/${PATHWAYS_VIEWS.methodology}/:dashboard`,
  methodologySystem: `/${PATHWAYS_VIEWS.methodology}/system`,
  methodologyOperations: `/${PATHWAYS_VIEWS.methodology}/operations`,
  practices: `/${PATHWAYS_VIEWS.practices}`,
};

export type CorePage = keyof typeof CORE_PAGES;
export const CORE_PAGES = {
  explore: "explore",
  projections: "projections",
  practices: "practices",
} as const;
export const CorePageIdList = Object.keys(CORE_PAGES);

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
export type PathwaysPageRootPath = typeof PATHWAYS_PAGES[PathwaysPage];

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

const defaltPathwaysWithProjectionsSectionByPage: Record<string, string> = {
  ...DEFAULT_PATHWAYS_SECTION_BY_PAGE,
  [PATHWAYS_PAGES.prison]: PATHWAYS_SECTIONS.projectedCountOverTime,
  [PATHWAYS_PAGES.supervision]: PATHWAYS_SECTIONS.projectedCountOverTime,
};

export function getDefaultPathwaysSectionByPage(
  pageId: string,
  currentTenantId?: TenantId
): string {
  switch (currentTenantId) {
    case US_ID:
      return defaltPathwaysWithProjectionsSectionByPage[pageId];
    default:
      return DEFAULT_PATHWAYS_SECTION_BY_PAGE[pageId];
  }
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
    "prisonPopulationPersonLevel",
  ],
  [PATHWAYS_PAGES.prisonToSupervision]: [
    "prisonToSupervisionPopulationOverTime",
    "prisonToSupervisionPopulationByAge",
    "prisonToSupervisionPopulationByFacility",
    "prisonToSupervisionPopulationPersonLevel",
  ],
  [PATHWAYS_PAGES.supervision]: [
    "projectedSupervisionPopulationOverTime",
    "supervisionPopulationOverTime",
    "supervisionPopulationByDistrict",
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

export const PATHWAYS_SECTION_BY_METRIC_ID: Record<
  MetricId,
  PathwaysSection
> = {
  libertyToPrisonPopulationOverTime: PATHWAYS_SECTIONS.countOverTime,
  libertyToPrisonPopulationByDistrict: PATHWAYS_SECTIONS.countByLocation,
  libertyToPrisonPopulationByGender: PATHWAYS_SECTIONS.countByGender,
  libertyToPrisonPopulationByAgeGroup: PATHWAYS_SECTIONS.countByAgeGroup,
  libertyToPrisonPopulationByRace: PATHWAYS_SECTIONS.countByRace,
  libertyToPrisonPopulationByPriorLengthOfIncarceration:
    PATHWAYS_SECTIONS.countByPriorLengthOfIncarceration,
  prisonPopulationPersonLevel: PATHWAYS_SECTIONS.personLevelDetail,
  prisonFacilityPopulation: PATHWAYS_SECTIONS.countByLocation,
  prisonPopulationOverTime: PATHWAYS_SECTIONS.countOverTime,
  projectedPrisonPopulationOverTime: PATHWAYS_SECTIONS.projectedCountOverTime,
  projectedSupervisionPopulationOverTime:
    PATHWAYS_SECTIONS.projectedCountOverTime,
  prisonToSupervisionPopulationOverTime: PATHWAYS_SECTIONS.countOverTime,
  prisonToSupervisionPopulationByAge: PATHWAYS_SECTIONS.countByAgeGroup,
  prisonToSupervisionPopulationByFacility: PATHWAYS_SECTIONS.countByLocation,
  prisonToSupervisionPopulationPersonLevel: PATHWAYS_SECTIONS.personLevelDetail,
  supervisionPopulationOverTime: PATHWAYS_SECTIONS.countOverTime,
  supervisionPopulationByDistrict: PATHWAYS_SECTIONS.countByLocation,
  supervisionPopulationBySupervisionLevel:
    PATHWAYS_SECTIONS.countBySupervisionLevel,
  supervisionToPrisonOverTime: PATHWAYS_SECTIONS.countOverTime,
  supervisionToPrisonPopulationByDistrict: PATHWAYS_SECTIONS.countByLocation,
  supervisionToPrisonPopulationByMostSevereViolation:
    PATHWAYS_SECTIONS.countByMostSevereViolation,
  supervisionToPrisonPopulationByNumberOfViolations:
    PATHWAYS_SECTIONS.countByNumberOfViolations,
  supervisionToPrisonPopulationByLengthOfStay:
    PATHWAYS_SECTIONS.countByNumberOfViolations,
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

export type PracticesPage = OpportunityType;
export const PRACTICES_PAGES: Record<OpportunityType, string> = {
  compliantReporting: "compliantReporting",
};
export const PracticesPageIdList = Object.keys(PATHWAYS_PAGES);

const pathnameToView: Record<string, CoreView> = {
  [CORE_PATHS.goals]: "goals",
  [CORE_PATHS.communityExplore]: "community",
  [CORE_PATHS.communityProjections]: "community",
  [CORE_PATHS.communityPractices]: "community",
  [CORE_PATHS.facilitiesExplore]: "facilities",
  [CORE_PATHS.facilitiesProjections]: "facilities",
  [CORE_PATHS.methodologyPractices]: "methodology",
  [CORE_PATHS.methodologyProjections]: "methodology",
};

export function getCompartmentFromView(view: CoreView): SimulationCompartment {
  return view === CORE_VIEWS.community ? "SUPERVISION" : "INCARCERATION";
}

export function getViewFromPathname(pathname: string): CoreView {
  return pathnameToView[pathname];
}

const defaultPageIdToHeading: Record<string, string> = {
  [CORE_PAGES.explore]: "Explore",
  [CORE_PAGES.projections]: "Projections",
  [CORE_PAGES.practices]: "Practices",
  [PATHWAYS_PAGES.libertyToPrison]: "Liberty to Prison",
  [PATHWAYS_PAGES.prison]: "Prison",
  [PATHWAYS_PAGES.prisonToSupervision]: "Prison to Supervision",
  [PATHWAYS_PAGES.supervision]: "Supervision",
  [PATHWAYS_PAGES.supervisionToPrison]: "Supervision to Prison",
  [PATHWAYS_PAGES.supervisionToLiberty]: "Supervision to Liberty",
  [PATHWAYS_VIEWS.system]: "System-Level Trends",
  [PATHWAYS_VIEWS.operations]: "Operational Metrics",
};

const ndPageToIdHeading: Record<string, string> = {
  ...defaultPageIdToHeading,
  [PATHWAYS_PAGES.libertyToPrison]: "Liberty to Incarceration",
  [PATHWAYS_PAGES.prison]: "Incarceration",
  [PATHWAYS_PAGES.prisonToSupervision]: "Incarceration to Supervision",
  [PATHWAYS_PAGES.supervisionToPrison]: "Supervision to Incarceration",
};

// TODO #1639 Move to content system
const pageIdToHeading: Record<TenantId, Record<string, string>> = {
  US_ID: defaultPageIdToHeading,
  US_ME: defaultPageIdToHeading,
  US_TN: defaultPageIdToHeading,
  US_MI: defaultPageIdToHeading,
  US_ND: ndPageToIdHeading,
};

export function getPageHeadingFromId(
  pageId: string,
  currentTenantId: TenantId
): string {
  return pageIdToHeading[currentTenantId][pageId];
}
