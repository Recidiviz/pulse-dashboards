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
import { useAuth0 } from "react-native-auth0";

import { getItem, saveItem } from "../utils/storage";

// Available state codes with meetings databases
export const AVAILABLE_STATE_CODES = [
  { code: "US_ME", name: "Maine" },
  { code: "US_NC", name: "North Carolina" },
  { code: "US_NE", name: "Nebraska" },
] as const;

export type StateCode = (typeof AVAILABLE_STATE_CODES)[number]["code"];

const DEFAULT_STATE_CODE: StateCode = "US_NE";

interface StateContextType {
  selectedStateCode: StateCode;
  setSelectedStateCode: (stateCode: StateCode) => Promise<void>;
  isLoading: boolean;
  canSelectStateCode: boolean;
  currentStateName: string | undefined;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

const SELECTED_STATE_KEY = "selectedStateCode";

export const StateCodeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth0();
  const [selectedStateCode, setSelectedStateCodeInternal] =
    useState<StateCode>(DEFAULT_STATE_CODE);
  const [isLoading, setIsLoading] = useState(true);

  const userAppMetadata =
    user?.[`https://dashboard.recidiviz.org/app_metadata`];
  const isRecidivizUser = userAppMetadata?.stateCode === "recidiviz";
  // If user is null/undefined, assume they're in skip auth mode (local development)
  const isSkipAuthUser = !user;
  // Show settings for Recidiviz users or skip auth users
  const canSelectStateCode = isRecidivizUser || isSkipAuthUser;
  const currentStateName = AVAILABLE_STATE_CODES.find(
    (s) => s.code === selectedStateCode,
  )?.name;

  // Load saved state code on mount
  useEffect(() => {
    const loadSavedStateCode = async () => {
      try {
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
  }, []);

  const setSelectedStateCode = async (stateCode: StateCode) => {
    try {
      await saveItem(SELECTED_STATE_KEY, stateCode);
      setSelectedStateCodeInternal(stateCode);
    } catch (error) {
      console.error("Failed to save selected state code:", error);
      throw error;
    }
  };

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
