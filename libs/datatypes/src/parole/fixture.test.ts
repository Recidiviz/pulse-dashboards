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

import { paroleCasesFixtureByState } from "./fixture";
import {
  PAROLE_RISK_TOOL,
  ParoleRiskAssessment,
  ParoleRiskTool,
} from "./schema";

describe("Anderson's (DOC-45821) risk assessment history", () => {
  const { riskAssessments } = paroleCasesFixtureByState.US_CO["DOC-45821"];

  const latestByTool = (tool: ParoleRiskTool): ParoleRiskAssessment =>
    riskAssessments
      .filter((a) => a.tool === tool)
      .reduce((latest, a) => (a.date > latest.date ? a : latest));

  // The trajectory chart and the "current" per-tool detail (subcategory/
  // CARAS-factor breakdown) are both derived from `riskAssessments` by
  // picking each tool's most recent entry (see
  // RiskAssessmentSection.utils.ts) -- so the entry carrying that detail
  // must actually be the chronologically latest one for its tool, or the
  // detail view would silently show the wrong assessment.
  it.each(PAROLE_RISK_TOOL.options)(
    "gives %s's chronologically latest entry the detailed breakdown",
    (tool) => {
      const latest = latestByTool(tool);
      const hasDetail =
        tool === "CARAS"
          ? latest.carasFactors !== undefined
          : latest.subcategories !== undefined;
      expect(hasDetail).toBe(true);
    },
  );

  it.each(["LSI", "PIT"] as const)(
    "keeps %s's most recent assessment over 12 months old, to demonstrate a stale assessment",
    (tool) => {
      const daysAgo = (dateString: string) =>
        (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24);

      expect(daysAgo(latestByTool(tool).date)).toBeGreaterThan(365);
    },
  );
});
