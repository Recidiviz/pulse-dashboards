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

import Clipboard from "@react-native-clipboard/clipboard";

import type { MinuteSection } from "~@meetings/trpc-types";

type Params = {
  userNotepadNotes: string | null;
  actionItems: string[] | null;
  criticalUpdates: string[] | null;
  meetingSummary: MinuteSection[] | null;
};

type MinuteItem = MinuteSection["items"][number];

function formatMinuteItem(item: MinuteItem) {
  const line = [item.timestamp, item.content].filter(Boolean).join(" ");
  if (item.status === "Discussed") return line;
  return `${line}\n${item.status}`;
}

function formatMinuteSection(section: MinuteSection) {
  const itemsText = section.items.map(formatMinuteItem).join("\n");
  return `${section.title}\n${itemsText}`;
}

function formatBulletList(label: string, items: string[]) {
  return `${label}:\n- ${items.join("\n- ")}`;
}

export function copyMeetingNotes({
  userNotepadNotes,
  actionItems,
  criticalUpdates,
  meetingSummary,
}: Params) {
  const parts: string[] = [];

  if (userNotepadNotes) {
    parts.push(`Notes: ${userNotepadNotes}`);
  }

  if (actionItems && actionItems.length > 0) {
    parts.push(formatBulletList("Action Items", actionItems));
  }

  if (criticalUpdates && criticalUpdates.length > 0) {
    parts.push(formatBulletList("Critical Updates", criticalUpdates));
  }

  // TODO: format meeting summary after we agree about the structure
  if (meetingSummary && meetingSummary.length > 0) {
    const sectionsText = meetingSummary.map(formatMinuteSection).join("\n");
    parts.push(`Meeting Summary:\n${sectionsText}`);
  }

  Clipboard.setString(parts.join("\n\n"));
}
