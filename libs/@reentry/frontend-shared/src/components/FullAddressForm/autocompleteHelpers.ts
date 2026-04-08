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

export type HelpMessageType = "info" | "loading" | "warning" | "error";

export interface HelpMessage {
  type: HelpMessageType;
  message: string;
}

interface GetAutocompleteHelpMessageParams {
  value: string;
  debouncedInput: string;
  isLoading: boolean;
  queryError: unknown;
  data: { success: boolean; suggestions: unknown[] } | undefined;
  suggestionSelected: boolean;
  fieldName: string; // "addresses" or "cities"
  minLength?: number;
  customEmptyMessage?: string;
  customFilteredMessage?: string;
}

/**
 * Shared helper function to generate context-aware help messages for autocomplete fields
 */
export const getAutocompleteHelpMessage = ({
  value,
  debouncedInput,
  isLoading,
  queryError,
  data,
  suggestionSelected,
  fieldName,
  minLength = 2,
  customEmptyMessage,
  customFilteredMessage,
}: GetAutocompleteHelpMessageParams): HelpMessage | null => {
  // Don't show message if a suggestion was already selected
  if (suggestionSelected) {
    return null;
  }

  // Show message for inputs with at least 1 character that haven't been debounced yet
  const isDebouncePending =
    value.length >= minLength && debouncedInput !== value;

  // Input too short
  if (value.length > 0 && value.length < minLength) {
    return {
      type: "info",
      message: `Type at least ${minLength} ${minLength === 1 ? "character" : "characters"} to search for ${fieldName}`,
    };
  }

  // Waiting for debounce or API loading (only show if user has typed something)
  if ((isDebouncePending || isLoading) && value.length > 0) {
    return {
      type: "loading",
      message: `Searching for ${fieldName}...`,
    };
  }

  // API returned but we have input >= minLength chars
  if (value.length >= minLength && debouncedInput === value && !isLoading) {
    // API error
    if (queryError) {
      return {
        type: "error",
        message: `Unable to load ${fieldName} suggestions. Please try again.`,
      };
    }

    // API returned empty
    if (data?.success && data.suggestions.length === 0) {
      return {
        type: "warning",
        message:
          customEmptyMessage ||
          `No ${fieldName} found. Try typing more characters or check your spelling.`,
      };
    }

    // Custom filtered message (for city filtering by state)
    if (customFilteredMessage) {
      return {
        type: "warning",
        message: customFilteredMessage,
      };
    }
  }

  return null;
};
