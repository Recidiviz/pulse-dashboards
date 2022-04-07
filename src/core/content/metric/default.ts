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
    note:
      "In this over-time chart, counts represent events from the first day of each month. This is different from the other charts on the page, which reflect counts as of the date specified in the chart title.",
    methodology:
      'The chart describes the historical supervision population over the selected "Time Period". Each data point represents the total population for the selected group on the first day of that month. For example, hovering over the "November 2020" data point on the chart will show the total number of people described in the section above on November 1, 2020. ',
  },
  prisonPopulationPersonLevel: {
    title: "List of people incarcerated",
    methodology:
      "The table includes a row for each person incarcerated as of the date specified in the chart title. ",
  },
  prisonFacilityPopulation: {
    title: "Prison population by facility",
    methodology:
      "The chart describes the number of people in each facility as of the date specified in the chart title. ",
  },
  supervisionToPrisonOverTime: {
    title: "Admissions from supervision over time",
    note:
      "In this over-time chart, counts represent events from the first day of each month. This is different from the other charts on the page, which reflect counts as of the date specified in the chart title.",
    methodology:
      "These charts include events where people are admitted from supervision to incarceration. This includes revocations, sanction admissions, and new court commits that occur while an individual is on supervision. Revocations are counted when the person was admitted to incarceration status, not when the violation occurred. All charts on this page are event-based, so if a single person has two revocations during the selected time period, two events are counted on this page.",
  },
  prisonPopulationOverTime: {
    title: "Incarceration population over time",
    note:
      "In this over-time chart, counts represent events from the first day of each month. This is different from the other charts on the page, which reflect counts as of the date specified in the chart title.",
    methodology:
      'The chart describes the historical incarceration population over the selected "Time Period". Each data point represents the total population for the selected group on the first day of that month. For example, hovering over the "November 2020" data point on the chart will show the total number of people described in the section above on November 1, 2020. ',
  },
  supervisionToPrisonPopulationByLengthOfStay: {
    title: "Time to admission from supervision to prison",
    methodology:
      'This chart shows the proportion of people admitted from supervision to prison a certain time period after starting supervision, out of all the people who were admitted during the selected time period. For example, if the selected time period is "6 months" and hovering over 24 months in the chart shows "70%", that means 70% of people who were admitted from supervision to prison during the past six months were admitted in the first 24 months of supervision.',
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
    note:
      "In this over-time chart, counts represent events from the first day of each month. This is different from the other charts on the page, which reflect counts as of the date specified in the chart title.",
    methodology:
      "This chart describes the total number of events where individuals were admitted to prison from a new court commitment each month. Admissions are counted on the day when the person was admitted to prison, not when the arrest or charge occurred. This chart is event-based, so if a single person has 2 new court commitments during the selected time period, 2 events are counted in this chart.",
  },
  libertyToPrisonPopulationByDistrict: {
    title: "Admissions from liberty to prison by judicial district",
    methodology:
      'The chart describes the number of people admitted to prison from a new court commitment from each judicial district as of the date specified in the chart title. When "Counts" is selected, the number of people admitted in each judicial district is shown. When "Rates" is selected, the percentage shows the number of people admitted in each judicial district divided by the total number of people admitted to prison.',
  },
  libertyToPrisonPopulationByPriorLengthOfIncarceration: {
    title: "Admissions from liberty to prison by prior length of incarceration",
    methodology:
      'The chart describes the number of people admitted to prison from a new court commitment during the selected time period, broken down the by the length of their most recent incarceration in years. For example, people who have never been incarcerated will fall in the "0" bucket, people who were recently incarcerated for up to 1 year will fall in the 1 bucket.',
    chartXAxisTitle: "Prior length of incarceration, in years",
  },
  libertyToPrisonPopulationByGender: {
    title: "Admissions from liberty to prison by gender",
    methodology:
      'The chart describes the number of people admitted to prison from a new court commitment from each gender as of the date specified in the chart title. When "Counts" is selected, the number of people in each gender is shown. When "Rates" is selected, the percentage shows the number of people in each gender divided by the total number of people admitted to prison.',
  },
  libertyToPrisonPopulationByAgeGroup: {
    title: "Admissions from liberty to prison by age",
    methodology:
      'The chart describes the number of people admitted to prison from a new court commitment from each age group as of the date specified in the chart title. When "Counts" is selected, the number of people in each age group is shown. When "Rates" is selected, the percentage shows the number of people in each age group divided by the total number of people admitted to prison.',
  },
  libertyToPrisonPopulationByRace: {
    title: "Admissions from liberty to prison by race",
    methodology:
      'The chart describes the number of people admitted to prison from a new court commitment from each race as of the date specified in the chart title. When "Counts" is selected, the number of people in each race is shown. When "Rates" is selected, the percentage shows the number of people in each race divided by the total number of people admitted to prison.',
  },
  prisonToSupervisionPopulationOverTime: {
    title: "Releases from prison to supervision over time",
    note:
      "In this over-time chart, counts represent events from the first day of each month. This is different from the other charts on the page, which reflect counts as of the date specified in the chart title.",
    methodology:
      "This chart describes the total number of events where individuals were released from prison to supervision each month. Releases are counted on the day when the person was released to supervision. This chart is event-based, so if a single person is released twice during the selected time period, 2 events are counted in this chart.",
  },
  prisonToSupervisionPopulationByAge: {
    title: "Releases from prison to supervision by age",
    methodology:
      'The chart describes the number of people released from prison to supervision from each age group as of the date specified in the chart title. When "Counts" is selected, the number of people in each age group is shown. When "Rates" is selected, the percentage shows the number of people in each age group divided by the total number of people released to supervision.',
  },
  prisonToSupervisionPopulationByFacility: {
    title: "Releases from prison to supervision by facility",
    methodology:
      'The chart describes the number of people released from prison to supervision from each facility as of the date specified in the chart title. When "Counts" is selected, the number of people released from each facility is shown. When "Rates" is selected, the percentage shows the number of people released from each facility divided by the total number of people released to supervision.',
  },
  prisonToSupervisionPopulationPersonLevel: {
    title: "List of releases from prison to supervision",
    methodology:
      "The table includes a row for each event where a person was released from prison to supervision as of the date specified in the chart title. ",
  },
  supervisionPopulationOverTime: {
    title: "Supervision population over time",
    note:
      "In this over-time chart, counts represent events from the first day of each month. This is different from the other charts on the page, which reflect counts as of the date specified in the chart title.",
    methodology:
      'The chart describes the historical supervision population over the selected "Time Period". Each data point represents the total population for the selected group on the first day of that month. For example, hovering over the "November 2020" data point on the chart will show the total number of people described in the section above on November 1, 2020.',
  },
  supervisionPopulationByDistrict: {
    title: "Supervision population by district",
    methodology:
      "The chart describes the number of people on supervision in each district as of the date specified in the chart title.",
  },
  supervisionPopulationBySupervisionLevel: {
    title: "Supervision population by supervision level",
    methodology:
      "The chart describes the number of people on supervision at each supervision level as of the date specified in the chart title. ",
  },
  supervisionToPrisonPopulationByOfficer: {
    title: "Admissions from supervision by officer",
    methodology:
      'The chart describes the number of people admitted to prison from each officer\'s caseload as of the date specified in the chart title. The admission is attributed to the officer who was assigned to that person on the day of their admission to a prison. When "Counts" is selected, the number of people in each district is shown. When "Rates" is selected, the percentage shows the number of people in each district divided by the total number of people admitted to prison.',
  },
  supervisionToPrisonPopulationByDistrict: {
    title: "Admissions from supervision by district",
    methodology:
      'The chart describes the number of people admitted to prison from each district as of the date specified in the chart title. When "Counts" is selected, the number of people in each district is shown. When "Rates" is selected, the percentage shows the number of people in each district divided by the total number of people admitted to prison.',
  },
  supervisionToPrisonPopulationBySupervisionLevel: {
    title: "Admissions from supervision to prison by supervision level",
    methodology:
      'The chart describes the number of people admitted to prison from each supervision level as of the date specified in the chart title. When "Counts" is selected, the number of people in each supervision level is shown. When "Rates" is selected, the percentage shows the number of people in each supervision level divided by the total number of people admitted to prison.',
  },
  supervisionToPrisonPopulationByGender: {
    title: "Admissions from supervision to prison by gender",
    methodology:
      'The chart describes the number of people admitted to prison from each gender as of the date specified in the chart title. When "Counts" is selected, the number of people in each gender is shown. When "Rates" is selected, the percentage shows the number of people in each gender divided by the total number of people admitted to prison.',
  },
  supervisionToPrisonPopulationByRace: {
    title: "Admissions from supervision to prison by race",
    methodology:
      'The chart describes the number of people admitted to prison from each race as of the date specified in the chart title. When "Counts" is selected, the number of people in each race is shown. When "Rates" is selected, the percentage shows the number of people in each race divided by the total number of people admitted to prison.',
  },
  supervisionToLibertyPopulationByLengthOfStay: {
    title: "Time served at release from supervision",
    methodology:
      "This chart shows the proportion of people released from supervision to liberty a certain time period after starting supervision, out of all the people who were released during the selected time period.",
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
