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

type TypingCheckpoint = {
  end: number;
  endsSection: boolean;
};

const SECTION_BREAK = /\n\s*\n/;

// Splits text into chunks
export function getTypingCheckpoints(
  text: string,
  wordsPerChunk: number,
): TypingCheckpoint[] {
  const words = Array.from(text.matchAll(/\S+/g));
  const checkpoints: TypingCheckpoint[] = [];
  let wordsInChunk = 0;

  words.forEach((word, i) => {
    const end = word.index + word[0].length;
    const next = words[i + 1];
    const endsSection =
      next === undefined || SECTION_BREAK.test(text.slice(end, next.index));
    wordsInChunk += 1;

    if (wordsInChunk === wordsPerChunk || endsSection) {
      checkpoints.push({ end, endsSection });
      wordsInChunk = 0;
    }
  });

  return checkpoints;
}
