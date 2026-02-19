// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { MetricId } from "./types";

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
  countBySex: "countBySex",
  countByRace: "countByRace",
  countByOfficer: "countByOfficer",
  countByEthnicity: "countByEthnicity",
  countBySentenceLengthMin: "countBySentenceLengthMin",
  countBySentenceLengthMax: "countBySentenceLengthMax",
};

export const DEFAULT_PATHWAYS_PAGE = PATHWAYS_PAGES.prison;
export const DEFAULT_PATHWAYS_SECTION_BY_PAGE: Record<string, string> = {
  [PATHWAYS_PAGES.libertyToPrison]: PATHWAYS_SECTIONS["countOverTime"],
  [PATHWAYS_PAGES.prison]: PATHWAYS_SECTIONS["countOverTime"],
  [PATHWAYS_PAGES.prisonToSupervision]: PATHWAYS_SECTIONS["countOverTime"],
  [PATHWAYS_PAGES.supervision]: PATHWAYS_SECTIONS["countOverTime"],
  [PATHWAYS_PAGES.supervisionToPrison]: PATHWAYS_SECTIONS["countOverTime"],
  [PATHWAYS_PAGES.supervisionToLiberty]: PATHWAYS_SECTIONS["countOverTime"],
};

export function getDefaultPathwaysSectionByPage(pageId: string): string {
  return DEFAULT_PATHWAYS_SECTION_BY_PAGE[pageId];
}

const PATHWAYS_METRIC_IDS_BY_PAGE: Record<PathwaysPage, MetricId[]> = {
  [PATHWAYS_PAGES.libertyToPrison]: [
    "libertyToPrisonPopulationOverTime",
    "libertyToPrisonPopulationByDistrict",
    "libertyToPrisonPopulationBySex",
    "libertyToPrisonPopulationByAgeGroup",
    "libertyToPrisonPopulationByRace",
    "libertyToPrisonPopulationByPriorLengthOfIncarceration",
  ],
  [PATHWAYS_PAGES.prison]: [
    "projectedPrisonPopulationOverTime",
    "prisonPopulationOverTime",
    "prisonFacilityPopulation",
    "prisonPopulationByRace",
    "prisonPopulationBySex",
    "prisonPopulationByAgeGroup",
    "prisonPopulationByEthnicity",
    "prisonPopulationBySentenceLengthMin",
    "prisonPopulationBySentenceLengthMax",
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
    "supervisionToPrisonPopulationBySex",
    "supervisionToPrisonPopulationByRace",
    "supervisionToPrisonPopulationByOfficer",
  ],
  [PATHWAYS_PAGES.supervisionToLiberty]: [
    "supervisionToLibertyOverTime",
    "supervisionToLibertyPopulationByLengthOfStay",
    "supervisionToLibertyPopulationByLocation",
    "supervisionToLibertyPopulationBySex",
    "supervisionToLibertyPopulationByAgeGroup",
    "supervisionToLibertyPopulationByRace",
  ],
};

export function getMetricIdsForPage(page: PathwaysPage): MetricId[] {
  return PATHWAYS_METRIC_IDS_BY_PAGE[page];
}

export const PATHWAYS_SECTION_BY_METRIC_ID: Record<MetricId, PathwaysSection> =
  {
    libertyToPrisonPopulationOverTime: PATHWAYS_SECTIONS["countOverTime"],
    libertyToPrisonPopulationByDistrict: PATHWAYS_SECTIONS["countByLocation"],
    libertyToPrisonPopulationBySex: PATHWAYS_SECTIONS["countBySex"],
    libertyToPrisonPopulationByAgeGroup: PATHWAYS_SECTIONS["countByAgeGroup"],
    libertyToPrisonPopulationByRace: PATHWAYS_SECTIONS["countByRace"],
    libertyToPrisonPopulationByPriorLengthOfIncarceration:
      PATHWAYS_SECTIONS["countByPriorLengthOfIncarceration"],
    prisonPopulationPersonLevel: PATHWAYS_SECTIONS["personLevelDetail"],
    prisonFacilityPopulation: PATHWAYS_SECTIONS["countByLocation"],
    prisonPopulationByRace: PATHWAYS_SECTIONS["countByRace"],
    prisonPopulationByGender: PATHWAYS_SECTIONS["countByGender"],
    prisonPopulationBySex: PATHWAYS_SECTIONS["countBySex"],
    prisonPopulationByAgeGroup: PATHWAYS_SECTIONS["countByAgeGroup"],
    prisonPopulationByEthnicity: PATHWAYS_SECTIONS["countByEthnicity"],
    prisonPopulationBySentenceLengthMin:
      PATHWAYS_SECTIONS["countBySentenceLengthMin"],
    prisonPopulationBySentenceLengthMax:
      PATHWAYS_SECTIONS["countBySentenceLengthMax"],
    prisonPopulationOverTime: PATHWAYS_SECTIONS["countOverTime"],
    projectedPrisonPopulationOverTime: PATHWAYS_SECTIONS["projectedCountOverTime"],
    projectedSupervisionPopulationOverTime:
      PATHWAYS_SECTIONS["projectedCountOverTime"],
    prisonToSupervisionPopulationOverTime: PATHWAYS_SECTIONS["countOverTime"],
    prisonToSupervisionPopulationByAge: PATHWAYS_SECTIONS["countByAgeGroup"],
    prisonToSupervisionPopulationByFacility: PATHWAYS_SECTIONS["countByLocation"],
    prisonToSupervisionPopulationByRace: PATHWAYS_SECTIONS["countByRace"],
    prisonToSupervisionPopulationPersonLevel:
      PATHWAYS_SECTIONS["personLevelDetail"],
    supervisionPopulationOverTime: PATHWAYS_SECTIONS["countOverTime"],
    supervisionPopulationByDistrict: PATHWAYS_SECTIONS["countByLocation"],
    supervisionPopulationByRace: PATHWAYS_SECTIONS["countByRace"],
    supervisionPopulationBySupervisionLevel:
      PATHWAYS_SECTIONS["countBySupervisionLevel"],
    supervisionToPrisonOverTime: PATHWAYS_SECTIONS["countOverTime"],
    supervisionToPrisonPopulationByDistrict: PATHWAYS_SECTIONS["countByLocation"],
    supervisionToPrisonPopulationByMostSevereViolation:
      PATHWAYS_SECTIONS["countByMostSevereViolation"],
    supervisionToPrisonPopulationByNumberOfViolations:
      PATHWAYS_SECTIONS["countByNumberOfViolations"],
    supervisionToPrisonPopulationByLengthOfStay:
      PATHWAYS_SECTIONS["countByLengthOfStay"],
    supervisionToPrisonPopulationBySupervisionLevel:
      PATHWAYS_SECTIONS["countBySupervisionLevel"],
    supervisionToPrisonPopulationBySex: PATHWAYS_SECTIONS["countBySex"],
    supervisionToPrisonPopulationByRace: PATHWAYS_SECTIONS["countByRace"],
    supervisionToPrisonPopulationByOfficer: PATHWAYS_SECTIONS["countByOfficer"],
    supervisionToLibertyOverTime: PATHWAYS_SECTIONS["countOverTime"],
    supervisionToLibertyPopulationByLengthOfStay:
      PATHWAYS_SECTIONS["countByLengthOfStay"],
    supervisionToLibertyPopulationByLocation: PATHWAYS_SECTIONS["countByLocation"],
    supervisionToLibertyPopulationBySex: PATHWAYS_SECTIONS["countBySex"],
    supervisionToLibertyPopulationByAgeGroup: PATHWAYS_SECTIONS["countByAgeGroup"],
    supervisionToLibertyPopulationByRace: PATHWAYS_SECTIONS["countByRace"],
  };

export function getSectionIdForMetric(metric: MetricId): PathwaysSection {
  return PATHWAYS_SECTION_BY_METRIC_ID[metric];
}
