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

// `riskAssessments` holds every historical assessment per tool, not just the
// current one -- this picks the one with the most recent `date` for each
// tool, which is what the legend, detail header, and subcategory breakdown
// treat as "the" assessment for that tool.
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

// Groups the full assessment history by tool, each sorted oldest-to-newest,
// so the trajectory chart can plot one line per tool directly from
// `riskAssessments` -- no separate chart-shaped field needed.
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

export function getRiskLevel(pct: number): RiskLevel {
  if (pct >= 60) return { label: "High", palette: "RED" };
  if (pct >= 30) return { label: "Medium", palette: "ORANGE" };
  return { label: "Low", palette: "GREEN" };
}

// CARAS v7's risk level comes from its own published probability bands, not
// the generic 3-tier scale the other tools use (`score` for CARAS is already
// that probability * 100, so this takes the same 0-100 value as `pct`).
export function getCarasRiskLevel(pct: number): RiskLevel {
  const probability = pct / 100;
  if (probability > 0.6162) return { label: "Very High", palette: "RED" };
  if (probability > 0.5139) return { label: "High", palette: "ORANGE" };
  if (probability > 0.3854) return { label: "Medium", palette: "YELLOW" };
  if (probability > 0.2826) return { label: "Low", palette: "BLUE" };
  return { label: "Very Low", palette: "GREEN" };
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
