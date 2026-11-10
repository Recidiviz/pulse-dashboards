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

const QUESTION_NUMBER_SUFFIX = /\s(\(Q[^)]*\))$/;

export function splitQuestionNumber(label: string): {
  text: string;
  questionNumber: string | null;
} {
  const match = label.match(QUESTION_NUMBER_SUFFIX);
  if (!match) return { text: label, questionNumber: null };
  return {
    text: label.slice(0, match.index),
    questionNumber: match[1],
  };
}
