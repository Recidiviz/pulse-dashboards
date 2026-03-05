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

import React, { createContext, useContext, useEffect, useState } from "react";

import { getItem, saveItem } from "../utils/storage";
import { useUserContext } from "./UserContext";

// Available state codes with meetings databases
// TODO(#12340): Read from AgencyConfig instead
export const AVAILABLE_STATE_CODES = [
  { code: "US_CO", name: "Colorado" },
  { code: "US_ME", name: "Maine" },
  { code: "US_NC", name: "North Carolina" },
  { code: "US_NE", name: "Nebraska" },
] as const;

export type StateCode = (typeof AVAILABLE_STATE_CODES)[number]["code"];

export const DEFAULT_STATE_CODE: StateCode = "US_NE";

interface StateContextType {
  /**
   * The currently selected state code for data queries.
   * For Recidiviz users (stateCode === "recidiviz"), this can be changed via settings to view different states.
   * For state users, this is always set to their organizational stateCode and cannot be changed.
   */
  selectedStateCode: StateCode;
  setSelectedStateCode: (stateCode: StateCode) => Promise<void>;
  isLoading: boolean;
  /**
   * Whether the current user has permission to select different state codes.
   * Only true for Recidiviz staff (stateCode === "recidiviz") and skip auth users.
   */
  canSelectStateCode: boolean;
  currentStateName: string | undefined;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

const SELECTED_STATE_KEY = "selectedStateCode";

export const StateCodeProvider: React.FC<{
  children: React.ReactNode;
  selectedStateRef: React.RefObject<StateCode | null>;
}> = ({ children, selectedStateRef }) => {
  const {
    isSkipAuthUser,
    recidivizAllowedStates,
    stateCode: userStateCode,
  } = useUserContext();
  const [selectedStateCode, setSelectedStateCodeInternal] =
    useState<StateCode>(DEFAULT_STATE_CODE);
  const [isLoading, setIsLoading] = useState(true);

  // Show settings for skip auth users or users who have access to multiple states.
  // Currently only Recidiviz users (UserContext.stateCode === "recidiviz") have
  // recidivizAllowedStates.length > 1, so this effectively limits state selection to internal staff.
  // State users have exactly one allowed state and cannot select others.
  const canSelectStateCode =
    isSkipAuthUser || recidivizAllowedStates.length > 1;
  const currentStateName = AVAILABLE_STATE_CODES.find(
    (s) => s.code === selectedStateCode,
  )?.name;

  // Load saved state code on mount, or initialize to user's state code if not a Recidiviz user
  useEffect(() => {
    const loadSavedStateCode = async () => {
      try {
        // For state users, initialize to their state code
        if (!canSelectStateCode) {
          const normalizedStateCode = userStateCode?.toUpperCase() as StateCode;
          if (
            AVAILABLE_STATE_CODES.some((s) => s.code === normalizedStateCode)
          ) {
            setSelectedStateCodeInternal(normalizedStateCode);
          }
          // If unsupported, keep the default - DrawerNavigator will handle showing NoAccessScreen
          setIsLoading(false);
          return;
        }

        // For Recidiviz users and skip auth, try to load from storage
        const saved = await getItem(SELECTED_STATE_KEY);
        if (saved && AVAILABLE_STATE_CODES.some((s) => s.code === saved)) {
          setSelectedStateCodeInternal(saved as StateCode);
        }
        // If no saved state code or invalid, keep the default
      } catch (error) {
        console.error("Failed to load saved state code:", error);
        // On error, keep the default
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedStateCode();
  }, [canSelectStateCode, userStateCode]);

  const setSelectedStateCode = async (stateCode: StateCode) => {
    if (!canSelectStateCode) {
      throw new Error(
        "User does not have permission to select state codes. Only Recidiviz staff can switch between states.",
      );
    }
    try {
      await saveItem(SELECTED_STATE_KEY, stateCode);
      setSelectedStateCodeInternal(stateCode);
      // Update the ref (used for TRPC headers)
      selectedStateRef.current = stateCode;
    } catch (error) {
      console.error("Failed to save selected state code:", error);
      throw error;
    }
  };

  // Sync state code to ref (for TRPC headers)
  useEffect(() => {
    if (selectedStateRef) {
      selectedStateRef.current = selectedStateCode;
    }
  }, [selectedStateCode, selectedStateRef]);

  return (
    <StateContext.Provider
      value={{
        selectedStateCode,
        setSelectedStateCode,
        isLoading,
        canSelectStateCode,
        currentStateName,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateSelection = () => {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error(
      "useStateSelection must be used within a StateCodeProvider",
    );
  }
  return context;
};
