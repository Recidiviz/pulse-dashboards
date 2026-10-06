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

import type { FlaggedMeetingDetails } from "~@meetings/app/admin/api/flaggedMeetings";

import { formatDate, formatDateTime, formatMinutes } from "./format";

export type MetaItem = {
  label: string;
  value: string;
  href?: string;
  /** Marks a value that says data is gone. */
  attention?: boolean;
};

const PERSON_LABELS = { client: "Client", resident: "Resident" } as const;

function buildAudioItem(details: FlaggedMeetingDetails): MetaItem {
  if (details.audioDeletedAt) {
    return {
      label: "Audio",
      value: `Deleted ${formatDate(details.audioDeletedAt)}`,
      attention: true,
    };
  }
  if (details.audioConsoleUrl) {
    return {
      label: "Audio",
      value: "Open in GCS",
      href: details.audioConsoleUrl,
    };
  }
  return { label: "Audio", value: "Not available" };
}

export function buildMetaItems(details: FlaggedMeetingDetails): MetaItem[] {
  const { person, labelStudio, llm } = details;

  const personValue =
    [person.name, person.displayId].filter(Boolean).join(" · ") || "—";

  const recorded = [
    formatDate(details.startTime),
    details.durationMs !== null ? formatMinutes(details.durationMs) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const audio = buildAudioItem(details);

  const transcript: MetaItem = details.transcriptDeletedAt
    ? {
        label: "Transcript",
        value: `Deleted ${formatDate(details.transcriptDeletedAt)}`,
        attention: true,
      }
    : { label: "Transcript", value: "Available" };

  let labelStudioItem: MetaItem;
  if (!labelStudio) {
    labelStudioItem = { label: "Label Studio", value: "Not sent" };
  } else {
    const rated = labelStudio.raters.length > 0;
    labelStudioItem = {
      label: "Label Studio",
      value: rated
        ? `Task ${labelStudio.taskId}`
        : `Task ${labelStudio.taskId} · not rated yet`,
      href: labelStudio.taskUrl,
    };
  }

  return [
    {
      label: person.type ? PERSON_LABELS[person.type] : "Client/Resident",
      value: personValue,
    },
    { label: "Meeting type", value: details.meetingType ?? "—" },
    { label: "Staff", value: details.staffEmail },
    { label: "Recorded", value: recorded },
    audio,
    transcript,
    {
      label: "LLM evaluation",
      value: llm
        ? `${llm.evaluatorVersion} · ran ${formatDateTime(llm.createdAt)}`
        : "Not evaluated",
    },
    labelStudioItem,
  ];
}
