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

import { rawActionStrategyCopyFixture } from "../../ActionStrategyCopy/fixture";
import { RawInsightsConfig } from "../schema";

const US_CA: RawInsightsConfig = {
  atOrAboveRateLabel: "At or above statewide rate",
  atOrBelowRateLabel: "At or above statewide rate",
  caseloadCategories: [],
  clientEvents: [],
  docLabel: "CDCR",
  exclusionReasonDescription:
    "We've excluded agents from this list with particularly large or small average caseloads (larger than 175 or smaller than 10). We also excluded agents who didn’t have a caseload of at least 10 clients for at least 75% of the observation period. ",
  learnMoreUrl:
    "https://drive.google.com/file/d/1QgvOj8FCMYu3gMSNazlNr_7_OZmuQ3Jc/view?usp=sharing",
  metrics: [
    {
      bodyDisplayName: "absconding rate",
      descriptionMarkdown:
        "All reported abscondings, as captured in the data we receive for all supervision levels except for CATEGORY D, DEPORTED and PENDING DEPORT, in a given time period.\n<br />\nDenominator is the average daily caseload for the agent over the given time period, including people on both active and admin supervision levels.",
      eventName: "abscondings",
      eventNamePastTense: "absconded",
      eventNameSingular: "absconding",
      name: "absconsions_bench_warrants",
      outcomeType: "ADVERSE",
      titleDisplayName: "Absconding Rate",
      topXPct: null,
      listTableText: null,
    },
    {
      bodyDisplayName: "program start rate",
      descriptionMarkdown:
        "All reported program starts that exist in PVDTS, as captured in the data we receive for all supervision levels except for CATEGORY D, DEPORTED and PENDING DEPORT, in a given time period.\n<br />\nDenominator is the average daily caseload for the agent over the given time period, including people on both active and admin supervision levels.",
      eventName: "program starts",
      eventNamePastTense: "had a program start",
      eventNameSingular: "program start",
      name: "treatment_starts",
      outcomeType: "FAVORABLE",
      titleDisplayName: "Program Start Rate",
      topXPct: 10,
      listTableText: null,
    },
  ],
  noneAreOutliersLabel: "are outliers on any metrics",
  officerHasNoEligibleClientsLabel: "Officer has no eligible clients",
  officerHasNoOutlierMetricsLabel: "Officer has no outlier metrics",
  outliersHover:
    "Has a rate on any metric significantly higher or lower than peers - over 1 Interquartile Range above or below the statewide rate.",
  slightlyWorseThanRateLabel: "Slightly worse than statewide rate",
  supervisionDistrictLabel: "district",
  supervisionDistrictManagerLabel: "deputy regional administrator",
  supervisionJiiLabel: "client",
  supervisionOfficerLabel: "agent",
  supervisionSupervisorLabel: "supervisor",
  supervisionUnitLabel: "unit",
  supervisorHasNoOfficersWithEligibleClientsLabel:
    "Supervisor has no officers with eligible clients",
  supervisorHasNoOutlierOfficersLabel: "Supervisor has no outlier officers",
  worseThanRateLabel: "Far worse than statewide rate",
  actionStrategyCopy: rawActionStrategyCopyFixture,
};

export default US_CA;
