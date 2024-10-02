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

export const US_ND: RawInsightsConfig = {
  atOrAboveRateLabel: "At or above statewide rate",
  atOrBelowRateLabel: "At or below statewide rate",
  caseloadCategories: [],
  clientEvents: [
    { displayName: "Violations", name: "violations" },
    { displayName: "Sanctions", name: "violation_responses" },
  ],
  docLabel: "DOCR",
  exclusionReasonDescription: "TODO EXCLUSION REASON",
  learnMoreUrl: "https://recidiviz.org/",
  metrics: [
    {
      bodyDisplayName: "incarceration rate",
      descriptionMarkdown:
        "All transitions to incarceration (state prison or county jail) from supervision in the given time period, regardless of whether the final decision was a revocation or sanction admission.\n\n<br />\nDenominator is the average daily caseload for the agent over the given time period.",
      eventName: "all incarcerations",
      eventNamePastTense: "were incarcerated",
      eventNameSingular: "incarceration",
      name: "incarceration_starts_and_inferred",
      outcomeType: "ADVERSE",
      titleDisplayName: "Incarceration Rate",
      topXPct: null,
      listTableText: null,
    },
    {
      bodyDisplayName: "absconder rate",
      descriptionMarkdown:
        "All reported absconsions from supervision in the given time period.\n\n<br />\nDenominator is the average daily caseload for the agent over the given time period.",
      eventName: "absconsions",
      eventNamePastTense: "absconded",
      eventNameSingular: "absconsion",

      name: "absconsions_bench_warrants",
      outcomeType: "ADVERSE",
      titleDisplayName: "Absconder Rate",
      topXPct: null,
      listTableText: null,
    },
    {
      bodyDisplayName: "technical incarceration rate",
      descriptionMarkdown:
        "Transitions to incarceration from supervision due to technical violations, regardless of whether the final decision was a revocation or sanction admission. It is considered a technical incarceration only if the most serious violation type across all violations in the prior 90 days was a technical violation.\n<br />\nDenominator is the average daily caseload for the agent over the given time period",
      eventName: "technical incarcerations",
      eventNamePastTense: "had a technical incarceration",
      eventNameSingular: "technical incarceration",
      name: "incarceration_starts_and_inferred_technical_violation",
      outcomeType: "ADVERSE",
      titleDisplayName: "Technical Incarceration Rate",
      topXPct: null,
      listTableText: null,
    },
  ],
  noneAreOutliersLabel: "are outliers",
  officerHasNoEligibleClientsLabel: "No outstanding opportunities for now.",
  officerHasNoOutlierMetricsLabel:
    "Great news! No outlying metrics this month.",
  outliersHover: "TODO HOVER TOOLTIP",
  slightlyWorseThanRateLabel: "Slightly worse than statewide rate",
  supervisionDistrictLabel: "region",
  supervisionDistrictManagerLabel: "program manager",
  supervisionJiiLabel: "client",
  supervisionOfficerLabel: "officer",
  supervisionSupervisorLabel: "lead officer",
  supervisionUnitLabel: "office",
  supervisorHasNoOfficersWithEligibleClientsLabel:
    "No outstanding opportunities for now.",
  supervisorHasNoOutlierOfficersLabel:
    "Great news! No officers are outliers on any metrics this month.",
  worseThanRateLabel: "Far above the statewide rate",
};

export default US_ND;
