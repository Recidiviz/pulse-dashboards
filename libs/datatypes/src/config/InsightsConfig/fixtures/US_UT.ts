// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { InsightsConfig } from "../schema";

export const US_UT: InsightsConfig = {
  actionStrategyCopy: {
    ACTION_STRATEGY_60_PERC_OUTLIERS: { prompt: "tbd", body: "tbd" },
    ACTION_STRATEGY_OUTLIER: { prompt: "tbd", body: "tbd" },
    ACTION_STRATEGY_OUTLIER_3_MONTHS: { prompt: "tbd", body: "tbd" },
    ACTION_STRATEGY_OUTLIER_ABSCONSION: { prompt: "tbd", body: "tbd" },
    ACTION_STRATEGY_OUTLIER_NEW_OFFICER: { prompt: "tbd", body: "tbd" },
  },
  atOrAboveRateLabel: "tbd",
  atOrBelowRateLabel: "tbd",
  caseloadCategories: [],
  clientEvents: [],
  exclusionReasonDescription: "tbd",
  learnMoreUrl: "tbd",
  metrics: [
    {
      name: "incarceration_starts",
      outcomeType: "ADVERSE",
      titleDisplayName: "Incarceration Rate",
      bodyDisplayName: "incarceration rate",
      eventName: "incarcerations",
      eventNameSingular: "incarceration",
      eventNamePastTense: "were incarcerated",
      descriptionMarkdown: "",
      topXPct: null,
    },
  ],
  noneAreOutliersLabel: "tbd",
  officerHasNoEligibleClientsLabel:
    "Nice! No outstanding opportunities for now.",
  officerHasNoOutlierMetricsLabel: "tbd",
  outliersHover: "tbd",
  slightlyWorseThanRateLabel: "tbd",
  supervisionDistrictLabel: "region",
  supervisionDistrictManagerLabel: "region manager",
  supervisionJiiLabel: "client",
  supervisionOfficerLabel: "agent",
  supervisionSupervisorLabel: "sergeant",
  supervisionUnitLabel: "unit",
  supervisorHasNoOfficersWithEligibleClientsLabel:
    "Nice! No outstanding opportunities for now.",
  supervisorHasNoOutlierOfficersLabel: "tbd",
  vitalsMetrics: [],
  vitalsMetricsMethodologyUrl: "tbd",
  worseThanRateLabel: "tbd",
};
