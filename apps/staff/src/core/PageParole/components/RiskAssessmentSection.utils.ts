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

import { differenceInMonths } from "date-fns";

import { ParoleRiskAssessment, ParoleRiskTool } from "~datatypes";

import { PaletteKey } from "../../BadgePill/BadgePill";
import { parseIsoDate, toSafeDate } from "./shared";

/**
 * Returns each tool's chronologically latest assessment. `riskAssessments`
 * holds every historical assessment per tool, not just the current one --
 * this is what the legend, detail header, and subcategory breakdown treat as
 * "the" assessment for that tool.
 */
export function latestAssessmentsByTool(
  riskAssessments: Array<ParoleRiskAssessment>,
): Array<ParoleRiskAssessment> {
  const latestByTool = new Map<ParoleRiskTool, ParoleRiskAssessment>();
  for (const assessment of riskAssessments) {
    const current = latestByTool.get(assessment.tool);
    if (!current || assessment.date > current.date) {
      latestByTool.set(assessment.tool, assessment);
    }
  }
  return Array.from(latestByTool.values());
}

/**
 * Groups the full assessment history by tool, each sorted oldest-to-newest,
 * so the trajectory chart can plot one line per tool directly from
 * `riskAssessments` -- no separate chart-shaped field needed.
 */
export function groupAssessmentsByTool(
  riskAssessments: Array<ParoleRiskAssessment>,
): Map<ParoleRiskTool, Array<ParoleRiskAssessment>> {
  const byTool = new Map<ParoleRiskTool, Array<ParoleRiskAssessment>>();
  for (const assessment of riskAssessments) {
    const forTool = byTool.get(assessment.tool) ?? [];
    forTool.push(assessment);
    byTool.set(assessment.tool, forTool);
  }
  for (const forTool of byTool.values()) {
    forTool.sort((a, b) => a.date.localeCompare(b.date));
  }
  return byTool;
}

export type RiskLevel = {
  label: string;
  palette: PaletteKey;
};

// For a level with no entry below, such as US_CO's "Unassigned" -- a color
// implying a severity would be worse than none.
const NEUTRAL_RISK_PALETTE: PaletteKey = "SLATE_DARK";

/**
 * Badge color per risk level. Keyed on the level with spaces, underscores and
 * casing stripped, since each source spells the same level its own way --
 * US_ID sends VERY_HIGH, US_CO's CARAS sends "VERY HIGH", its other tools
 * send "Very High".
 */
const RISK_LEVEL_PALETTES: Record<string, PaletteKey> = {
  VERYLOW: "GREEN",
  MINIMUM: "GREEN",
  LOW: "GREEN",
  MEDIUM: "ORANGE",
  MODERATE: "ORANGE",
  HIGH: "RED",
  VERYHIGH: "RED",
  MAXIMUM: "RED",
};

/**
 * The assessed risk level as the source system recorded it, or undefined
 * where it recorded none. The label is the source's own wording, only tidied
 * of underscores; we derive nothing but the color.
 *
 * @param assessment - The assessment to read the level from.
 */
export function getRiskLevelForAssessment(
  assessment: ParoleRiskAssessment,
): RiskLevel | undefined {
  const { level } = assessment;
  if (!level) return undefined;

  const key = level.replaceAll(/[\s_]/g, "").toUpperCase();
  return {
    label: level.replaceAll("_", " "),
    palette: RISK_LEVEL_PALETTES[key] ?? NEUTRAL_RISK_PALETTE,
  };
}

export function isAssessmentStale(dateString: string): boolean {
  const assessmentDate = parseIsoDate(dateString);
  return differenceInMonths(new Date(), assessmentDate) > 12;
}

export const formatDateShort = (date: string | number | Date) =>
  toSafeDate(date).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
