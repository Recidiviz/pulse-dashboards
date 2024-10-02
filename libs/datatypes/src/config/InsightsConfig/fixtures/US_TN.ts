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

import { RawInsightsConfig } from "../schema";

export const US_TN: RawInsightsConfig = {
  atOrAboveRateLabel: "At or above statewide rate",
  atOrBelowRateLabel: "At or below statewide rate",
  caseloadCategories: [],
  clientEvents: [
    { displayName: "Violations", name: "violations" },
    { displayName: "Sanctions", name: "violation_responses" },
  ],
  docLabel: "DOC",
  exclusionReasonDescription:
    "We've excluded officers from this list with particularly large or small average daily caseloads (larger than 175 or smaller than 10). We also excluded officers who didn’t have a caseload of at least 10 clients for at least 75% of the observation period.",
  learnMoreUrl:
    "https://drive.google.com/file/d/1WCNEeftLeTf-c7bcKXKYteg5HykrRba1/view",
  metrics: [
    {
      bodyDisplayName: "incarceration rate",
      descriptionMarkdown:
        "The numerator is transitions to incarceration from supervision in the given time period (12 months), regardless of whether the final decision was a revocation or sanction admission. Any returns to incarceration for weekend confinement are excluded.  This includes supervision plan updates to IN CUSTODY or DETAINER status. Returns to incarceration entered as SPLIT confinement are also included - some of these will be results of pre-determined sentencing decisions rather than the result of supervision violations.\n\n<br />\nDenominator is the average daily caseload for the officer over the given time period, including people on both active and admin supervision levels.",
      eventName: "all incarcerations",
      eventNamePastTense: "were incarcerated",
      eventNameSingular: "incarceration",
      name: "incarceration_starts",
      outcomeType: "ADVERSE",
      titleDisplayName: "Incarceration Rate",
      topXPct: null,
      listTableText: null,
    },
    {
      bodyDisplayName: "absconsion rate",
      descriptionMarkdown:
        'All reported absconsions, as captured in the data we receive by supervision levels "9AB", "ZAB", "ZAC", "ZAP" or supervision type "ABS" for absconsions, in a given time period.\n\n<br />\nDenominator is the average daily caseload for the officer over the given time period, including people on both active and admin supervision levels.',
      eventName: "absconsions",
      eventNamePastTense: "absconded",
      eventNameSingular: "absconsion",
      name: "absconsions_bench_warrants",
      outcomeType: "ADVERSE",
      titleDisplayName: "Absconsion Rate",
      topXPct: null,
      listTableText: null,
    },
    {
      bodyDisplayName: "technical incarceration rate",
      descriptionMarkdown:
        "Transitions to incarceration from supervision due to technical violations, regardless of whether the final decision was a revocation or sanction admission. It is considered a technical incarceration only if the most serious violation type across all violations in the prior 24 months was a technical violation. We use this logic even if someone’s return to prison is labeled a “new admission”, as long as they were previously on supervision. For incarceration transitions where we don’t find any associated violations, we infer violations and their type by looking at admission reasons implying a Technical or New Crime reason for returning to prison.\n\nThere are situations where we are unable to find a violation to match an incarceration we see in the data. For example, if there are no violations entered because of data entry reasons or because someone was previously in a CCC who did not use TOMIS, we will either not know the cause of the reincarceration or be associating the incarceration with an erroneous violation type.\n\n<br />\nDenominator is the average daily caseload for the officer over the given time period, including people on both active and admin supervision levels.",
      eventName: "technical incarcerations",
      eventNamePastTense: "had a technical incarceration",
      eventNameSingular: "technical incarceration",
      name: "incarceration_starts_technical_violation",
      outcomeType: "ADVERSE",
      titleDisplayName: "Technical Incarceration Rate",
      topXPct: null,
      listTableText: null,
    },
  ],
  noneAreOutliersLabel: "are outliers",
  officerHasNoEligibleClientsLabel: "Officer has no eligible clients",
  officerHasNoOutlierMetricsLabel: "Officer has no outlier metrics",
  outliersHover:
    "Has a rate on any metric significantly higher than peers - over 1 Interquartile Range above the statewide rate.",
  slightlyWorseThanRateLabel: "Slightly higher than statewide rate",
  supervisionDistrictLabel: "district",
  supervisionDistrictManagerLabel: "district director",
  supervisionJiiLabel: "client",
  supervisionOfficerLabel: "officer",
  supervisionSupervisorLabel: "manager",
  supervisionUnitLabel: "unit",
  supervisorHasNoOfficersWithEligibleClientsLabel:
    "Supervisor has no officers with eligible clients",
  supervisorHasNoOutlierOfficersLabel: "Supervisor has no outlier officers",
  worseThanRateLabel: "Much higher than statewide rate",
};

export default US_TN;
