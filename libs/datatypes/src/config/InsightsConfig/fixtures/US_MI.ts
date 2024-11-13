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

const US_MI: RawInsightsConfig = {
  atOrAboveRateLabel: "At or above statewide rate",
  atOrBelowRateLabel: "At or below statewide rate",
  caseloadCategories: [],
  clientEvents: [
    { displayName: "Violations", name: "violations" },
    { displayName: "Sanctions", name: "violation_responses" },
  ],
  docLabel: "DOC",
  exclusionReasonDescription:
    "We've excluded agents from this list with particularly large or small average daily caseloads (larger than 150 or smaller than 10). We also excluded agents who didn’t have a caseload of at least 10 clients for at least 75% of the observation period.",
  learnMoreUrl:
    "https://drive.google.com/file/d/1bbjsV6jBr4bkOwTJa8LIfK7oYYxAqa2t/view",
  metrics: [
    {
      bodyDisplayName: "incarceration rate",
      descriptionMarkdown:
        "All transitions to incarceration (state prison or county jail) from supervision in the given time period, regardless of whether the final decision was a revocation or sanction admission. This also includes transitions from Probation to the Special Alternative for Incarceration (SAI) and transitions from supervision to incarceration due to any “New Commitment” movement reasons from OMNI.\n\n<br />\nDenominator is the average daily caseload for the agent over the given time period, including people on both active and admin supervision levels.",
      eventName: "all incarcerations",
      eventNamePastTense: "were incarcerated",
      eventNameSingular: "incarceration",
      name: "incarceration_starts_and_inferred",
      outcomeType: "ADVERSE",
      titleDisplayName: "Incarceration Rate",
      topXPct: null,
      listTableText:
        "Clients will appear on this list multiple times if they have been incarcerated more than once under this agent in the time period.",
    },
    {
      bodyDisplayName: "absconder warrant rate",
      descriptionMarkdown:
        "All reported absconder warrants from supervision in the given time period as captured by the following supervision levels in OMNI and COMS: Probation Absconder Warrant Status,  Parole Absconder Warrant Status, Absconder Warrant Status. Additionally, we use the following movement reasons from OMNI: Absconder from Parole, Absconder from Probation, and the COMS modifier Absconded.\n\n<br />\nDenominator is the average daily caseload for the agent over the given time period, including people on both active and admin supervision levels.",
      eventName: "absconder warrants",
      eventNamePastTense: "had an absconder warrant",
      eventNameSingular: "absconder warrant",
      name: "absconsions_bench_warrants",
      outcomeType: "ADVERSE",
      titleDisplayName: "Absconder Warrant Rate",
      topXPct: null,
      listTableText:
        "Clients will appear on this list multiple times if they have had more than one absconder warrant under this agent in the time period.",
    },
    {
      bodyDisplayName: "technical incarceration rate",
      descriptionMarkdown:
        "We consider the movement reason from OMNI to identify whether a Technical or New Crime violation was the reason for returning to prison of all transitions to incarceration from supervision, regardless of whether the final decision was a revocation or sanction admission.\n\n<br />\nThere are instances where we observe New Crime violation movement reasons entered after the Technical violation. This appears to be rare and in these cases, the incarceration start would be classified as a Technical violation. \nFor incarceration transitions where we don’t find this information in the movement reasons, we determine whether the most serious violation type among all violations occurring between 14 days after and 24 months before was a technical violation. \n\n<br />\nDenominator is the average daily caseload for the agent over the given time period, including people on both active and admin supervision levels.",
      eventName: "technical incarcerations",
      eventNamePastTense: "had a technical incarceration",
      eventNameSingular: "technical incarceration",
      name: "incarceration_starts_and_inferred_technical_violation",
      outcomeType: "ADVERSE",
      titleDisplayName: "Technical Incarceration Rate (TPVs)",
      topXPct: null,
      listTableText: null,
    },
  ],
  noneAreOutliersLabel: "are outliers on any metrics",
  officerHasNoEligibleClientsLabel: "Officer has no eligible clients",
  officerHasNoOutlierMetricsLabel: "Officer has no outlier metrics",
  outliersHover:
    "Has a rate on any metric significantly higher than peers - over 1 Interquartile Range above the statewide rate.",
  slightlyWorseThanRateLabel: "Slightly higher than statewide rate",
  supervisionDistrictLabel: "region",
  supervisionDistrictManagerLabel: "region manager",
  supervisionJiiLabel: "client",
  supervisionOfficerLabel: "agent",
  supervisionSupervisorLabel: "supervisor",
  supervisionUnitLabel: "unit",
  supervisorHasNoOfficersWithEligibleClientsLabel:
    "Supervisor has no officers with eligible clients",
  supervisorHasNoOutlierOfficersLabel: "Supervisor has no outlier officers",
  worseThanRateLabel: "Far higher than statewide rate",
  actionStrategyCopy: rawActionStrategyCopyFixture,
};

export default US_MI;
