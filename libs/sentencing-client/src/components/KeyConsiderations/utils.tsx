// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

/**
 * Creates a handler for multi-select functionality.
 *
 * @param enumObj - The enum object mapping keys to display values.
 * @param currentSelections - The currently selected keys.
 * @param updateSelections - Function to update the selected keys.
 * @param clearOtherText - Function to clear "Other" text if deselected.
 * @returns A handler function for multi-select changes.
 */
export const createMultiSelectHandler = <T extends Record<string, string>>(
  enumObj: T,
  currentSelections: string[] | undefined,
  updateSelections: (updated: string[]) => void,
  clearOtherText: () => void,
) => {
  return (displayValue: string) => {
    // Convert display value back to enum key for storage
    const enumKey =
      Object.keys(enumObj).find(
        (key) => enumObj[key as keyof T] === displayValue,
      ) ?? displayValue;

    const selections = currentSelections ?? [];

    let updated: string[];
    if (selections.includes(enumKey as (typeof selections)[number])) {
      // Deselecting
      updated = selections.filter((s) => s !== enumKey);
      // Clear "Other" text if deselecting "Other"
      if (enumKey === "Other") {
        clearOtherText();
      }
    } else {
      // Selecting
      updated = [...selections, enumKey];
    }

    updateSelections(updated);
  };
};

/**
 * Maps enum keys to their display values.
 *
 * @param enumObj - The enum object mapping keys to display values.
 * @param keys - The keys to map to display values.
 * @returns An array of display values corresponding to the keys.
 */
export const mapEnumKeysToDisplay = <T extends Record<string, string>>(
  enumObj: T,
  keys: string[] | undefined,
): string[] => {
  return (keys ?? []).map((key) => enumObj[key as keyof T] ?? key);
};
