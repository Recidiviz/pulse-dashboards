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
import { MetricId, SimulationCompartment } from "./models/types";

export type CoreView = keyof typeof CORE_VIEWS;
export const CORE_VIEWS: Record<string, string> = {
  community: "community",
  facilities: "facilities",
  goals: "goals",
  methodology: "methodology",
} as const;

export type PathwaysView = keyof typeof PATHWAYS_VIEWS;
export const PATHWAYS_VIEWS: Record<string, string> = {
  system: "system",
  operations: "operations",
  methodology: "id-methodology",
  profile: "profile",
} as const;

export const CORE_PATHS: Record<string, string> = {
  goals: "/goals",
  communityExplore: "/community/explore",
  communityProjections: "/community/projections",
  communityPractices: "/community/practices/:entityId?",
  facilitiesExplore: "/facilities/explore",
  facilitiesProjections: "/facilities/projections",
  methodology: "/methodology/:dashboard",
  methodologyPractices: "/methodology/practices",
  methodologyProjections: "/methodology/projections",
};

export const PATHWAYS_PATHS: Record<string, string> = {
  system: "/system/:pageId/:sectionId?",
  operations: "/operations/:entityId?",
  methodology: "/id-methodology/:dashboard",
  methodologySystem: "/id-methodology/system",
  methodologyOperations: "/id-methodology/operations",
};

export type CorePage = keyof typeof CORE_PAGES;
export const CORE_PAGES = {
  explore: "explore",
  projections: "projections",
  practices: "practices",
} as const;

export type PathwaysPage = keyof typeof PATHWAYS_PAGES;
export const PATHWAYS_PAGES = {
  prison: "prison",
  supervision: "supervision",
  supervisionToLiberty: "supervisionToLiberty",
  supervisionToPrison: "supervisionToPrison",
} as const;
export const PathwaysPageIdList = Object.keys(PATHWAYS_PAGES);

export type PathwaysSection = keyof typeof PATHWAYS_SECTIONS;
export const PATHWAYS_SECTIONS: Record<string, string> = {
  countOverTime: "countOverTime",
  countByLocation: "countByLocation",
  personLevelDetail: "personLevelDetail",
};

export const DEFAULT_PATHWAYS_PAGE = PATHWAYS_PAGES.prison;
export const DEFAULT_PATHWAYS_SECTION_BY_PAGE: Record<string, string> = {
  [PATHWAYS_PAGES.prison]: PATHWAYS_SECTIONS.countOverTime,
  [PATHWAYS_PAGES.supervision]: PATHWAYS_SECTIONS.countOverTime,
  [PATHWAYS_PAGES.supervisionToPrison]: PATHWAYS_SECTIONS.countOverTime,
  [PATHWAYS_PAGES.supervisionToLiberty]: PATHWAYS_SECTIONS.countOverTime,
};

const PATHWAYS_METRIC_IDS_BY_PAGE: Record<PathwaysPage, MetricId[]> = {
  [PATHWAYS_PAGES.prison]: [
    "prisonPopulationOverTime",
    "prisonFacilityPopulation",
    "prisonPopulationPersonLevel",
  ],
  [PATHWAYS_PAGES.supervision]: ["projectedSupervisionPopulationOverTime"],
  [PATHWAYS_PAGES.supervisionToPrison]: [
    "supervisionToPrisonOverTime",
    "supervisionToPrisonPopulationByDistrict",
  ],
  [PATHWAYS_PAGES.supervisionToLiberty]: ["supervisionToLibertyOverTime"],
};

export function getMetricIdsForPage(page: PathwaysPage): MetricId[] {
  return PATHWAYS_METRIC_IDS_BY_PAGE[page];
}

export const PATHWAYS_SECTION_BY_METRIC_ID: Record<
  MetricId,
  PathwaysSection
> = {
  prisonPopulationPersonLevel: PATHWAYS_SECTIONS.personLevelDetail,
  prisonFacilityPopulation: PATHWAYS_SECTIONS.countByLocation,
  supervisionToPrisonPopulationByDistrict: PATHWAYS_SECTIONS.countByLocation,
  prisonPopulationOverTime: PATHWAYS_SECTIONS.countOverTime,
  projectedPrisonPopulationOverTime: PATHWAYS_SECTIONS.countOverTime,
  projectedSupervisionPopulationOverTime: PATHWAYS_SECTIONS.countOverTime,
  supervisionToPrisonOverTime: PATHWAYS_SECTIONS.countOverTime,
  supervisionToLibertyOverTime: PATHWAYS_SECTIONS.countOverTime,
};

export function getSectionIdForMetric(metric: MetricId): PathwaysSection {
  return PATHWAYS_SECTION_BY_METRIC_ID[metric];
}

const pathnameToView: Record<string, string> = {
  [CORE_PATHS.goals]: CORE_VIEWS.goals,
  [CORE_PATHS.communityExplore]: CORE_VIEWS.community,
  [CORE_PATHS.communityProjections]: CORE_VIEWS.community,
  [CORE_PATHS.communityPractices]: CORE_VIEWS.community,
  [CORE_PATHS.facilitiesExplore]: CORE_VIEWS.facilities,
  [CORE_PATHS.facilitiesProjections]: CORE_VIEWS.facilities,
  [CORE_PATHS.methodologyPractices]: CORE_VIEWS.methodology,
  [CORE_PATHS.methodologyProjections]: CORE_VIEWS.methodology,
};

export function getCompartmentFromView(view: CoreView): SimulationCompartment {
  return view === CORE_VIEWS.community ? "SUPERVISION" : "INCARCERATION";
}

export function getViewFromPathname(pathname: string): string {
  return pathnameToView[pathname];
}

const pageIdToHeading: Record<string, string> = {
  [CORE_PAGES.explore]: "Explore",
  [CORE_PAGES.projections]: "Projections",
  [CORE_PAGES.practices]: "Practices",
  [PATHWAYS_PAGES.prison]: "Prison",
  [PATHWAYS_PAGES.supervision]: "Supervision",
  [PATHWAYS_PAGES.supervisionToPrison]: "Supervision to Prison",
  [PATHWAYS_PAGES.supervisionToLiberty]: "Supervision to Liberty",
  [PATHWAYS_VIEWS.system]: "System-Level Trends",
  [PATHWAYS_VIEWS.operations]: "Operational Metrics",
};

export function getPageHeadingFromId(pageId: string): string {
  return pageIdToHeading[pageId];
}
