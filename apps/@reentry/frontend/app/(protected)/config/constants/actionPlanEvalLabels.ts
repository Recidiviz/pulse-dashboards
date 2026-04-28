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

// These keys must stay in sync with _SCORE_EVALUATORS / _BINARY_EVALUATORS in
// apps/@reentry/backend/app/manage/evaluate/evaluate_generation.py

export const ACTION_PLAN_SCORE_EVALUATORS: {
  key: string;
  label: string;
  abbr: string;
}[] = [
  { key: "addressed_to_client", label: "Addressed to Client", abbr: "Addr" },
  { key: "clarity", label: "Clarity", abbr: "Clar" },
  { key: "actionable", label: "Actionable", abbr: "Act" },
  { key: "structure", label: "Structure", abbr: "Str" },
  { key: "tone", label: "Tone", abbr: "Tone" },
  { key: "timeline", label: "Timeline", abbr: "Time" },
  { key: "no_judgments", label: "No Judgments", abbr: "NJ" },
];

export const ACTION_PLAN_BINARY_EVALUATORS: {
  key: string;
  label: string;
  abbr: string;
}[] = [
  {
    key: "citations_source_is_transcript",
    label: "Citation Source",
    abbr: "CitSrc",
  },
  {
    key: "citations_text_verified",
    label: "Citation Text Verified",
    abbr: "CitTxt",
  },
];
