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

const US_PA: RawInsightsConfig = {
  atOrAboveRateLabel: "At or above statewide rate",
  atOrBelowRateLabel: "At or below statewide rate",
  caseloadCategories: [],
  clientEvents: [],
  docLabel: "DOC",
  exclusionReasonDescription: "--",
  learnMoreUrl:
    "https://drive.google.com/file/d/1NvTuKhN-N1-ba1KMI562_z9ka932JqXQ/view",
  metrics: [
    {
      bodyDisplayName: "incarceration rate",
      descriptionMarkdown: "",
      eventName: "incarcerations",
      eventNamePastTense: "were incarcerated",
      eventNameSingular: "incarceration",
      name: "incarceration_starts_and_inferred",
      outcomeType: "ADVERSE",
      titleDisplayName: "Incarceration Rate (CPVs & TPVs)",
      topXPct: null,
    },
    {
      bodyDisplayName: "technical incarceration rate",
      descriptionMarkdown: "",
      eventName: "technical incarcerations",
      eventNamePastTense: "had a technical incarceration",
      eventNameSingular: "technical incarceration",
      name: "incarceration_starts_and_inferred_technical_violation",
      outcomeType: "ADVERSE",
      titleDisplayName: "Technical Incarceration Rate (TPVs)",
      topXPct: null,
    },
    {
      bodyDisplayName: "absconsion rate",
      descriptionMarkdown: "",
      eventName: "absconsions",
      eventNamePastTense: "absconded",
      eventNameSingular: "absconsion",
      name: "absconsions_bench_warrants",
      outcomeType: "ADVERSE",
      titleDisplayName: "Absconsion Rate",
      topXPct: null,
    },
  ],
  noneAreOutliersLabel: "are outliers",
  officerHasNoEligibleClientsLabel: "Officer has no eligible clients",
  officerHasNoOutlierMetricsLabel: "Officer has no outlier metrics",
  outliersHover:
    "Has a rate on any metric significantly higher than peers - over 1 Interquartile Range above the statewide rate.",
  slightlyWorseThanRateLabel: "Slightly worse than statewide rate",
  supervisionDistrictLabel: "district",
  supervisionDistrictManagerLabel: "district director",
  supervisionJiiLabel: "client",
  supervisionOfficerLabel: "agent",
  supervisionSupervisorLabel: "supervisor",
  supervisionUnitLabel: "unit",
  supervisorHasNoOfficersWithEligibleClientsLabel:
    "Supervisor has no officers with eligible clients",
  supervisorHasNoOutlierOfficersLabel: "Supervisor has no outlier officers",
  worseThanRateLabel: "Far worse than statewide rate",
};

export default US_PA;
