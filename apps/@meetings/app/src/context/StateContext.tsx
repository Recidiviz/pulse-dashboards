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

import { useUserContext } from "~@meetings/app/entities/user";

import { useAgencyConfigs } from "../entities/agency-config";
import { stateCodeParam } from "../navigation/config";
import { getItem, saveItem } from "../shared/lib/storage";

export type StateCode = string;

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
  const { agencyConfigs } = useAgencyConfigs();
  // For state users, initialize directly to their state code so the ref is correct before the
  // sync effect runs and overwrites it. Recidiviz users and skip-auth users start at the default
  // and load from storage in the effect below.
  const initialStateCode =
    !isSkipAuthUser &&
    userStateCode &&
    userStateCode !== "recidiviz" &&
    recidivizAllowedStates.length <= 1
      ? (userStateCode.toUpperCase() as StateCode)
      : ((stateCodeParam.current || DEFAULT_STATE_CODE) as StateCode);
  const [selectedStateCode, setSelectedStateCodeInternal] =
    useState<StateCode>(initialStateCode);
  const [isLoading, setIsLoading] = useState(true);

  // Show settings for skip auth users or users who have access to multiple states.
  // Currently only Recidiviz users (UserContext.stateCode === "recidiviz") have
  // recidivizAllowedStates.length > 1, so this effectively limits state selection to internal staff.
  // State users have exactly one allowed state and cannot select others.
  const canSelectStateCode =
    isSkipAuthUser || recidivizAllowedStates.length > 1;
  const currentStateName = agencyConfigs[selectedStateCode]?.name;

  // Load saved state code on mount, or initialize to user's state code if not a Recidiviz user
  useEffect(() => {
    const loadSavedStateCode = async () => {
      try {
        // For state users, initialize to their state code
        if (!canSelectStateCode) {
          const normalizedStateCode = userStateCode?.toUpperCase() as StateCode;
          if (normalizedStateCode in agencyConfigs) {
            setSelectedStateCodeInternal(normalizedStateCode);
          }
          // If unsupported, keep the default - DrawerNavigator will handle showing NoAccessScreen
          setIsLoading(false);
          return;
        }

        // For Recidiviz users and skip auth: URL param takes priority over storage
        if (stateCodeParam.current && stateCodeParam.current in agencyConfigs) {
          setSelectedStateCodeInternal(stateCodeParam.current as StateCode);
          setIsLoading(false);
          return;
        }

        // Fall back to storage
        const saved = await getItem(SELECTED_STATE_KEY);
        if (saved && saved in agencyConfigs) {
          stateCodeParam.current = saved; // keep in sync for getPathFromState
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
  }, [canSelectStateCode, userStateCode, agencyConfigs]);

  const setSelectedStateCode = async (stateCode: StateCode) => {
    if (!canSelectStateCode) {
      throw new Error(
        "User does not have permission to select state codes. Only Recidiviz staff can switch between states.",
      );
    }
    try {
      await saveItem(SELECTED_STATE_KEY, stateCode);
      setSelectedStateCodeInternal(stateCode);
      // Update stateCodeParam synchronously so getPathFromState picks it up on
      // the navigation event that follows this call (e.g. navigate to ClientsRoot).
      stateCodeParam.current = stateCode;
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
