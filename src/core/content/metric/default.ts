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

import { MetricCopy } from "../types";

const content: MetricCopy = {
  projectedPrisonPopulationOverTime: {
    title: "Prison population over time",
    note: "Historical and projected population data were generated",
  },
  projectedSupervisionPopulationOverTime: {
    title: "Supervision population over time",
    note: "Historical and projected population data were generated",
  },
  supervisionToLibertyOverTime: {
    title: "Releases from supervision over time",
    methodology:
      'The chart describes the historical supervision population over the selected "Time Period". Each data point represents the total population for the selected group on the first day of that month. For example, hovering over the "November 2020" data point on the chart will show the total number of people described in the section above on November 1, 2020. ',
  },
  prisonPopulationOverTime: {
    title: "Incarceration population over time",
    methodology:
      'The chart describes the historical incarceration population over the selected "Time Period". Each data point represents the total population for the selected group on the first day of that month. For example, hovering over the "November 2020" data point on the chart will show the total number of people described in the section above on November 1, 2020. ',
  },
  prisonPopulationPersonLevel: {
    title: "List of people in incarceration",
    methodology:
      "The table includes a row for each person in incarceration as of the date specified in the chart title. ",
  },
  prisonFacilityPopulation: {
    title: "Prison population by facility",
    methodology:
      "The chart describes the number of people in each facility as of the date specified in the chart title. ",
  },
  supervisionToPrisonPopulationByDistrict: {
    title: "Admissions from supervision by district",
    methodology:
      'The chart describes the number of people admitted to prison from each district as of the date specified in the chart title. When "Counts" is selected, the number of people in each district is shown. When "Rates" is selected, the percentage shows the number of people in each district divided by the total number of people admitted to incarceration.',
  },
  supervisionToPrisonOverTime: {
    title: "Admissions from supervision over time",
    methodology:
      "These charts include events where people are admitted from supervision to incarceration. This includes revocations, sanction admissions, and new court commits that occur while an individual is on supervision. Revocations are counted when the person was admitted to incarceration status, not when the violation occurred. All charts on this page are event-based, so if a single person has 2 revocations during the selected time period, 2 events are counted on this page.",
  },
  supervisionToPrisonPopulationByLengthOfStay: {
    title: "Time to admission from supervision to prison",
    chartXAxisTitle: "Time to admission from supervision to prison, in months",
  },
  supervisionToPrisonPopulationByNumberOfViolations: {
    title: "Admissions from supervision to prison by number of violations",
    chartXAxisTitle: "Number of violations prior to admission to prison",
  },
  supervisionToPrisonPopulationByMostSevereViolation: {
    title: "Admissions from supervision to prison by most severe violation",
    chartXAxisTitle: "Most severe violation prior to admission to prison",
  },
  libertyToPrisonPopulationOverTime: {
    title: "Admissions from liberty to prison over time",
  },
  libertyToPrisonPopulationByDistrict: {
    title: "Admissions from liberty to prison by district",
  },
  libertyToPrisonPopulationByPriorLengthOfIncarceration: {
    title: "Admissions from liberty to prison by prior length of incarceration",
    chartXAxisTitle: "Prior length of incarceration, in years",
  },
  libertyToPrisonPopulationByGender: {
    title: "Admissions from liberty to prison by gender",
  },
  libertyToPrisonPopulationByAgeGroup: {
    title: "Admissions from liberty to prison by age",
  },
  libertyToPrisonPopulationByRace: {
    title: "Admissions from liberty to prison by race",
  },
  prisonToSupervisionPopulationOverTime: {
    title: "Releases from prison to supervision over time",
  },
  prisonToSupervisionPopulationByAge: {
    title: "Releases from prison to supervision by age",
  },
  prisonToSupervisionPopulationByFacility: {
    title: "Releases from prison to supervision by facility",
  },
  prisonToSupervisionPopulationPersonLevel: {
    title: "List of releases from prison to supervision",
  },
  supervisionPopulationOverTime: {
    title: "Supervision population over time",
  },
  supervisionPopulationByDistrict: {
    title: "Supervision population by district",
  },
  supervisionPopulationBySupervisionLevel: {
    title: "Supervision population by supervision level",
  },
  supervisionToPrisonPopulationBySupervisionLevel: {
    title: "Admissions from supervision to prison by supervision level",
  },
  supervisionToPrisonPopulationByGender: {
    title: "Admissions from supervision to prison by gender",
  },
  supervisionToPrisonPopulationByRace: {
    title: "Admissions from supervision to prison by race",
  },
  supervisionToLibertyPopulationByLengthOfStay: {
    title: "Time served at release from supervision",
    chartXAxisTitle: "Time since starting supervision, in months",
  },
  supervisionToLibertyPopulationByLocation: {
    title: "Releases from supervision by district",
    methodology:
      'The chart describes the number of people released from supervision to liberty from each district as of the date specified in the chart title. When "Counts" is selected, the number of people in each district is shown. When "Rates" is selected, the percentage shows the number of people in each district divided by the total number of people released to liberty.',
  },
  supervisionToLibertyPopulationByGender: {
    title: "Releases from supervision by gender",
    methodology:
      'The chart describes the number of people released from supervision to liberty from each gender as of the date specified in the chart title. When "Counts" is selected, the number of people in each gender is shown. When "Rates" is selected, the percentage shows the number of people in each gender divided by the total number of people released to liberty.',
  },
  supervisionToLibertyPopulationByAgeGroup: {
    title: "Releases from supervision by age",
    methodology:
      'The chart describes the number of people released from supervision to liberty from each age group as of the date specified in the chart title. When "Counts" is selected, the number of people in each age group is shown. When "Rates" is selected, the percentage shows the number of people in each age group divided by the total number of people released to liberty.',
  },
  supervisionToLibertyPopulationByRace: {
    title: "Releases from supervision by race",
    methodology:
      'The chart describes the number of people released from supervision to liberty from each race as of the date specified in the chart title. When "Counts" is selected, the number of people in each race is shown. When "Rates" is selected, the percentage shows the number of people in each race divided by the total number of people released to liberty.',
  },
};

export default content;
