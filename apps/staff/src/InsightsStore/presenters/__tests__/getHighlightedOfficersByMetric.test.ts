// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import {
  MetricConfig,
  SupervisionOfficer,
  SupervisionOfficerOutcomes,
} from "~datatypes";

import { getHighlightedOfficersByMetric } from "../utils";

const favorableConfig: MetricConfig = {
  name: "task_completions_early_discharge",
  outcomeType: "FAVORABLE",
  titleDisplayName: "Early Discharge Rate",
  bodyDisplayName: "early discharge rate",
  eventName: "early discharges",
  eventNameSingular: "early discharge",
  eventNamePastTense: "had an early discharge",
  descriptionMarkdown: "desc",
  topXPct: 10,
};

const adverseConfig: MetricConfig = {
  name: "absconsions_bench_warrants",
  outcomeType: "ADVERSE",
  titleDisplayName: "Absconder Warrant Rate",
  bodyDisplayName: "absconder warrant rate",
  eventName: "absconder warrants",
  eventNameSingular: "absconder warrant",
  eventNamePastTense: "had an absconder warrant",
  descriptionMarkdown: "desc",
  topXPct: 10,
};

const officers = [
  {
    pseudonymizedId: "hashed-favorable-officer",
    displayName: "Fav Officer",
  },
  {
    pseudonymizedId: "hashed-adverse-officer",
    displayName: "Adv Officer",
  },
] as unknown as SupervisionOfficer[];

const officerOutcomes = [
  {
    pseudonymizedId: "hashed-favorable-officer",
    topXPctMetrics: [
      { metricId: "task_completions_early_discharge", topXPct: 10 },
    ],
  },
  {
    pseudonymizedId: "hashed-adverse-officer",
    topXPctMetrics: [{ metricId: "absconsions_bench_warrants", topXPct: 10 }],
  },
] as unknown as SupervisionOfficerOutcomes[];

describe("getHighlightedOfficersByMetric", () => {
  it("propagates outcomeType onto each HighlightedOfficersDetail", () => {
    const metricConfigs = new Map<string, MetricConfig>([
      [favorableConfig.name, favorableConfig],
      [adverseConfig.name, adverseConfig],
    ]);

    const result = getHighlightedOfficersByMetric(
      metricConfigs,
      officers,
      officerOutcomes,
    );

    expect(result).toHaveLength(2);
    const byMetric = Object.fromEntries(result.map((r) => [r.metricName, r]));
    expect(byMetric["early discharges"].outcomeType).toBe("FAVORABLE");
    expect(byMetric["absconder warrants"].outcomeType).toBe("ADVERSE");
  });

  it("skips metrics without a topXPct value", () => {
    const noPctConfig: MetricConfig = { ...favorableConfig, topXPct: null };
    const result = getHighlightedOfficersByMetric(
      new Map([[noPctConfig.name, noPctConfig]]),
      officers,
      officerOutcomes,
    );
    expect(result).toEqual([]);
  });
});
