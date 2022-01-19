/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2021 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */

import { MetricCopy } from "../../types";

const content: MetricCopy = {
  libertyToPrisonPopulationOverTime: {
    title: "Admissions from liberty to prison over time",
    note: "Admissions from liberty to prison over time note",
    methodology: "Admissions from liberty to prison over time methodology",
  },
  libertyToPrisonPopulationByDistrict: {
    title: "Admissions from liberty to prison by district",
    note: "Admissions from liberty to prison by district note",
    methodology: "Admissions from liberty to prison by district methodology",
  },
  libertyToPrisonPopulationByPriorLengthOfIncarceration: {
    title: "Admissions from liberty by prior length of incarceration",
    note: "Admissions from liberty by prior length of incarceration note",
    methodology:
      "Admissions from liberty by prior length of incarceration methodology",
  },
  libertyToPrisonPopulationByGender: {
    title: "Admissions from liberty by gender",
    note: "Admissions from liberty by gender note",
    methodology: "Admissions from liberty by gender methodology",
  },
  libertyToPrisonPopulationByAgeGroup: {
    title: "Admissions from liberty by age",
    note: "Admissions from liberty by age note",
    methodology: "Admissions from liberty by age methodology",
  },
  libertyToPrisonPopulationByRace: {
    title: "Admissions from liberty by race",
    note: "Admissions from liberty by race note",
    methodology: "Admissions from liberty by race methodology",
  },
  prisonPopulationPersonLevel: {
    title: "List of people in prison",
  },
  prisonFacilityPopulation: {
    title: "Incarcerated Population by Prison",
    note: "Incarcerated population by prison note",
    methodology: "Incarcerated population by prison methodology",
  },
  prisonPopulationOverTime: {
    title: "Incarcerated Population",
    note: "Incarcerated population note",
    methodology: "Incarcerated population methodology",
  },
  projectedPrisonPopulationOverTime: {
    title: "Incarcerated Population",
    note: "Incarcerated population note",
    methodology: "Incarcerated population methodology",
  },
  projectedSupervisionPopulationOverTime: {
    title: "Supervised Population",
    note: "Supervised population note",
    methodology: "Supervised population methodology",
  },
  prisonToSupervisionPopulationOverTime: {
    title: "Releases from prison to supervision over time",
    note: "Releases from prison to supervision over time note",
    methodology: "Releases from prison to supervision over time methodology",
  },
  prisonToSupervisionPopulationByAge: {
    title: "Releases from prison to supervision by age",
    note: "Releases from prison to supervision by age note",
    methodology: "Releases from prison to supervision by age methodology",
  },
  prisonToSupervisionPopulationByFacility: {
    title: "Releases from prison to supervision by facility",
    note: "Releases from prison to supervision by facility note",
    methodology: "Releases from prison to supervision by facility methodology",
  },
  prisonToSupervisionPopulationPersonLevel: {
    title: "List of releases from prison to supervision",
    note: "List of releases from prison to supervision note",
    methodology: "List of releases from prison to supervision methodology",
  },
  supervisionPopulationOverTime: {
    title: "Supervision population over time",
    note: "Supervision population over time note",
    methodology: "Supervision population over time methodology",
  },
  supervisionPopulationByDistrict: {
    title: "Supervision population by district",
    note: "Supervision population by district",
    methodology: "Supervision population by district methodology",
  },
  supervisionPopulationBySupervisionLevel: {
    title: "Supervision population by supervision level",
    note: "Supervision population by supervision level note",
    methodology: "Supervision population by supervision level methodology",
  },
  supervisionToPrisonOverTime: {
    title: "Admissions to prison from supervision",
    note: "Admissions to prison from supervision note",
    methodology: "Admissions to prison from supervision methodology",
  },
  supervisionToPrisonPopulationByDistrict: {
    title: "Admissions from supervision by district",
    note: "Admissions from supervision by district note",
    methodology: "Admissions from supervision by district methodology",
  },
  supervisionToPrisonPopulationByMostSevereViolation: {
    title: "Admissions from supervision by most severe violation",
    note: "Admissions from supervision by most severe violation note",
    methodology:
      "Admissions from supervision by most severe violation methodology",
  },
  supervisionToPrisonPopulationByNumberOfViolations: {
    title: "Admissions from supervision by number of violations",
    note: "Admissions from supervision by number of violations note",
    methodology:
      "Admissions from supervision by number of violations methodology",
  },
  supervisionToPrisonPopulationByLengthOfStay: {
    title: "Time to admission from supervision",
    note: "Time to admission from supervision note",
    methodology: "Time to admission from supervision methodology",
  },
  supervisionToPrisonPopulationBySupervisionLevel: {
    title: "Admissions from supervision to prison by supervision level",
    note: "Admissions from supervision to prison by supervision level note",
    methodology:
      "Admissions from supervision to prison by supervision level methodology",
  },
  supervisionToPrisonPopulationByGender: {
    title: "Admissions from supervision by gender",
    note: "Admissions from supervision by gender note",
    methodology: "Admissions from supervision by gender methodology",
  },
  supervisionToPrisonPopulationByRace: {
    title: "Admissions from supervision by race",
    note: "Admissions from supervision by race note",
    methodology: "Admissions from supervision by race methodology",
  },
  supervisionToLibertyOverTime: {
    title: "Releases to from supervision to liberty",
    note: "Releases to from supervision to liberty note",
    methodology: "Releases to from supervision to liberty methodology",
  },
  supervisionToLibertyPopulationByLengthOfStay: {
    title: "Time to release from supervision to liberty",
    note: "Time to release from supervision to liberty",
    methodology: "Time to release from supervision to liberty methodology",
  },
  supervisionToLibertyPopulationByLocation: {
    title: "Releases to from supervision by district",
    note: "Releases to from supervision by district note",
    methodology: "Releases to from supervision by district methodology",
  },
  supervisionToLibertyPopulationByGender: {
    title: "Releases to from supervision by gender",
    note: "Releases to from supervision by gender",
    methodology: "Releases to from supervision by gender methodology",
  },
  supervisionToLibertyPopulationByAgeGroup: {
    title: "Releases to from supervision by age",
    note: "Releases to from supervision by age note",
    methodology: "Releases to from supervision by age methodology",
  },
  supervisionToLibertyPopulationByRace: {
    title: "Releases to from supervision by race",
    note: "Releases to from supervision by race note",
    methodology: "Releases to from supervision by race methodology",
  },
};

export default content;
