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

import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";

export const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
  { code: "DC", name: "District of Columbia" },
];

// Helper function to convert state name or code to state code
export const getStateCode = (stateNameOrCode: string): string => {
  // If it's already a 2-letter code, return it
  if (stateNameOrCode.length === 2) {
    const upperCode = stateNameOrCode.toUpperCase();
    if (US_STATES.find((s) => s.code === upperCode)) {
      return upperCode;
    }
  }

  // Try to find by name
  const state = US_STATES.find(
    (s) => s.name.toLowerCase() === stateNameOrCode.toLowerCase(),
  );

  return state ? state.code : stateNameOrCode;
};

interface StateSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
  isActive?: boolean;
  onFocusChange?: (isFocused: boolean) => void;
  cleanCity: () => void;
}

export const StateSelector = ({
  value,
  onChange,
  disabled = false,
  className = "",
  label = "State",
  placeholder = "Select state...",
  isActive = true,
  cleanCity,
  onFocusChange,
}: StateSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Close dropdown when isActive becomes false (another dropdown was opened)
  useEffect(() => {
    if (!isActive) {
      setIsOpen(false);
      setSearchQuery("");
    }
  }, [isActive]);

  const filteredStates = US_STATES.filter(
    (state) =>
      state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      state.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedState = US_STATES.find((state) => state.code === value);

  const handleSelect = (stateCode: string) => {
    onChange(stateCode);
    setIsOpen(false);
    setSearchQuery("");
    onFocusChange?.(false);
  };

  const handleToggle = () => {
    if (!disabled) {
      if (isOpen) {
        // Closing: update state first, then notify parent
        setIsOpen(false);
        setSearchQuery("");
        onFocusChange?.(false);
      } else {
        // Opening: update both immediately
        setIsOpen(true);
        onFocusChange?.(true);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-md text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between ${
            disabled
              ? "bg-gray-100 cursor-not-allowed"
              : "bg-white cursor-pointer hover:border-gray-400"
          } ${value ? "text-gray-900" : "text-gray-500"} border-gray-300`}
        >
          <span>{selectedState ? selectedState.name : placeholder}</span>
          <ChevronsUpDown className="w-4 h-4 text-gray-400" />
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search states..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="overflow-auto max-h-48">
              {filteredStates.length > 0 ? (
                filteredStates.map((state) => (
                  <button
                    key={state.code}
                    type="button"
                    onClick={() => {
                      cleanCity();
                      handleSelect(state.code);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center justify-between ${
                      value === state.code ? "bg-blue-50" : ""
                    }`}
                  >
                    <span className="text-sm">
                      {state.name} ({state.code})
                    </span>
                    {value === state.code && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No states found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isOpen && !disabled && (
        <div
          role="button"
          tabIndex={0}
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            onFocusChange?.(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter") {
              setIsOpen(false);
              onFocusChange?.(false);
            }
          }}
        />
      )}
    </div>
  );
};
