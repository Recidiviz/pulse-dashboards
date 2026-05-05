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

/** Format speaker-segmented utterances into the raw text fed to the LLM. */
export function utterancesToRawText(
  utterances: { speaker: string; text: string }[],
): string {
  return utterances.map((u) => `[${u.speaker}]: ${u.text}`).join("\n");
}

/**
 * Format a transcriptions array (ordered by confidence desc) into the
 * per-provider and best-transcript texts used by the LLM and evaluators.
 */
export function formatTranscripts(
  transcriptions: {
    provider: string;
    utterances: { speaker: string; text: string }[];
  }[],
): {
  byProvider: Partial<Record<"assemblyai" | "deepgram", string>>;
  best: string;
} {
  const byProvider: Partial<Record<"assemblyai" | "deepgram", string>> = {};
  for (const t of transcriptions) {
    const key = t.provider === "ASSEMBLYAI" ? "assemblyai" : "deepgram";
    byProvider[key] = utterancesToRawText(t.utterances);
  }
  return {
    byProvider,
    best: utterancesToRawText(transcriptions[0].utterances),
  };
}
