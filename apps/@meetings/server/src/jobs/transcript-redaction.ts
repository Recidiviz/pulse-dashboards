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

import { TranscriptionProvider } from "~@meetings/prisma/client";

type Obj = Record<string, unknown>;

// Malformed stored values must neither throw, which would block redaction, nor
// carry anything but numbers and speaker labels through.
const obj = (x: unknown): Obj =>
  x !== null && typeof x === "object" && !Array.isArray(x) ? (x as Obj) : {};
const arr = (x: unknown): Obj[] => (Array.isArray(x) ? x.map(obj) : []);
const num = (x: unknown) =>
  typeof x === "number" && Number.isFinite(x) ? x : null;

// Copy timing/confidence/speaker only; any text field is dropped.
const redactWord = (w: Obj): PrismaJson.RedactedWord => {
  const speakerConfidence = num(w["speaker_confidence"]);
  return {
    start: num(w["start"]),
    end: num(w["end"]),
    confidence: num(w["confidence"]),
    speaker:
      typeof w["speaker"] === "number" || typeof w["speaker"] === "string"
        ? w["speaker"]
        : null,
    ...(speakerConfidence !== null && {
      speaker_confidence: speakerConfidence,
    }),
  };
};

const redactUtterance = (u: Obj): PrismaJson.RedactedUtterance => ({
  ...redactWord(u),
  words: arr(u["words"]).map(redactWord),
});

/**
 * Build a text-free copy of a provider transcript by allowlist, so a new
 * text-bearing field from either provider is dropped rather than retained.
 */
export function redactTranscriptObject(
  provider: TranscriptionProvider,
  transcriptObject: unknown,
): PrismaJson.RedactedTranscript {
  const t = obj(transcriptObject);
  if (provider === TranscriptionProvider.ASSEMBLYAI) {
    return {
      redacted: true,
      confidence: num(t["confidence"]),
      audio_duration: num(t["audio_duration"]),
      words: arr(t["words"]).map(redactWord),
      utterances: arr(t["utterances"]).map(redactUtterance),
    };
  }
  const metadata = obj(t["metadata"]);
  const results = obj(t["results"]);
  return {
    redacted: true,
    metadata: {
      duration: num(metadata["duration"]) ?? 0,
      channels: num(metadata["channels"]) ?? 0,
    },
    results: {
      channels: arr(results["channels"]).map((c) => ({
        alternatives: arr(c["alternatives"]).map((a) => ({
          confidence: num(a["confidence"]),
          words: arr(a["words"]).map(redactWord),
        })),
      })),
      utterances: arr(results["utterances"]).map(redactUtterance),
    },
  };
}
