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

import type { StateCode } from "~@meetings/prisma/client";

const HAS_LOWERCASE = /\p{Ll}/u;
const LETTER_RUN = /[\p{L}\p{M}]+/gu;

/**
 * Case management systems usually hand us names in all caps ("JEWEL
 * HILPERT"), and the writer copies the authoritative name from the CLIENT
 * PROFILE verbatim, so notes end up reading "...and JEWEL responded". Restore
 * normal casing before the name reaches a prompt.
 */
export function normalizeNameCasing(name: string): string {
  return name
    .split(" ")
    .map((word) =>
      HAS_LOWERCASE.test(word)
        ? word
        : word.replace(
            LETTER_RUN,
            (run) => run[0].toUpperCase() + run.slice(1).toLowerCase(),
          ),
    )
    .join(" ");
}

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

/**
 * The time zone used to express a meeting's start in local time when the
 * meeting has no time zone from the recording device, e.g. one recorded by an
 * older app build. States that span more than one zone use the zone most of
 * their population lives in.
 */
const STATE_TIME_ZONES: Record<StateCode, string> = {
  US_AL: "America/Chicago",
  US_AK: "America/Anchorage",
  US_AZ: "America/Phoenix",
  US_AR: "America/Chicago",
  US_CA: "America/Los_Angeles",
  US_CO: "America/Denver",
  US_CT: "America/New_York",
  US_DE: "America/New_York",
  US_FL: "America/New_York",
  US_GA: "America/New_York",
  US_HI: "Pacific/Honolulu",
  US_ID: "America/Boise",
  US_IL: "America/Chicago",
  US_IN: "America/Indiana/Indianapolis",
  US_IA: "America/Chicago",
  US_KS: "America/Chicago",
  US_KY: "America/New_York",
  US_LA: "America/Chicago",
  US_ME: "America/New_York",
  US_MD: "America/New_York",
  US_MA: "America/New_York",
  US_MI: "America/Detroit",
  US_MN: "America/Chicago",
  US_MS: "America/Chicago",
  US_MO: "America/Chicago",
  US_MT: "America/Denver",
  US_NE: "America/Chicago",
  US_NV: "America/Los_Angeles",
  US_NH: "America/New_York",
  US_NJ: "America/New_York",
  US_NM: "America/Denver",
  US_NY: "America/New_York",
  US_NC: "America/New_York",
  US_ND: "America/Chicago",
  US_OH: "America/New_York",
  US_OK: "America/Chicago",
  US_OR: "America/Los_Angeles",
  US_PA: "America/New_York",
  US_RI: "America/New_York",
  US_SC: "America/New_York",
  US_SD: "America/Chicago",
  US_TN: "America/Chicago",
  US_TX: "America/Chicago",
  US_UT: "America/Denver",
  US_VT: "America/New_York",
  US_VA: "America/New_York",
  US_WA: "America/Los_Angeles",
  US_WV: "America/New_York",
  US_WI: "America/Chicago",
  US_WY: "America/Denver",
  US_DEMO: "America/New_York",
};

/**
 * Returns the zone a meeting happened in: the recording device's, or the
 * state's for meetings without one.
 */
function getMeetingTimeZone(
  stateCode: StateCode,
  timeZone?: string | null,
): string {
  return timeZone ?? STATE_TIME_ZONES[stateCode];
}

/**
 * Returns when a meeting started, in the meeting's local time, spelled out for
 * a prompt, e.g. "Thursday, September 24, 2026 at 7:30 PM CDT". Meeting times
 * are stored in UTC, so without the conversion an evening meeting in Nebraska
 * would land on the next day. The weekday lets the model resolve phrases like
 * "see you next Tuesday".
 */
export function formatMeetingStartForPrompt(
  startTime: Date,
  stateCode: StateCode,
  timeZone?: string | null,
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: getMeetingTimeZone(stateCode, timeZone),
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(startTime);
}

/**
 * Returns the date a meeting started on, in the meeting's local time, as
 * YYYY-MM-DD.
 */
export function formatMeetingLocalDate(
  startTime: Date,
  stateCode: StateCode,
  timeZone?: string | null,
): string {
  // en-CA formats dates as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: getMeetingTimeZone(stateCode, timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(startTime);
}
