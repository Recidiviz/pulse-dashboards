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

import {
  PROVIDER_CONTACT_MAX_LENGTH,
  providerContactFieldSchemas,
} from "~@idaho-th/shared";

import { EditableFieldKey } from "./types";

export const maxLengthFor = (key: EditableFieldKey): number | undefined =>
  key === "contactPhone" ? undefined : PROVIDER_CONTACT_MAX_LENGTH[key];

export function validateEditableField(
  key: EditableFieldKey,
  currentValue: string,
  newValue: string,
): string | null {
  const trimmed = newValue.trim();

  // The same schemas the mutations validate against, so the editor rejects
  // exactly what the server would — including the required organization name
  // and the required personal name, neither of which can be cleared.
  const result = providerContactFieldSchemas[key].safeParse(trimmed);
  if (!result.success) return result.error.issues[0].message;

  // The phone is nullable in the database, but clearing a value that was
  // already there is almost always a mistake in this editor.
  if (currentValue.trim().length > 0 && trimmed.length === 0) {
    return "This field can't be cleared";
  }

  return null;
}

export function toMutationValue(newValue: string): string {
  return newValue.trim();
}
