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

import { useCallback, useEffect, useRef, useState } from "react";

import {
  AddressAutocomplete,
  type AddressSuggestion,
} from "./AddressAutocomplete";
import { parseAddressSuggestion } from "./addressUtils";
import { StateCityAutocomplete } from "./StateCityAutocomplete";

interface FullAddressFormProps {
  addressValue: string;
  cityValue: string;
  stateValue: string;
  onAddressChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onStateValidationChange?: (isValid: boolean) => void;
  onCityValidationChange?: (isValid: boolean) => void;
  onFormValidChange?: (isValid: boolean) => void;
  disabled?: boolean;
  addressPlaceholder?: string;
  cityPlaceholder?: string;
  statePlaceholder?: string;
  stateLabel?: string;
  addressError?: string | null;
  twoColumns?: boolean;
}

export const FullAddressForm = ({
  addressValue,
  cityValue,
  stateValue,
  onAddressChange,
  onCityChange,
  onStateChange,
  onStateValidationChange,
  onCityValidationChange,
  onFormValidChange,
  disabled = false,
  addressPlaceholder = "Start typing an address...",
  cityPlaceholder,
  statePlaceholder,
  stateLabel,
  addressError,
  twoColumns = true,
}: FullAddressFormProps) => {
  const [activeDropdown, setActiveDropdown] = useState<
    "address" | "state" | "city" | null
  >(null);

  // Keep a ref to always have the latest activeDropdown value
  // This prevents stale closures in async callbacks (like setTimeout in onBlur)
  const activeDropdownRef = useRef(activeDropdown);
  useEffect(() => {
    activeDropdownRef.current = activeDropdown;
  }, [activeDropdown]);

  const [isStateValid, setIsStateValid] = useState(false);
  const [isCityValid, setIsCityValid] = useState(false);
  const [isValidatingCity, setIsValidatingCity] = useState(false);
  const [addressSuggestionSelected, setAddressSuggestionSelected] = useState<
    string | null
  >(null);

  const isFormValid = useCallback(() => {
    return isStateValid && isCityValid;
  }, [isStateValid, isCityValid]);

  const handleStateValidationChange = useCallback(
    (isValid: boolean) => {
      setIsStateValid(isValid);
      onStateValidationChange?.(isValid);
    },
    [onStateValidationChange],
  );

  const handleCityValidationChange = useCallback(
    (isValid: boolean) => {
      setIsCityValid(isValid);
      onCityValidationChange?.(isValid);
    },
    [onCityValidationChange],
  );

  // Notify parent when form validity changes
  useEffect(() => {
    if (onFormValidChange) {
      onFormValidChange(isFormValid());
    }
  }, [isStateValid, isCityValid, onFormValidChange, isFormValid]);

  const handleAddressChange = (value: string) => {
    onAddressChange(value);
    // Clear city and state when address is manually changed
    onCityChange("");
    onStateChange("");
    // Reset the flag when user manually changes the address
    setAddressSuggestionSelected("");
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    // Parse the selected address to extract components
    const { streetAddress, parsedCity, parsedState } = parseAddressSuggestion(
      suggestion.description,
    );

    onAddressChange(streetAddress);
    // Update state first, then city after a small delay to ensure state is set
    onStateChange(parsedState);
    // Set the flag to indicate an address suggestion was selected
    setAddressSuggestionSelected(suggestion.description);
    // Use setTimeout to ensure state is set before city, avoiding the reset logic
    setTimeout(() => {
      onCityChange(parsedCity);
    }, 0);
  };

  return (
    <>
      <AddressAutocomplete
        value={addressValue}
        onChange={handleAddressChange}
        onSelectSuggestion={handleSelectSuggestion}
        error={addressError}
        disabled={disabled}
        placeholder={addressPlaceholder}
        isActive={activeDropdown === "address"}
        onFocusChange={(isFocused) => {
          if (isFocused) {
            setActiveDropdown("address");
          } else if (activeDropdownRef.current === "address") {
            // Only clear if address is currently active (using ref to get latest value)
            setActiveDropdown(null);
          }
        }}
      />

      <StateCityAutocomplete
        stateValue={stateValue}
        cityValue={cityValue}
        onStateChange={onStateChange}
        onCityChange={onCityChange}
        disabled={disabled}
        onStateValidationChange={handleStateValidationChange}
        onCityValidationChange={handleCityValidationChange}
        twoColumns={twoColumns}
        cityPlaceholder={cityPlaceholder}
        statePlaceholder={statePlaceholder}
        stateLabel={stateLabel}
        activeDropdown={activeDropdown}
        setActiveDropdown={setActiveDropdown}
        onCityAutoSelectChange={setIsValidatingCity}
        addressSuggestionSelected={addressSuggestionSelected}
      />

      {!isFormValid() && (stateValue || cityValue) && !isValidatingCity && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
          Please select a valid state and city from the suggestions to continue.
        </div>
      )}
    </>
  );
};
export default FullAddressForm;
