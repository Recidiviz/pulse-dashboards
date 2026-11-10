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

import type { ActiveReleaseTaskType } from "~@idaho-th/shared";
import { ReleaseTaskOwnerRole, ReleaseTaskType } from "~@idaho-th/shared";

import type { ReleaseTaskDetailContent } from "./types";

export const OWNER_ACTION_LABEL: Record<ReleaseTaskOwnerRole, string> = {
  [ReleaseTaskOwnerRole.STAFF]: "Case manager action",
  [ReleaseTaskOwnerRole.PROVIDER]: "Provider action",
};

/** Copy for every task in RELEASE_TASK_DETAILS. */
export const DETAIL_CONTENT: Partial<
  Record<ActiveReleaseTaskType, ReleaseTaskDetailContent>
> = {
  [ReleaseTaskType.TRANSPORTATION_SECURED]: {
    ariaLabel: "Transportation note",
    placeholder:
      "How will the client get to the provider? E.g., bus, family pickup",
    emptyMessage:
      "The Case Manager has not provided transportation details yet.",
    requiredHint: "Enter the transportation details first.",
  },
  [ReleaseTaskType.RESIDENT_CONFIRMED_FUNDING]: {
    ariaLabel: "Funding note",
    placeholder:
      "How will the client pay for their housing? E.g., self-pay, IDOC pay",
    emptyMessage: "The Case Manager has not provided funding details yet.",
    requiredHint: "Enter the funding details first.",
  },
  [ReleaseTaskType.BED_CONFIRMED]: {
    ariaLabel: "Date bed is available",
    placeholder: "When is the bed available?",
    emptyMessage: "The Provider has not provided a bed available date yet.",
    requiredHint: "Enter the date bed is available first.",
    valueLabel: "Bed available",
  },
  [ReleaseTaskType.TRANSPORTATION_INSTRUCTIONS]: {
    ariaLabel: "Transportation instructions note",
    placeholder: "Where and when should the resident meet you?",
    emptyMessage:
      "The Provider has not shared transportation instructions yet.",
    requiredHint: "Enter the transportation instructions first.",
  },
};
