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

import { StateSpecificMetricCopy } from "../types";

const content: StateSpecificMetricCopy = {
  prisonPopulationOverTime: {
    note:
      "CPPs are included in the incarceration population. In this over-time chart, counts represent events from the first day of each month. This is different from the other charts on the page, which reflect counts as of the date specified in the chart title.",
  },
  prisonPopulationPersonLevel: {
    title: "List of people incarcerated",
    note: "CPPs are included in the incarceration population.",
  },
  prisonFacilityPopulation: {
    title: "Incarceration population by facility",
    note: "CPPs are included in the incarceration population.",
    methodology:
      'This chart describes the total number of people incarcerated in each ND DOCR facility or serving their prison sentence in the community through the Community Placement Program as specified by the date in the title. It does not include individuals incarcerated in county jails  unless the individual is temporarily transferred to a county jail while already incarcerated. When "Counts" is selected, the number of people in each facility is shown. When "Rates" is selected, the percentage shows the number of people in each facility divided by the total number of people incarcerated.',
  },
  supervisionToPrisonPopulationByLengthOfStay: {
    title: "Time to admission from supervision to incarceration",
    methodology:
      "This chart shows the proportion of people admitted from supervision to incarceration a certain time period after starting supervision, out of all the people who were admitted during the selected time period.",
    chartXAxisTitle: "Time since supervision start",
    chartYAxisTitle: "Proportion of admissions that have occurred",
  },
  supervisionToPrisonPopulationByNumberOfViolations: {
    title:
      "Admissions from supervision to incarceration by number of violations",
    chartXAxisTitle: "Number of previous violations",
  },
  supervisionToPrisonPopulationByMostSevereViolation: {
    title:
      "Admissions from supervision to incarceration by most severe violation",
    chartXAxisTitle: "Most severe violation prior to incarceration",
  },
  libertyToPrisonPopulationOverTime: {
    title: "Admissions from liberty to incarceration over time",
    note:
      "In this over-time chart, counts represent events from the first day of each month. This is different from the other charts on the page, which reflect counts as of the date specified in the chart title.",
    methodology:
      "This chart describes the total number of events where individuals were admitted to incarceration from a new court commitment each month. Admissions are counted on the day when the person was admitted to incarceration status, not when the arrest or charge occurred. This chart is event-based, so if a single person has 2 new court commitments during the selected time period, 2 events are counted in this chart.",
  },
  libertyToPrisonPopulationByDistrict: {
    title: "Admissions from liberty to incarceration by district",
    methodology:
      'The chart describes the number of people admitted to incarceration from a new court commitment from each judicial district as of the date specified in the chart title. When "Counts" is selected, the number of people admitted in each judicial district is shown. When "Rates" is selected, the percentage shows the number of people admitted in each judicial district divided by the total number of people admitted to incarceration.',
  },
  libertyToPrisonPopulationByPriorLengthOfIncarceration: {
    title:
      "Admissions from liberty to incarceration by prior length of incarceration",
    methodology:
      'The chart describes the number of people admitted to incarceration from a new court commitment during the selected time period, broken down the by the length of their most recent incarceration in years. For example, people who have never been incarcerated will fall in the "0" bucket, people who were recently incarcerated for up to 1 year will fall in the 1 bucket.',
  },
  libertyToPrisonPopulationByGender: {
    title: "Admissions from liberty to incarceration by gender",
    methodology:
      'The chart describes the number of people admitted to incarceration from a new court commitment from each gender as of the date specified in the chart title. When "Counts" is selected, the number of people in each gender is shown. When "Rates" is selected, the percentage shows the number of people in each gender divided by the total number of people admitted to incarceration.',
  },
  libertyToPrisonPopulationByAgeGroup: {
    title: "Admissions from liberty to incarceration by age",
    methodology:
      'The chart describes the number of people admitted to incarceration from a new court commitment from each age group as of the date specified in the chart title. When "Counts" is selected, the number of people in each age group is shown. When "Rates" is selected, the percentage shows the number of people in each age group divided by the total number of people admitted to incarceration.',
  },
  libertyToPrisonPopulationByRace: {
    title: "Admissions from liberty to incarceration by race",
    methodology:
      'The chart describes the number of people admitted to incarceration from a new court commitment from each race as of the date specified in the chart title. When "Counts" is selected, the number of people in each race is shown. When "Rates" is selected, the percentage shows the number of people in each race divided by the total number of people admitted to incarceration.',
  },
  prisonToSupervisionPopulationOverTime: {
    title: "Releases from incarceration to supervision over time",
    note:
      "In this over-time chart, counts represent events from the first day of each month. This is different from the other charts on the page, which reflect counts as of the date specified in the chart title.",
    methodology:
      "This chart describes the total number of events where individuals were released from incarceration to supervision each month. Releases are counted on the day when the person was released to supervision. This chart is event-based, so if a single person is released twice during the selected time period, 2 events are counted in this chart.",
  },
  prisonToSupervisionPopulationByAge: {
    title: "Releases from incarceration to supervision by age",
    methodology:
      'The chart describes the number of people released from incarceration to supervision from each age group as of the date specified in the chart title. When "Counts" is selected, the number of people in each age group is shown. When "Rates" is selected, the percentage shows the number of people in each age group divided by the total number of people released to supervision.',
  },
  prisonToSupervisionPopulationByFacility: {
    title: "Releases from incarceration to supervision by facility",
    methodology:
      'The chart describes the number of people released from incarceration to supervision from each facility as of the date specified in the chart title. When "Counts" is selected, the number of people released from each facility is shown. When "Rates" is selected, the percentage shows the number of people released from each facility divided by the total number of people released to supervision.',
  },
  prisonToSupervisionPopulationPersonLevel: {
    title: "List of releases from incarceration to supervision",
    methodology:
      "The table includes a row for each event where a person was released from incarceration to supervision as of the date specified in the chart title. ",
  },
  supervisionPopulationOverTime: {
    note:
      "Interstate compact cases are included in the parole population. In this over-time chart, counts represent events from the first day of each month. This is different from the other charts on the page, which reflect counts as of the date specified in the chart title.",
    methodology:
      'The chart describes the historical supervision population over the selected "Time Period". Each data point represents the total population for the selected group on the first day of that month. For example, hovering over the "November 2020" data point on the chart will show the total number of people described in the section above on November 1, 2020. People under interstate compact are included in the supervision population. Note: Supervision level data is not available prior to August 2019, so filtering by supervision level on the 5-year time period may make the counts on this chart appear lower than they actually are prior to Aug 2019.',
  },
  supervisionPopulationByDistrict: {
    note: "Interstate compact cases are included in the parole population.",
    methodology:
      "The chart describes the number of people on supervision in each district as of the date specified in the chart title. People under interstate compact are included in the supervision population.",
  },
  supervisionPopulationBySupervisionLevel: {
    note: "Interstate compact cases are included in the parole population.",
    methodology:
      "The chart describes the number of people on supervision in each district as of the date specified in the chart title. Interstate compact cases are included in the parole population.",
  },
  supervisionToPrisonPopulationBySupervisionLevel: {
    title: "Admissions from supervision to incarceration by supervision level",
    methodology:
      'The chart describes the number of people admitted from supervision to incarceration from each supervision level as of the date specified in the chart title. When "Counts" is selected, the number of people in each supervision level is shown. When "Rates" is selected, the percentage shows the number of people in each supervision level divided by the total number of people admitted to incarceration.',
  },
  supervisionToPrisonPopulationByGender: {
    title: "Admissions from supervision to incarceration by gender",
    methodology:
      'The chart describes the number of people admitted from supervision to incarceration from each gender as of the date specified in the chart title. When "Counts" is selected, the number of people in each gender is shown. When "Rates" is selected, the percentage shows the number of people in each gender divided by the total number of people admitted to incarceration.',
  },
  supervisionToPrisonPopulationByRace: {
    title: "Admissions from supervision to incarceration by race",
    methodology:
      'The chart describes the number of people admitted from supervision to incarceration from each race as of the date specified in the chart title. When "Counts" is selected, the number of people in each race is shown. When "Rates" is selected, the percentage shows the number of people in each race divided by the total number of people admitted to incarceration.',
  },
};

export default content;
