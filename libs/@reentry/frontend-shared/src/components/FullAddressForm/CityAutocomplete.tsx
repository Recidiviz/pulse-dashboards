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

"use client";

import { Info } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useApplicationContext } from "../../contexts/ApplicationContext";
import { parseAddressSuggestion } from "./addressUtils";

export interface CitySuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  state_code?: string | null;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion: (suggestion: CitySuggestion) => void;
  error?: string | null;
  disabled?: boolean;
  placeholder?: string;
  state?: string | null;
  onValidationChange?: (isValid: boolean) => void;
  isActive?: boolean;
  onFocusChange?: (isFocused: boolean) => void;
  onAutoSelectChange?: (isAutoSelecting: boolean) => void;
  addressSuggestionSelected: string | null;
  getAccessToken: () => string | undefined | null;
  useIntakeClientApi?: boolean;
}

export const CityAutocomplete = ({
  value,
  onChange,
  onSelectSuggestion,
  error,
  disabled = false,
  placeholder = "Start typing a city...",
  state = null,
  onValidationChange,
  isActive = true,
  onFocusChange,
  onAutoSelectChange,
  addressSuggestionSelected = null,
  getAccessToken,
  useIntakeClientApi = false,
}: CityAutocompleteProps) => {
  const { $api } = useApplicationContext();
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedInput, setDebouncedInput] = useState("");
  const [suggestionSelected, setSuggestionSelected] = useState(false);
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const previousStateRef = useRef<string | null>(state);
  const previousValueRef = useRef<string>(value);
  const isUserTypingRef = useRef<boolean>(false);

  // Close dropdown when isActive becomes false
  useEffect(() => {
    if (!isActive) {
      setShowSuggestions(false);
    }
  }, [isActive]);

  // Handle clicks outside of suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // When state or value changes externally (from address selection), update debouncedInput
  useEffect(() => {
    // Handle state change - always reset user typing flag when state changes
    if (state && state !== previousStateRef.current) {
      previousStateRef.current = state;
      isUserTypingRef.current = false;
    }

    // Only update debouncedInput if value has actually changed
    if (value !== previousValueRef.current) {
      // Check if this is a programmatic change (not from user typing)
      // If user was typing but value changed to something different, it must be programmatic
      const isProgrammaticChange = !isUserTypingRef.current;

      previousValueRef.current = value;

      // If it's a programmatic change (from address selection)
      if (isProgrammaticChange) {
        // Update debouncedInput when value changes externally (not from user typing)
        // This handles the case when city is set programmatically from address selection
        if (value && value.length >= 2 && !suggestionSelected) {
          setDebouncedInput(value);
        } else if (!value || value.length < 2) {
          setDebouncedInput("");
        }
        // Reset flag after processing programmatic change
        isUserTypingRef.current = false;
      }
    }
  }, [state, value, suggestionSelected]);

  // Notify parent when validation status changes
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(suggestionSelected);
    }
  }, [suggestionSelected, onValidationChange]);

  // Notify parent when auto-selecting status changes
  useEffect(() => {
    if (onAutoSelectChange) {
      onAutoSelectChange(isAutoSelecting);
    }
  }, [isAutoSelecting, onAutoSelectChange]);

  // Use useQuery for autocomplete
  const {
    data,
    error: queryError,
    isLoading,
    refetch,
  } = $api.useQuery(
    "get",
    useIntakeClientApi
      ? "/intake/services/autocomplete-city"
      : "/autocomplete-city",
    {
      params: {
        query: {
          input: debouncedInput,
          ...(state && { state }),
          ...(addressSuggestionSelected && {
            address_suggestion_selected:
              parseAddressSuggestion(addressSuggestionSelected).parsedCity ===
              debouncedInput,
          }),
        },
      },
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
    },
    {
      enabled: debouncedInput.length >= 2 || debouncedInput.length === 0, // Only fetch when input is valid or cleared
    },
  );

  const handleSelectSuggestion = useCallback(
    (suggestion: CitySuggestion) => {
      onChange(suggestion.description);
      onSelectSuggestion(suggestion);
      setSuggestionSelected(true);
      setShowSuggestions(false);
      // Reset user typing flag after selection
      isUserTypingRef.current = false;
    },
    [onChange, onSelectSuggestion],
  );
  // Update suggestions when data changes
  useEffect(() => {
    if (data?.success && data?.suggestions) {
      setSuggestions(data.suggestions);
      setShowSuggestions(true);
    } else if (data || queryError) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [data, queryError]);

  const selectFirstSuggestion = useCallback(() => {
    if (suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
      setIsAutoSelecting(false);
    } else {
      // If no suggestions found, stop loading state and let user keep typing
      setIsAutoSelecting(false);
    }
  }, [suggestions, handleSelectSuggestion]);

  // Auto-select first suggestion if value exists but no suggestion selected
  const refreshSuggestionByAddress = useCallback(async () => {
    // Only refetch if debouncedInput is valid
    if (debouncedInput && debouncedInput.length >= 2) {
      setIsAutoSelecting(true);
      await refetch();
      setTimeout(() => {
        selectFirstSuggestion();
      }, 3000);
    }
    return;
  }, [refetch, debouncedInput, selectFirstSuggestion]);

  useEffect(() => {
    // Only auto-select if value was set programmatically (not from user typing)
    if (
      !isUserTypingRef.current &&
      value &&
      value.length >= 2 &&
      !suggestionSelected &&
      !isLoading &&
      !isAutoSelecting &&
      debouncedInput.length >= 2
    ) {
      refreshSuggestionByAddress();
    }
  }, [
    value,
    suggestionSelected,
    suggestions,
    isLoading,
    debouncedInput,
    isAutoSelecting,
    refreshSuggestionByAddress,
  ]);

  const handleInputChange = (newValue: string) => {
    // Mark that this is user input, not programmatic
    isUserTypingRef.current = true;

    onChange(newValue);
    setSuggestionSelected(false);
    previousValueRef.current = newValue;

    // Clear the previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If input is too short, clear immediately
    if (newValue.length < 2) {
      setDebouncedInput("");
      setSuggestions([]);
      setShowSuggestions(false);
      // Reset typing flag when field is cleared
      isUserTypingRef.current = false;
      return;
    }

    // Set a new timer to update debounced input after 300ms
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedInput(newValue);
    }, 300) as unknown as number;
  };

  return (
    <div className="relative">
      <label
        htmlFor="city"
        className="block text-xs font-medium text-gray-700 mb-1"
      >
        City (required)
      </label>
      <input
        ref={inputRef}
        type="text"
        id="city"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          onFocusChange?.(true);
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        onBlur={() => {
          // Small delay to allow click on suggestions
          setTimeout(() => {
            onFocusChange?.(false);
          }, 200);
        }}
        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500 focus:ring-red-500" : "border-gray-300"
        } ${isAutoSelecting || disabled ? "bg-gray-50 cursor-not-allowed" : ""}`}
        placeholder={placeholder}
        disabled={disabled || isAutoSelecting}
        autoComplete="off"
      />
      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
      {(isLoading || isAutoSelecting) && value && !suggestionSelected && (
        <div className="absolute right-3 top-8">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {showSuggestions && suggestions.length > 0 && isActive && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions
            .filter((suggestion) => {
              if (!suggestion.state_code) {
                return true;
              }
              return state ? suggestion.state_code === state : true;
            })
            .map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100"
              >
                <div className="text-sm font-medium text-gray-900">
                  {suggestion.main_text}
                </div>
                <div className="text-xs text-gray-500">
                  {suggestion.secondary_text}
                </div>
              </button>
            ))}
          <div className="px-3 py-2 bg-blue-50 border-t border-blue-100">
            <div className="flex items-start gap-2 text-xs text-blue-700">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Type more letters to see additional suggestions</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
