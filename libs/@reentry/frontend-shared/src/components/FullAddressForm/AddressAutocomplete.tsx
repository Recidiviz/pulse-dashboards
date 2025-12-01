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

import { AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useApplicationContext } from "../../contexts/ApplicationContext";

export interface AddressSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion: (suggestion: AddressSuggestion) => void;
  error?: string | null;
  disabled?: boolean;
  placeholder?: string;
  isActive?: boolean;
  onFocusChange?: (isFocused: boolean) => void;
}

export const AddressAutocomplete = ({
  value,
  onChange,
  onSelectSuggestion,
  error,
  disabled = false,
  placeholder = "Start typing an address...",
  isActive = true,
  onFocusChange,
}: AddressAutocompleteProps) => {
  const { $api } = useApplicationContext();
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedInput, setDebouncedInput] = useState("");
  const [suggestionSelected, setSuggestionSelected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<number | null>(null);

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

  // Use useQuery for autocomplete
  const {
    data,
    error: queryError,
    isLoading,
  } = $api.useQuery(
    "get",
    "/autocomplete-address",
    {
      params: {
        query: {
          input: debouncedInput,
        },
      },
      headers: {
        "Content-Type": "application/json",
      },
    },
    {
      enabled: debouncedInput.length >= 2,
    },
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

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setSuggestionSelected(false);

    // Clear the previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If input is too short, clear immediately
    if (newValue.length < 2) {
      setDebouncedInput("");
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Set a new timer to update debounced input after 300ms
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedInput(newValue);
    }, 300) as unknown as number;
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(suggestion.description);
    onSelectSuggestion(suggestion);
    setSuggestionSelected(true);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <label
        htmlFor="address"
        className="block text-xs font-medium text-gray-700 mb-1"
      >
        Address
      </label>
      <input
        ref={inputRef}
        type="text"
        id="address"
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
            // Only blur if this input is still not focused
            if (document.activeElement !== inputRef.current) {
              onFocusChange?.(false);
            }
          }, 200);
        }}
        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500 focus:ring-red-500" : "border-gray-300"
        }`}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
      {isLoading && !value && !suggestionSelected && (
        <div className="absolute right-3 top-8">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {showSuggestions && suggestions.length > 0 && isActive && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="text-sm font-medium text-gray-900">
                {suggestion.main_text}
              </div>
              <div className="text-xs text-gray-500">
                {suggestion.secondary_text}
              </div>
            </button>
          ))}
        </div>
      )}
      {!suggestionSelected && value.length >= 2 && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md">
          <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
          <span className="text-xs text-orange-800">
            Address could not be validated. You can continue with this entry,
            but it may lead to fewer relevant resources.
          </span>
        </div>
      )}
    </div>
  );
};
