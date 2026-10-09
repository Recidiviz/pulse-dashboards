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
  ReentryChecklistItemId,
  ReentryChecklistSectionId,
} from "~@jii/configs";

export type ReentryChecklistItem = {
  id: ReentryChecklistItemId;
  checked: boolean;
  isPersonalized: boolean;
};

export type ReentryChecklistChange = {
  itemId: ReentryChecklistItemId;
  checked: boolean;
};

export type ReentryChecklistSection = {
  id: ReentryChecklistSectionId;
  items: ReentryChecklistItem[];
};

export type SaveAnswersInput = {
  answers: Record<string, string[]>;
  isCompleted: boolean;
};

// Starts a save. onSuccess only runs once it succeeds; failures are reported
// by the save itself.
export type SaveAnswers = (
  input: SaveAnswersInput,
  options?: { onSuccess?: () => void },
) => void;
