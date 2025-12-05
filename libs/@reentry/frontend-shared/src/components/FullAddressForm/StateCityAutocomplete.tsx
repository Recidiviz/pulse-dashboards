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

import { useEffect, useRef, useState } from "react";

import { CityAutocomplete, CitySuggestion } from "./CityAutocomplete";
import { StateSelector } from "./StateSelector";

interface StateCityAutocompleteProps {
  stateValue: string;
  cityValue: string;
  onStateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  cityError?: string | null;
  disabled?: boolean;
  statePlaceholder?: string;
  cityPlaceholder?: string;
  stateLabel?: string;
  onStateValidationChange?: (isValid: boolean) => void;
  onCityValidationChange?: (isValid: boolean) => void;
  twoColumns?: boolean;
  activeDropdown?: "address" | "state" | "city" | null;
  setActiveDropdown?: (dropdown: "address" | "state" | "city" | null) => void;
  onCityAutoSelectChange?: (isAutoSelecting: boolean) => void;
  addressSuggestionSelected?: string | null;
}

export const StateCityAutocomplete = ({
  stateValue,
  cityValue,
  onStateChange,
  onCityChange,
  cityError,
  disabled = false,
  statePlaceholder = "Select state...",
  cityPlaceholder = "Start typing a city...",
  stateLabel = "State (required)",
  onStateValidationChange,
  onCityValidationChange,
  twoColumns = false,
  activeDropdown,
  setActiveDropdown,
  onCityAutoSelectChange,
  addressSuggestionSelected = null,
}: StateCityAutocompleteProps) => {
  const [previousState, setPreviousState] = useState(stateValue);
  const previousCityRef = useRef(cityValue);

  // When state changes, reset city value only if user manually changed state
  // (not when both state and city are set together from address selection)
  useEffect(() => {
    if (stateValue !== previousState) {
      setPreviousState(stateValue);

      // Only reset city if:
      // 1. City value hasn't changed recently (within 50ms window)
      // 2. There's a city value to reset
      const timer = setTimeout(() => {
        // If city value is the same as it was when state changed, clear it
        // This means city wasn't updated along with state
        if (cityValue === previousCityRef.current && cityValue) {
          onCityChange("");
        }
      }, 50);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [stateValue, previousState, cityValue, onCityChange]);

  // Track city changes
  useEffect(() => {
    previousCityRef.current = cityValue;
  }, [cityValue]);

  // Track state validation - state is valid if it's selected from the dropdown
  useEffect(() => {
    if (onStateValidationChange) {
      onStateValidationChange(!!stateValue);
    }
  }, [stateValue, onStateValidationChange]);

  const handleStateChange = (value: string) => {
    onStateChange(value);
  };

  const handleCitySelect = (suggestion: CitySuggestion) => {
    // Only update the city, never update state
    const parts = suggestion.description.split(", ");
    if (parts.length >= 1) {
      onCityChange(parts[0]);
    }
  };

  return (
    <div className={twoColumns ? "grid grid-cols-2 gap-4" : "space-y-4"}>
      <StateSelector
        value={stateValue}
        onChange={handleStateChange}
        cleanCity={() => onCityChange("")}
        disabled={disabled}
        label={stateLabel}
        placeholder={statePlaceholder}
        isActive={activeDropdown === "state"}
        onFocusChange={(isFocused) =>
          setActiveDropdown?.(isFocused ? "state" : null)
        }
      />
      <CityAutocomplete
        value={cityValue}
        onChange={onCityChange}
        onSelectSuggestion={handleCitySelect}
        error={cityError}
        disabled={disabled || !stateValue}
        placeholder={cityPlaceholder}
        state={stateValue || null}
        onValidationChange={onCityValidationChange}
        isActive={activeDropdown === "city"}
        onFocusChange={(isFocused) =>
          setActiveDropdown?.(isFocused ? "city" : null)
        }
        onAutoSelectChange={onCityAutoSelectChange}
        addressSuggestionSelected={addressSuggestionSelected}
      />
    </div>
  );
};
