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
import type {
  ActiveReleaseTaskType,
  ReleaseTaskOwnerRole,
  ReleaseTaskType,
} from "~@idaho-th/shared";

export type ReleaseTaskRow = {
  taskType: ReleaseTaskType;
  completed: boolean;
  note?: string | null;
  date?: Date | null;
};

/**
 * A detail value as the update mutation takes it: the note text, or the date
 * as `yyyy-MM-dd`. `null` clears it.
 */
export type ReleaseTaskDetailUpdate =
  | { type: "text"; note: string | null }
  | { type: "date"; date: string | null };

/** Detail data supplied by the consuming view. */
export type ReleaseTaskDetailConfig =
  | {
      type: "text";
      value: string;
      editable: boolean;
      onChange?: (note: string) => void;
    }
  | {
      type: "date";
      value: Date | null;
      editable: boolean;
      onChange?: (date: string | null) => void;
    };

/** Detail copy owned by this component. */
export type ReleaseTaskDetailContent = {
  /** Short field name for screen readers; the placeholder may be a full sentence. */
  ariaLabel: string;
  placeholder: string;
  emptyMessage: string;
  /** Checkbox hint shown while a required detail is empty. */
  requiredHint: string;
  /** Prefix for a read-only date, e.g. "Bed available". Date details only. */
  valueLabel?: string;
};

/** How a view wants every detail-bearing task rendered. */
export type ReleaseTaskDetailsOptions = {
  viewerRole: ReleaseTaskOwnerRole;
  canToggle: boolean;
  onChange?: (
    taskType: ActiveReleaseTaskType,
    detail: ReleaseTaskDetailUpdate,
  ) => void;
};

export interface ReleaseTaskListProps {
  tasks: ReleaseTaskRow[] | null;
  viewerRole: ReleaseTaskOwnerRole;
  disabled: boolean;
  isToggling: boolean;
  onToggle: (taskType: ReleaseTaskType) => void;
  details?: Partial<Record<ReleaseTaskType, ReleaseTaskDetailConfig>>;
}
