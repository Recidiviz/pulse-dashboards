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

import * as Sentry from "@sentry/react-native";
import { useQueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { getItem, saveItem } from "~@meetings/app/shared/lib/storage";
import type { AgencyConfig } from "~@meetings/config";

import { stateCodeParam } from "./stateCodeParam";

export type StateCode = string;

export const DEFAULT_STATE_CODE: StateCode = "US_DEMO";

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
// The state code the query cache was last used under; see applyStateCode below.
const CACHE_STATE_KEY = "queryCacheStateCode";

export const StateCodeProvider: React.FC<{
  children: React.ReactNode;
  selectedStateRef: React.RefObject<StateCode | null>;
  isSkipAuthUser: boolean;
  recidivizAllowedStates: string[];
  userStateCode: string | undefined;
  agencyConfigs: Record<string, AgencyConfig>;
  /** True while the agency config query hasn't produced data yet. */
  configsPending: boolean;
  /** True while the agency config query is in an error/retry state. */
  configsErrored: boolean;
}> = ({
  children,
  selectedStateRef,
  isSkipAuthUser,
  recidivizAllowedStates,
  userStateCode,
  agencyConfigs,
  configsPending,
  configsErrored,
}) => {
  const queryClient = useQueryClient();
  // For state users, initialize directly to their state code so the ref is correct before the
  // sync effect runs. Others start at the default, not the unvalidated URL param, which could
  // make config.getAll fail before the resolution effect below validates and corrects it.
  const initialStateCode =
    !isSkipAuthUser &&
    userStateCode &&
    userStateCode !== "recidiviz" &&
    recidivizAllowedStates.length <= 1
      ? (userStateCode.toUpperCase() as StateCode)
      : DEFAULT_STATE_CODE;
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

  // Everything that must happen when the state code changes; the synchronous
  // ref writes come first so in-flight requests already carry the new code.
  const applyStateCode = useCallback(
    async (code: StateCode) => {
      stateCodeParam.current = code; // getPathFromState appends this to URLs
      selectedStateRef.current = code; // tRPC statecode header
      // Query keys don't include the state code (it rides on a header), so
      // cached data may belong to another state. Reset before writing the
      // marker so an interrupted switch re-resets on next launch instead of
      // the marker vouching for data that was never cleared.
      if ((await getItem(CACHE_STATE_KEY)) !== code) {
        await queryClient.resetQueries();
        await saveItem(CACHE_STATE_KEY, code);
      }
      setSelectedStateCodeInternal(code);
    },
    [queryClient, selectedStateRef],
  );

  // Load saved state code on mount, or initialize to user's state code if not a Recidiviz user
  useEffect(() => {
    const loadSavedStateCode = async () => {
      // Wait for configs (isPending, unlike isLoading, covers the paused
      // persisted-cache restore) and wait out error retries.
      if (configsPending || configsErrored) return;

      try {
        // For state users, initialize to their state code
        if (!canSelectStateCode) {
          const normalizedStateCode = userStateCode?.toUpperCase() as StateCode;
          if (normalizedStateCode in agencyConfigs) {
            await applyStateCode(normalizedStateCode);
          }
          // If unsupported, keep the default - DrawerNavigator will handle showing NoAccessScreen
          return;
        }

        // URL param takes priority over storage, then the default. Candidates
        // must be a known agency and an allowed state (server always permits US_DEMO).
        const isUsable = (code: string) =>
          code in agencyConfigs &&
          (isSkipAuthUser ||
            code === DEFAULT_STATE_CODE ||
            recidivizAllowedStates.includes(code));
        const param = stateCodeParam.current;
        const saved = await getItem(SELECTED_STATE_KEY);
        let resolved: StateCode = DEFAULT_STATE_CODE;
        if (param && isUsable(param)) {
          resolved = param as StateCode;
        } else if (saved && isUsable(saved)) {
          resolved = saved as StateCode;
        }
        await applyStateCode(resolved);
      } catch (error) {
        console.error("Failed to load saved state code:", error);
        // On error, keep the default
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedStateCode();
  }, [
    canSelectStateCode,
    userStateCode,
    agencyConfigs,
    configsPending,
    configsErrored,
    isSkipAuthUser,
    recidivizAllowedStates,
    applyStateCode,
  ]);

  const setSelectedStateCode = async (stateCode: StateCode) => {
    if (!canSelectStateCode) {
      throw new Error(
        "User does not have permission to select state codes. Only Recidiviz staff can switch between states.",
      );
    }
    try {
      await saveItem(SELECTED_STATE_KEY, stateCode);
      await applyStateCode(stateCode);
    } catch (error) {
      console.error("Failed to save selected state code:", error);
      throw error;
    }
  };

  // Sync state code to ref (for TRPC headers); still needed because
  // initialStateCode seeds state without going through applyStateCode.
  useEffect(() => {
    if (selectedStateRef) {
      selectedStateRef.current = selectedStateCode;
    }
  }, [selectedStateCode, selectedStateRef]);

  useEffect(() => {
    Sentry.setTag("stateCode", selectedStateCode);
  }, [selectedStateCode]);

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
