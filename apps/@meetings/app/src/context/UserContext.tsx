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
import React, { createContext, useContext, useEffect } from "react";
import { useAuth0 } from "react-native-auth0";

import { env } from "../shared/config/env";

interface UserContextType {
  isLoading: boolean;
  /**
   * The user's state code (e.g., "US_ND", "US_ME", or "recidiviz").
   * For state users, this is their single assigned state and determines their data access.
   * For Recidiviz staff, this is always "recidiviz" and they can select which state's data to view.
   */
  stateCode: string | undefined;
  name?: string | undefined;
  email?: string | undefined;
  isSkipAuthUser: boolean;
  recidivizAllowedStates: string[];
  hasSupervisionAccess: boolean;
  hasFacilitiesAccess: boolean;
  hasSupervisionAssistantAccess: boolean;
  hasFacilitiesAssistantAccess: boolean;
  hasCasePlanningAssistantAccess: boolean;
  onLogout: ReturnType<typeof useAuth0>["clearSession"];
  getCredentials: ReturnType<typeof useAuth0>["getCredentials"];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserContextProvider: React.FC<{
  isSkipAuthUser: boolean;
  children: React.ReactNode;
}> = ({ isSkipAuthUser, children }) => {
  const { user, isLoading, clearSession, getCredentials } = useAuth0();

  // Fetch credentials when user first loads to populate app_metadata. For some reason this only
  // gets populated on the user if we request credentials.
  useEffect(() => {
    if (!isSkipAuthUser && user && !isLoading) {
      getCredentials(undefined, undefined, {
        audience: env.EXPO_PUBLIC_AUTH0_AUDIENCE,
      });
    }
  }, [isSkipAuthUser, user, isLoading, getCredentials]);

  useEffect(() => {
    if (isSkipAuthUser) {
      Sentry.setUser({ email: "skip-auth-user" });
      return;
    }
    if (user?.email) {
      Sentry.setUser({ email: user.email });
    } else {
      Sentry.setUser(null);
    }
  }, [user?.email, isSkipAuthUser]);

  if (isSkipAuthUser) {
    return (
      <UserContext.Provider
        value={{
          isLoading: false,
          stateCode: "US_NE",
          isSkipAuthUser: true,
          // Agency configs are loaded asynchronously via AgencyConfigContext (which lives inside
          // the tRPC provider, below UserContextProvider in the tree). Skip-auth state selection
          // is still enabled via isSkipAuthUser, so this can safely be empty here.
          recidivizAllowedStates: [],
          hasSupervisionAccess: true,
          hasFacilitiesAccess: true,
          hasSupervisionAssistantAccess: true,
          hasFacilitiesAssistantAccess: true,
          hasCasePlanningAssistantAccess: true,
          onLogout: () => Promise.resolve(),
          getCredentials,
        }}
      >
        {children}
      </UserContext.Provider>
    );
  }

  const userAppMetadata =
    user?.[`https://dashboard.recidiviz.org/app_metadata`];

  const isRecidiviz = userAppMetadata?.stateCode === "recidiviz";
  let allowedStateCodes;
  if (isRecidiviz) {
    allowedStateCodes = userAppMetadata?.allowedStates ?? [];
  } else if (userAppMetadata?.stateCode) {
    allowedStateCodes = [userAppMetadata.stateCode];
  } else {
    allowedStateCodes = [];
  }

  const routes = userAppMetadata?.routes as Record<string, boolean> | undefined;
  return (
    <UserContext.Provider
      value={{
        // If user exists but app_metadata hasn't loaded yet, keep showing loading state
        isLoading: isLoading || (!!user && !userAppMetadata),
        stateCode: userAppMetadata?.stateCode,
        name: user?.name,
        email: user?.email,
        isSkipAuthUser: false,
        recidivizAllowedStates: allowedStateCodes,
        hasSupervisionAccess: isRecidiviz || !!routes?.["meetingsSupervision"],
        hasFacilitiesAccess: isRecidiviz || !!routes?.["meetingsFacilities"],
        hasSupervisionAssistantAccess:
          isRecidiviz ||
          !!routes?.["workflowsSupervision"] ||
          !!routes?.["insights"],
        hasFacilitiesAssistantAccess:
          isRecidiviz || !!routes?.["workflowsFacilities"],
        hasCasePlanningAssistantAccess: isRecidiviz || !!routes?.["cpa"],
        onLogout: async () => {
          await clearSession();
        },
        getCredentials,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserContextProvider");
  }
  return context;
};
